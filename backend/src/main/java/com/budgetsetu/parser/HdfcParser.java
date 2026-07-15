package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class HdfcParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");

    private static final Pattern END_4 = Pattern.compile(
            "(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})\\s+" + // Value Date
                    "([\\d,]+(?:\\.\\d{1,2})?)\\s+" + // Debit
                    "([\\d,]+(?:\\.\\d{1,2})?)\\s+" + // Credit
                    "([-\\d,]+(?:\\.\\d{1,2})?)\\s*$" // Balance
    );
    private static final Pattern END_3 = Pattern.compile(
            "\\s+([\\d,]+(?:\\.\\d{1,2})?)\\s+" + // Debit
                    "([\\d,]+(?:\\.\\d{1,2})?)\\s+" + // Credit
                    "([-\\d,]+(?:\\.\\d{1,2})?)\\s*$" // Balance
    );
    private static final Pattern END_2 = Pattern.compile(
            "\\s+([\\d,]+(?:\\.\\d{1,2})?)\\s+" + // Amount
                    "(DR|CR|DEBIT|CREDIT)?\\s*" + // optional DR/CR
                    "([-\\d,]+(?:\\.\\d{1,2})?)\\s*$", // Balance
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern END_FLEXIBLE = Pattern.compile(
            "\\s+([\\d,]+(?:\\.\\d{1,2})?)\\s*(DR|CR|DEBIT|CREDIT)?\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    @Override
    public List<Map<String, String>> parseText(String text, String fileName) {
        List<Map<String, String>> rows = new ArrayList<>();
        if (text == null || text.isBlank())
            return rows;

        List<List<String>> blocks = groupIntoBlocks(text);
        for (List<String> block : blocks) {
            String fullText = String.join(" ", block).replaceAll("\\s+", " ").trim();
            Map<String, String> txn = parseLineOrBlock(fullText);
            if (txn != null) {
                rows.add(txn);
            }
        }

        if (rows.isEmpty()) {
            String[] lines = text.split("\\r?\\n");
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;
                Map<String, String> txn = parseLineOrBlock(trimmed);
                if (txn != null) {
                    rows.add(txn);
                }
            }
        }

        if (rows.isEmpty()) {
            rows.addAll(parseDelimitedLines(text));
        }

        return rows;
    }

    private Map<String, String> parseLineOrBlock(String fullText) {
        Matcher dateMatcher = DATE_LEAD.matcher(fullText);
        if (!dateMatcher.find())
            return null;

        String dateStr = dateMatcher.group(1);
        String debit = null;
        String credit = null;
        String balance = null;
        String valueDate = null;
        int narrationEndIdx = -1;

        Matcher m4 = END_4.matcher(fullText);
        if (m4.find()) {
            valueDate = m4.group(1);
            debit = m4.group(2);
            credit = m4.group(3);
            balance = m4.group(4);
            narrationEndIdx = m4.start();
        } else {
            Matcher m3 = END_3.matcher(fullText);
            if (m3.find()) {
                debit = m3.group(1);
                credit = m3.group(2);
                balance = m3.group(3);
                narrationEndIdx = m3.start();
            } else {
                Matcher m2 = END_2.matcher(fullText);
                if (m2.find()) {
                    String amt = m2.group(1);
                    String drCr = m2.group(2);
                    balance = m2.group(3);
                    narrationEndIdx = m2.start();
                    if (drCr != null && (drCr.equalsIgnoreCase("CR") || drCr.equalsIgnoreCase("CREDIT"))) {
                        credit = amt;
                        debit = "0.00";
                    } else {
                        debit = amt;
                        credit = "0.00";
                    }
                } else {
                    Matcher mFlex = END_FLEXIBLE.matcher(fullText);
                    if (mFlex.find()) {
                        String amt = mFlex.group(1);
                        String drCr = mFlex.group(2);
                        narrationEndIdx = mFlex.start();
                        if (drCr != null && (drCr.equalsIgnoreCase("CR") || drCr.equalsIgnoreCase("CREDIT"))) {
                            credit = amt;
                            debit = "0.00";
                        } else {
                            debit = amt;
                            credit = "0.00";
                        }
                    } else {
                        return null;
                    }
                }
            }
        }

        Map<String, String> txn = ParserUtil.emptyTransaction();
        txn.put("transaction_date", ParserUtil.normalizeDate(dateStr));
        if (valueDate != null) {
            txn.put("value_date", ParserUtil.normalizeDate(valueDate));
        }

        boolean hasDebit = debit != null && !debit.equals("0.00") && !debit.equals("0.0") && !debit.equals("0");
        boolean hasCredit = credit != null && !credit.equals("0.00") && !credit.equals("0.0") && !credit.equals("0");

        if (hasDebit && debit != null) {
            txn.put("transaction_type", "DEBIT");
            txn.put("amount", debit.replace(",", ""));
            txn.put("withdrawal_amount", debit.replace(",", ""));
        } else if (hasCredit && credit != null) {
            txn.put("transaction_type", "CREDIT");
            txn.put("amount", credit.replace(",", ""));
            txn.put("deposit_amount", credit.replace(",", ""));
        } else {
            return null;
        }

        if (balance != null) {
            txn.put("balance", balance.replace(",", ""));
        }

        int startIdx = dateMatcher.group(0).length();
        String narration = (narrationEndIdx > startIdx)
                ? fullText.substring(startIdx, narrationEndIdx).trim()
                : fullText.substring(startIdx).trim();
        txn.put("narration", narration);

        if (narration.contains("UPI-")) {
            txn.put("mode", "UPI");
            String upiStr = narration.substring(narration.indexOf("UPI-"));
            String[] parts = upiStr.split("-");
            if (parts.length >= 2)
                txn.put("payee", parts[1]);
            if (parts.length >= 3)
                txn.put("upi_id", parts[2]);
            if (parts.length >= 5)
                txn.put("transaction_id", parts[4]);
            if (parts.length >= 6) {
                String remarks = parts[5];
                String txId = txn.get("transaction_id");
                if (txId != null && remarks.endsWith(" " + txId)) {
                    remarks = remarks.substring(0, remarks.length() - txId.length() - 1).trim();
                }
                txn.put("remarks", remarks);
            }
        } else {
            txn.put("mode", ParserUtil.detectMode(narration, "OTHER"));
        }

        String suggestedCat = ParserUtil.detectSuggestedCategory(narration);
        if (suggestedCat != null && !txn.containsKey("suggested_category")) {
            txn.put("suggested_category", suggestedCat);
        }

        txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
        return txn;
    }

    private List<Map<String, String>> parseDelimitedLines(String text) {
        List<Map<String, String>> rows = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            if (line.trim().isEmpty()) continue;
            String[] parts = line.split("\\t|,");
            if (parts.length < 3) continue;
            Matcher dm = DATE_LEAD.matcher(parts[0]);
            if (!dm.find()) continue;

            Map<String, String> txn = ParserUtil.emptyTransaction();
            txn.put("transaction_date", ParserUtil.normalizeDate(dm.group(1)));

            String description = parts[1].trim();
            txn.put("narration", description);

            for (int i = 2; i < parts.length; i++) {
                String val = parts[i].trim().replace(",", "");
                if (val.matches("\\d+(?:\\.\\d{1,2})?")) {
                    txn.put("amount", val);
                    break;
                }
            }
            if (txn.get("amount") != null) {
                txn.put("transaction_type", "DEBIT");
                rows.add(txn);
            }
        }
        return rows;
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null)
            return false;
        return text.contains("HDFC Bank") || text.contains("HDFC BANK");
    }

    @Override
    public String getBankKey() {
        return "HDFC";
    }

    @Override
    public String getBankDisplayName() {
        return "HDFC Bank";
    }
}
