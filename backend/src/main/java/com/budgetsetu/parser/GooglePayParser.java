package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GooglePayParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern
            .compile("^\\s*(\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,]*\\d{2,4})?|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");
    private static final Pattern GPAY_AMOUNT = Pattern.compile("₹\\s*([\\d,.]+)");

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
            Matcher gpayAmt = GPAY_AMOUNT.matcher(fullText);

            if (gpayAmt.find() && (fullText.contains("UPI Transaction ID") ||
                    fullText.contains("Paid by") ||
                    fullText.contains("Paid to") ||
                    fullText.contains("Received from") ||
                    fullText.contains("Money sent to") ||
                    fullText.contains("Google Pay"))) {

                String amount = gpayAmt.group(1).replace(",", "");
                String type = "DEBIT";
                String narration = fullText;
                String party = null;

                if (fullText.toLowerCase().contains("received from") || fullText.toLowerCase().contains("refund")) {
                    type = "CREDIT";
                    if (fullText.contains("Received from")) {
                        party = extractAfter(fullText, "Received from");
                    }
                } else {
                    type = "DEBIT";
                    if (fullText.contains("Paid to")) {
                        party = extractAfter(fullText, "Paid to");
                    } else if (fullText.contains("Money sent to")) {
                        party = extractAfter(fullText, "Money sent to");
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

                Matcher txIdMatcher = Pattern.compile("UPI Transaction ID\\s*[:\\-]?\\s*(\\d+)").matcher(fullText);
                if (txIdMatcher.find()) {
                    txn.put("transaction_id", txIdMatcher.group(1));
                    txn.put("reference_number", txIdMatcher.group(1)); // Make it explicit
                }

                Matcher paidByMatcher = Pattern.compile("(Paid by|Credited to|Deposited to)\\s+([^₹]+)")
                        .matcher(fullText);
                if (paidByMatcher.find()) {
                    txn.put("remarks", paidByMatcher.group(1) + " " + paidByMatcher.group(2).trim());
                }

                txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
                rows.add(txn);
            }
        }
        return rows;
    }

    private String extractAfter(String text, String prefix) {
        int idx = text.indexOf(prefix);
        if (idx == -1)
            return null;
        String rest = text.substring(idx + prefix.length()).trim();

        // Remove trailing metadata like UPI Transaction ID or Paid by
        rest = rest.replaceAll("(?i)\\s*UPI Transaction ID.*", "");
        rest = rest.replaceAll("(?i)\\s*Paid by.*", "");

        // Assuming party name ends at the first ₹ symbol or next recognizable token
        int amtIdx = rest.indexOf("₹");
        if (amtIdx != -1) {
            rest = rest.substring(0, amtIdx).trim();
        }
        return rest.trim();
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null)
            return false;
        return text.contains("payments made by you on the Google Pay app")
                || (fileName != null && fileName.toLowerCase().contains("gpay"));
    }

    @Override
    public String getBankKey() {
        return "GPAY";
    }

    @Override
    public String getBankDisplayName() {
        return "Google Pay";
    }
}
