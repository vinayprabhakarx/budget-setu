package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PaytmParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern
            .compile("^\\s*(\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,']*\\d{2,4}(?!:))?|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");
    private static final Pattern PAYTM_AMOUNT = Pattern.compile("([+-])\\s*Rs\\.\\s*([\\d,.]+)");

    @Override
    public List<Map<String, String>> parseText(String text, String fileName) {
        List<Map<String, String>> rows = new ArrayList<>();
        if (text == null || text.isBlank())
            return rows;

        List<List<String>> blocks = groupIntoBlocks(text);

        for (List<String> block : blocks) {
            String fullText = String.join(" ", block).replaceAll("\\s+", " ").trim();
            Matcher dateMatcher = DATE_LEAD.matcher(fullText);
            if (!dateMatcher.find())
                continue;

            String dateStr = dateMatcher.group(1);
            if (fullText.contains("Total Money Paid") || fullText.contains("Total Money Received")) {
                continue;
            }
            Matcher amtMatcher = PAYTM_AMOUNT.matcher(fullText);

            if (amtMatcher.find()) {
                String sign = amtMatcher.group(1);
                String amount = amtMatcher.group(2).replace(",", "");
                String type = "+".equals(sign) ? "CREDIT" : "DEBIT";

                String narration = fullText;
                String party = null;

                if ("CREDIT".equals(type)) {
                    if (fullText.contains("Received from")) {
                        party = extractBetween(fullText, "Received from", "UPI ID:");
                        if (party == null)
                            party = extractBetween(fullText, "Received from", "Rs.");
                    } else if (fullText.contains("Added to Paytm Wallet")) {
                        party = "Paytm Wallet";
                    }
                } else {
                    if (fullText.contains("Paid to")) {
                        party = extractBetween(fullText, "Paid to", "UPI ID:");
                        if (party == null)
                            party = extractBetween(fullText, "Paid to", "Rs.");
                    } else if (fullText.contains("Money sent to")) {
                        party = extractBetween(fullText, "Money sent to", "UPI ID:");
                        if (party == null)
                            party = extractBetween(fullText, "Money sent to", "Rs.");
                    } else if (fullText.contains("Paid for")) {
                        party = extractBetween(fullText, "Paid for", "UPI ID:");
                        if (party == null)
                            party = extractBetween(fullText, "Paid for", "Rs.");
                    }
                }

                Map<String, String> txn = ParserUtil.emptyTransaction();
                txn.put("transaction_date", ParserUtil.normalizeDate(dateStr));
                txn.put("amount", amount);
                txn.put("transaction_type", type);
                if (type.equals("DEBIT")) {
                    txn.put("withdrawal_amount", amount);
                } else {
                    txn.put("deposit_amount", amount);
                }

                txn.put("narration", narration);
                txn.put("mode", "UPI");

                if (party != null) {
                    if (type.equals("DEBIT"))
                        txn.put("payee", party);
                    else
                        txn.put("payer", party);
                }

                Matcher upiMatcher = Pattern.compile("UPI ID:\\s*([A-Za-z0-9._@-]+)").matcher(fullText);
                if (upiMatcher.find()) {
                    txn.put("upi_id", upiMatcher.group(1));
                }

                Matcher txIdMatcher = Pattern.compile("Ref No:\\s*(\\d+)").matcher(fullText);
                if (txIdMatcher.find()) {
                    txn.put("transaction_id", txIdMatcher.group(1));
                    txn.put("reference_number", txIdMatcher.group(1));
                }

                Matcher noteMatcher = Pattern.compile("Note:\\s*(.*?)\\s*Tag:").matcher(fullText);
                String note = "";
                if (noteMatcher.find()) {
                    note = noteMatcher.group(1).trim();
                }

                Matcher bankMatcher = Pattern.compile("Tag:.*?\\s([A-Za-z\\s]+Bank\\s*-\\s*\\d+)").matcher(fullText);
                if (bankMatcher.find()) {
                    if (!note.isEmpty())
                        note += " | ";
                    note += bankMatcher.group(1).trim();
                }

                if (!note.isEmpty()) {
                    txn.put("remarks", note);
                }

                txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
                rows.add(txn);
            }
        }
        return rows;
    }

    private String extractBetween(String text, String prefix, String suffix) {
        int start = text.indexOf(prefix);
        if (start == -1)
            return null;
        start += prefix.length();
        int end = text.indexOf(suffix, start);
        String result;
        if (end == -1) {
            result = text.substring(start).trim();
            // In Paytm, if suffix is missing, it usually ends at Note: or Tag:
            if (result.contains("Note:"))
                result = result.substring(0, result.indexOf("Note:")).trim();
            if (result.contains("Tag:"))
                result = result.substring(0, result.indexOf("Tag:")).trim();
        } else {
            result = text.substring(start, end).trim();
        }
        if (result.endsWith("-") || result.endsWith("+")) {
            result = result.substring(0, result.length() - 1).trim();
        }
        if (result.contains("Note:")) {
            result = result.substring(0, result.indexOf("Note:")).trim();
        }
        if (result.contains("Tag:")) {
            result = result.substring(0, result.indexOf("Tag:")).trim();
        }
        if (result.endsWith("-") || result.endsWith("+")) {
            result = result.substring(0, result.length() - 1).trim();
        }
        return result;
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null)
            return false;
        return text.contains("Paytm Statement for") || text.contains("payments done by you on Paytm App")
                || (fileName != null && fileName.toLowerCase().contains("paytm"));
    }

    @Override
    public String getBankKey() {
        return "PAYTM";
    }

    @Override
    public String getBankDisplayName() {
        return "Paytm";
    }
}
