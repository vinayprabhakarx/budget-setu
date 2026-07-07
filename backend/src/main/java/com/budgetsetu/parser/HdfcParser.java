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
    private static final Pattern END_PATTERN = Pattern.compile(
            "(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})\\s+" + // Value Date
                    "([\\d,]+\\.\\d{2})\\s+" + // Debit
                    "([\\d,]+\\.\\d{2})\\s+" + // Credit
                    "([\\d,]+\\.\\d{2})\\s*$" // Balance
    );

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

            Matcher endMatcher = END_PATTERN.matcher(fullText);
            if (!endMatcher.find())
                continue;

            Map<String, String> txn = ParserUtil.emptyTransaction();
            txn.put("transaction_date", ParserUtil.normalizeDate(dateStr));
            txn.put("value_date", ParserUtil.normalizeDate(endMatcher.group(1)));

            String debit = endMatcher.group(2);
            String credit = endMatcher.group(3);
            String balance = endMatcher.group(4);

            if (!debit.equals("0.00")) {
                txn.put("transaction_type", "DEBIT");
                txn.put("amount", debit.replace(",", ""));
                txn.put("withdrawal_amount", debit.replace(",", ""));
            } else if (!credit.equals("0.00")) {
                txn.put("transaction_type", "CREDIT");
                txn.put("amount", credit.replace(",", ""));
                txn.put("deposit_amount", credit.replace(",", ""));
            }

            txn.put("balance", balance.replace(",", ""));

            String narration = fullText
                    .substring(dateMatcher.group(0).length(), fullText.length() - endMatcher.group(0).length()).trim();
            txn.put("narration", narration);

            // HDFC Narration parsing
            // UPI-{payee_name}-{upi_id}-{bank_code}-{transaction_id}-PAYMENT FROM PHONE
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
                    // Extract remarks, but strip the repeated transaction ID at the end if it
                    // exists
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
            rows.add(txn);
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
