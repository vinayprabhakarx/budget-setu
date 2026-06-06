package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PhonePeParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*([A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,]*\\d{2,4})?|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");
    private static final Pattern AMOUNT = Pattern.compile("(?:₹|Rs\\.?)\\s*([\\d,.]+)");

    @Override
    public List<Map<String, String>> parseText(String text, String fileName) {
        List<Map<String, String>> rows = new ArrayList<>();
        if (text == null || text.isBlank()) return rows;

        List<List<String>> blocks = groupIntoBlocks(text);

        for (List<String> block : blocks) {
            String fullText = String.join(" ", block).replaceAll("\\s+", " ").trim();
            Matcher dateMatcher = DATE_LEAD.matcher(fullText);
            if (!dateMatcher.find()) continue;

            String dateStr = dateMatcher.group(1);
            Matcher amtMatcher = AMOUNT.matcher(fullText);
            
            if (amtMatcher.find() && (
                    fullText.contains("Transaction ID") ||
                    fullText.contains("Paid to") ||
                    fullText.contains("Payment to") ||
                    fullText.contains("Received from") ||
                    fullText.contains("Sent to") ||
                    fullText.contains("PhonePe"))) {
                
                String amount = amtMatcher.group(1).replace(",", "");
                String type = "DEBIT";
                String narration = fullText;
                String party = null;

                if (fullText.toLowerCase().contains("received from") || fullText.toLowerCase().contains("cashback")) {
                    type = "CREDIT";
                    if (fullText.contains("Received from")) {
                        party = extractAfter(fullText, "Received from");
                    }
                } else {
                    type = "DEBIT";
                    if (fullText.contains("Paid to")) {
                        party = extractAfter(fullText, "Paid to");
                    } else if (fullText.contains("Payment to")) {
                        party = extractAfter(fullText, "Payment to");
                    } else if (fullText.contains("Sent to")) {
                        party = extractAfter(fullText, "Sent to");
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
                    if (type.equals("DEBIT")) txn.put("payee", party);
                    else txn.put("payer", party);
                }

                Matcher txIdMatcher = Pattern.compile("Transaction ID\\s*[:\\-]?\\s*([A-Za-z0-9]+)").matcher(fullText);
                if (txIdMatcher.find()) {
                    txn.put("transaction_id", txIdMatcher.group(1));
                }

                Matcher utrMatcher = Pattern.compile("UTR No\\.?\\s*([A-Za-z0-9]+)").matcher(fullText);
                if (utrMatcher.find()) {
                    txn.put("reference_number", utrMatcher.group(1));
                }

                Matcher paidByMatcher = Pattern.compile("(Paid by|Credited to)\\s+([A-Za-z0-9X]+)").matcher(fullText);
                if (paidByMatcher.find()) {
                    txn.put("remarks", paidByMatcher.group(1) + " " + paidByMatcher.group(2));
                }

                txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
                rows.add(txn);
            }
        }
        return rows;
    }

    private String extractAfter(String text, String prefix) {
        int idx = text.indexOf(prefix);
        if (idx == -1) return null;
        String rest = text.substring(idx + prefix.length()).trim();
        int txIdx = rest.indexOf("Transaction ID");
        if (txIdx != -1) {
            rest = rest.substring(0, txIdx).trim();
        }
        
        // Remove CREDIT, DEBIT, and amounts from the extracted payee name
        rest = rest.replaceAll("(?i)\\s+(CREDIT|DEBIT|SUCCESSFUL|FAILED).*", "").trim();
        rest = rest.replaceAll("\\s*₹.*", "").trim();
        
        return rest;
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null) return false;
        return text.contains("support.phonepe.com/statement") || (fileName != null && fileName.toLowerCase().contains("phonepe"));
    }

    @Override
    public String getBankKey() {
        return "PHONEPE";
    }

    @Override
    public String getBankDisplayName() {
        return "PhonePe";
    }
}
