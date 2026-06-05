package com.budgetsetu.parser;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GenericPdfParser implements StatementParser {

    private static final Pattern DATE_LEAD = Pattern.compile(
        "^\\s*(" +
        "\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}" +
        "|" +
        "\\d{1,2}[-\\s]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:[-\\s,]*\\d{2,4})?" +
        ")"
    );

    private static final Pattern SBI_SUFFIX = Pattern.compile("([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");
    private static final Pattern TWO_NUMBERS_SUFFIX = Pattern.compile("([\\d,]*\\d[\\d,.]*)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");

    private static final Pattern BOB_WITHDRAWAL = Pattern.compile(
        "^\\s*\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}\\s+" +
        "([\\d,]+\\.\\d{2})(Cr|Dr|CR|DR)\\s*" +
        "(.*?)\\s+" +
        "([\\d,]+\\.\\d{2})\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})\\s*$"
    );

    private static final Pattern BOB_DEPOSIT = Pattern.compile(
        "^\\s*\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}\\s+" +
        "([\\d,]+\\.\\d{2})\\s+" +
        "([\\d,]+\\.\\d{2})(Cr|Dr|CR|DR)\\s*" +
        "(.*?)\\s*" +
        "(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})?\\s*$"
    );

    private static final Pattern PAYTM_AMOUNT = Pattern.compile("([+-])\\s*Rs\\.\\s*([\\d,.]+)");
    private static final Pattern GPAY_AMOUNT = Pattern.compile("₹\\s*([\\d,.]+)");

    @Override
    public List<Map<String, String>> parse(InputStream inputStream, String fileName) {
        return parse(inputStream, fileName, null);
    }

    public List<Map<String, String>> parse(InputStream inputStream, String fileName, String password) {
        List<Map<String, String>> rows = new ArrayList<>();

        try {
            byte[] bytes = inputStream.readAllBytes();
            String text;
            try (PDDocument document = password == null || password.isEmpty() ? Loader.loadPDF(bytes) : Loader.loadPDF(bytes, password)) {
                text = new PDFTextStripper().getText(document).replace("\u0000", "");
            }

            List<List<String>> blocks = groupIntoBlocks(text);

            double runningBalance = 0.0;
            boolean hasRunningBalance = false;

            for (List<String> block : blocks) {
                String firstLine = block.get(0);
                Matcher dateMatcher = DATE_LEAD.matcher(firstLine);
                if (!dateMatcher.find()) {
                    continue;
                }
                String dateStr = dateMatcher.group(1);

                // Reconstruct full text / narration
                StringBuilder fullTextSb = new StringBuilder();
                for (String line : block) {
                    fullTextSb.append(line).append(" ");
                }
                String fullText = fullTextSb.toString().replaceAll("\\s+", " ").trim();

                // Check for opening balance / brought forward
                if (fullText.contains("B/F") || fullText.contains("Brought Forward") || fullText.contains("B/f")) {
                    Matcher numMatcher = Pattern.compile("([\\d,]+\\.\\d{2})").matcher(fullText);
                    if (numMatcher.find()) {
                        try {
                            runningBalance = Double.parseDouble(numMatcher.group(1).replace(",", ""));
                            hasRunningBalance = true;
                        } catch (NumberFormatException ignored) {}
                    }
                    continue;
                }

                String cleanLine = fullText.replaceAll("(?i)\\s+(cr|dr|credit|debit)\\s*$", "")
                                           .replaceAll("(?i)\\b(inr|rs\\.?|rupees?)\\b", "")
                                           .replaceAll("\\s+", " ")
                                           .trim();

                Matcher paytmAmt = PAYTM_AMOUNT.matcher(fullText);
                Matcher gpayAmt = GPAY_AMOUNT.matcher(fullText);
                Matcher bobWdl = BOB_WITHDRAWAL.matcher(fullText);
                Matcher bobDep = BOB_DEPOSIT.matcher(fullText);
                Matcher sbiMatcher = SBI_SUFFIX.matcher(cleanLine);
                Matcher twoNumMatcher = TWO_NUMBERS_SUFFIX.matcher(cleanLine);

                String type = "UNKNOWN";
                double amount = 0.0;
                double balance = 0.0;
                boolean parsed = false;

                boolean isSbi = false;
                String debitStr = "";
                String creditStr = "";
                String balanceStr = "";
                if (sbiMatcher.find()) {
                    debitStr = sbiMatcher.group(1);
                    creditStr = sbiMatcher.group(2);
                    balanceStr = sbiMatcher.group(3);
                    if (isThreeColumnMatch(debitStr, creditStr)) {
                        isSbi = true;
                    }
                }

                try {
                    if (paytmAmt.find()) {
                        String sign = paytmAmt.group(1);
                        amount = Double.parseDouble(paytmAmt.group(2).replace(",", ""));
                        type = "+".equals(sign) ? "INCOME" : "EXPENSE";
                        parsed = true;
                    } else if (gpayAmt.find() && (
                            fullText.contains("UPI Transaction ID") ||
                            fullText.contains("Paid by") ||
                            fullText.contains("Paid to") ||
                            fullText.contains("Received from") ||
                            fullText.contains("Money sent to"))) {
                        amount = Double.parseDouble(gpayAmt.group(1).replace(",", ""));
                        if (fullText.toLowerCase().contains("received from") || fullText.toLowerCase().contains("refund")) {
                            type = "INCOME";
                        } else {
                            type = "EXPENSE";
                        }
                        parsed = true;
                    } else if (bobWdl.find()) {
                        balance = Double.parseDouble(bobWdl.group(1).replace(",", ""));
                        amount = Double.parseDouble(bobWdl.group(4).replace(",", ""));
                        type = "EXPENSE";
                        parsed = true;
                    } else if (bobDep.find()) {
                        amount = Double.parseDouble(bobDep.group(1).replace(",", ""));
                        balance = Double.parseDouble(bobDep.group(2).replace(",", ""));
                        type = "INCOME";
                        parsed = true;
                    } else if (isSbi) {
                        balance = Double.parseDouble(balanceStr.replace(",", ""));
                        double debitVal = 0.0;
                        double creditVal = 0.0;
                        try {
                            if (!debitStr.equals("-") && !debitStr.trim().isEmpty()) {
                                debitVal = Double.parseDouble(debitStr.replace(",", ""));
                            }
                        } catch (NumberFormatException ignored) {}
                        try {
                            if (!creditStr.equals("-") && !creditStr.trim().isEmpty()) {
                                creditVal = Double.parseDouble(creditStr.replace(",", ""));
                            }
                        } catch (NumberFormatException ignored) {}

                        if (debitVal > 0.0) {
                            amount = debitVal;
                            type = "EXPENSE";
                        } else if (creditVal > 0.0) {
                            amount = creditVal;
                            type = "INCOME";
                        }
                        parsed = true;
                    } else if (twoNumMatcher.find()) {
                        String amtStr = twoNumMatcher.group(1);
                        String balStr = twoNumMatcher.group(2);

                        amount = Double.parseDouble(amtStr.replace(",", ""));
                        balance = Double.parseDouble(balStr.replace(",", ""));

                        if (hasRunningBalance) {
                            double diffDebit = Math.abs(runningBalance - amount - balance);
                            double diffCredit = Math.abs(runningBalance + amount - balance);
                            if (diffDebit < 0.05) {
                                type = "EXPENSE";
                            } else if (diffCredit < 0.05) {
                                type = "INCOME";
                            } else {
                                // Fallback using keywords
                                if (fullText.toLowerCase().contains("cr") || fullText.toLowerCase().contains("credit") || fullText.toLowerCase().contains("dep")) {
                                    type = "INCOME";
                                } else {
                                    type = "EXPENSE";
                                }
                            }
                        } else {
                            // Fallback using keywords
                            if (fullText.toLowerCase().contains("cr") || fullText.toLowerCase().contains("credit") || fullText.toLowerCase().contains("dep")) {
                                 type = "INCOME";
                            } else {
                                type = "EXPENSE";
                            }
                        }
                        runningBalance = balance;
                        hasRunningBalance = true;
                        parsed = true;
                    }
                } catch (NumberFormatException e) {
                    // skip block if parsing fails
                }

                if (parsed) {
                    String merchantName = extractCounterparty(fullText);
                    String referenceNumber = extractReferenceNumber(fullText);
                    String note = extractNote(fullText);
                    Map<String, String> row = new HashMap<>();
                    row.put("date", dateStr);
                    row.put("amount", String.valueOf(amount));
                    row.put("debit", "EXPENSE".equals(type) ? String.valueOf(amount) : "");
                    row.put("credit", "INCOME".equals(type) ? String.valueOf(amount) : "");
                    row.put("transaction_type", type);
                    row.put("description", fullText);
                    row.put("note", note == null ? "" : note);
                    row.put("merchant_name", merchantName == null ? "" : merchantName);
                    row.put("payee", merchantName == null ? "" : merchantName);
                    row.put("reference_number", referenceNumber == null ? "" : referenceNumber);
                    row.put("balance", String.valueOf(runningBalance));
                    row.put("raw_row", fullText);
                    rows.add(row);
                }
            }
            return rows;
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException ex) {
            if (password == null || password.isEmpty()) {
                throw new IllegalArgumentException("PASSWORD_REQUIRED");
            } else {
                throw new IllegalArgumentException("INCORRECT_PASSWORD");
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("This PDF file could not be read.");
        }
    }

    @Override
    public String getSource() {
        return "GENERIC_PDF";
    }

    private List<List<String>> groupIntoBlocks(String text) {
        String[] lines = text.split("\\R");
        List<List<String>> blocks = new ArrayList<>();
        List<String> currentBlock = new ArrayList<>();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            Matcher m = DATE_LEAD.matcher(trimmed);
            if (m.find()) {
                if (!currentBlock.isEmpty()) {
                    blocks.add(currentBlock);
                    currentBlock = new ArrayList<>();
                }
                currentBlock.add(trimmed);
            } else {
                if (!currentBlock.isEmpty()) {
                    if (isHeaderOrFooter(trimmed)) {
                        blocks.add(currentBlock);
                        currentBlock = new ArrayList<>();
                    } else {
                        currentBlock.add(trimmed);
                    }
                }
            }
        }
        if (!currentBlock.isEmpty()) {
            blocks.add(currentBlock);
        }
        return blocks;
    }

    private boolean isHeaderOrFooter(String line) {
        String lower = line.toLowerCase();
        return lower.contains("page ") ||
               lower.contains("page no") ||
               lower.contains("statement of transactions") ||
               lower.contains("date mode particulars") ||
               lower.contains("txn date") ||
               lower.contains("particulars") ||
               lower.contains("sincerely") ||
               lower.contains("legends for") ||
               lower.contains("computer generated") ||
               lower.contains("please do not share") ||
               lower.contains("statement summary") ||
               lower.contains("transaction details") ||
               lower.contains("debits credits balance") ||
               lower.contains("post date value date") ||
               lower.contains("customer id:") ||
               lower.contains("account statement as on") ||
               lower.contains("contact-us@") ||
               lower.contains("total:") ||
               lower.contains("total ") ||
               lower.contains("account related other information") ||
               lower.contains("account type") ||
               lower.contains("nominee name") ||
               lower.contains("ending balance") ||
               lower.contains("team icici bank") ||
               lower.contains("transaction statement") ||
               lower.contains("date & time") ||
               lower.contains("passbook payments history") ||
               lower.contains("notes & tags") ||
               lower.contains("your account") ||
               lower.contains("all payments done by you") ||
               lower.contains("generation date") ||
               lower.contains("hdfc bank") ||
               lower.contains("digitally signed") ||
               lower.contains("signature not verified") ||
               lower.contains("digital signature") ||
               lower.contains("reason:") ||
               lower.contains("location:") ||
               lower.contains("gstin") ||
               lower.contains("registered office address") ||
               lower.contains("contents of this statement") ||
               lower.contains("statement from") ||
               lower.contains("account branch") ||
               lower.contains("a/c open date") ||
               lower.contains("cust id") ||
               lower.contains("account status") ||
               lower.contains("account number") ||
               lower.contains("joint holders") ||
               lower.contains("pr.code br.code") ||
               lower.contains("expected amb") ||
               lower.contains("nomination") ||
               lower.contains("micr :") ||
               lower.contains("not applicable") ||
               lower.contains("legend for transactions") ||
               lower.contains("rupay debit card") ||
               lower.contains("grievance redressal") ||
               lower.contains("jiopayments") ||
               lower.contains("jio payments") ||
               lower.contains("kopar khairane") ||
               lower.contains("we.care@") ||
               lower.contains("dhirubhai ambani") ||
               lower.contains("opening balance") ||
               lower.contains("closing balance") ||
               lower.contains("total withdrawals") ||
               lower.contains("total deposits") ||
               lower.contains("value date") ||
               lower.contains("narration withdrawals") ||
               lower.contains("statement for account") ||
               lower.contains("account type balance") ||
               lower.contains("savings account") ||
               lower.contains("ifsc code") ||
               lower.contains("customer id") ||
               lower.contains("national electronic") ||
               lower.contains("immediate payment") ||
               lower.contains("real time gross") ||
               lower.contains("unified payment") ||
               lower.contains("transaction identification") ||
               lower.contains("complimentary insurance") ||
               lower.contains("computer generated") ||
               lower.contains("account statement") ||
               lower.contains("transaction date") ||
               lower.contains("account opening date") ||
               lower.startsWith(":") ||
               lower.equals("other") ||
               lower.equals("address") ||
               lower.equals("email") ||
               lower.equals("currency") ||
               lower.equals("limit") ||
               lower.equals("city") ||
               lower.equals("phone no.") ||
               lower.equals("india") ||
               lower.equals("bihar") ||
               lower.equals("jamui") ||
               lower.equals("opening") ||
               lower.equals("balance") ||
               lower.equals("total") ||
               lower.equals("withdrawals") ||
               lower.equals("deposits") ||
               lower.equals("no. of") ||
               lower.equals("closing");
    }

    private boolean isThreeColumnMatch(String debit, String credit) {
        if (debit == null || credit == null) return false;
        String d = debit.trim();
        String c = credit.trim();
        boolean isDebitEmpty = d.equals("-") || d.equals("0.00") || d.equals("0.0") || d.equals("0") || d.isEmpty();
        boolean isCreditEmpty = c.equals("-") || c.equals("0.00") || c.equals("0.0") || c.equals("0") || c.isEmpty();
        return (isDebitEmpty || isCreditEmpty) && !(isDebitEmpty && isCreditEmpty);
    }

    private String extractCounterparty(String text) {
        String[] patterns = {
                "(?i)\\bpaid to\\s+([^\\n\\r]+?)(?:\\s+upi\\s+id:|\\s+upi\\s+ref\\s+no:|\\s+note:|\\s+tag:|$)",
                "(?i)\\breceived from\\s+([^\\n\\r]+?)(?:\\s+upi\\s+id:|\\s+upi\\s+ref\\s+no:|\\s+note:|\\s+tag:|$)",
                "(?i)\\bmoney sent to\\s+([^\\n\\r]+?)(?:\\s+upi\\s+id:|\\s+upi\\s+ref\\s+no:|\\s+note:|\\s+tag:|$)",
                "(?i)\\brefund from\\s+([^\\n\\r]+?)(?:\\s+upi\\s+id:|\\s+upi\\s+ref\\s+no:|\\s+note:|\\s+tag:|$)",
                "(?i)\\bpay to\\s+([^\\n\\r]+?)(?:\\s+upi\\s+id:|\\s+upi\\s+ref\\s+no:|\\s+note:|\\s+tag:|$)",
                "(?i)\\bpaid by\\s+([^\\n\\r]+?)(?:\\s+upi\\s+transaction\\s+id:|\\s+upi\\s+ref\\s+no:|\\s+note:|\\s+tag:|$)"
        };
        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(text);
            if (matcher.find()) {
                String value = matcher.group(1).trim();
                value = value.replaceAll("\\s{2,}", " ");
                value = value.replaceAll("(?i)^(mr\\.?|mrs\\.?|ms\\.?|dr\\.?|to)\\s+", "");
                return value.trim();
            }
        }
        return null;
    }

    private String extractReferenceNumber(String text) {
        String[] patterns = {
                "(?i)upi\\s+ref\\s+no\\.?\\s*:?\\s*(\\d+)",
                "(?i)upi\\s+transaction\\s+id\\s*:?\\s*(\\d+)",
                "(?i)rrn\\s*:?\\s*(\\d+)",
                "(?i)txn\\s+id\\s*:?\\s*(\\d+)"
        };
        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(text);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private String extractNote(String text) {
        Matcher matcher = Pattern.compile("(?i)\\bnote\\s*:?\\s*(.+?)(?:\\s+tag:|\\s+upi\\s+id:|\\s+upi\\s+ref\\s+no:|$)").matcher(text);
        if (matcher.find()) {
            return matcher.group(1).replaceAll("\\s{2,}", " ").trim();
        }
        return null;
    }
}
