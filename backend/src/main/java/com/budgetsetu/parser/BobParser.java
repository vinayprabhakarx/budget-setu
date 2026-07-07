package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class BobParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");

    private static final Pattern BOB_WITHDRAWAL = Pattern.compile(
            "^\\s*\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}\\s+" +
                    "([\\d,]+\\.\\d{2})(Cr|Dr|CR|DR)\\s*" +
                    "(.*?)\\s+" +
                    "([\\d,]+\\.\\d{2})\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})\\s*$");

    private static final Pattern BOB_DEPOSIT = Pattern.compile(
            "^\\s*\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}\\s+" +
                    "([\\d,]+\\.\\d{2})\\s+" +
                    "([\\d,]+\\.\\d{2})(Cr|Dr|CR|DR)\\s*" +
                    "(.*?)\\s*" +
                    "(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})?\\s*$");

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

            Matcher wdl = BOB_WITHDRAWAL.matcher(fullText);
            Matcher dep = BOB_DEPOSIT.matcher(fullText);

            Map<String, String> txn = ParserUtil.emptyTransaction();
            txn.put("transaction_date", ParserUtil.normalizeDate(dateStr));

            String narration = "";
            if (wdl.find()) {
                txn.put("balance", wdl.group(1).replace(",", ""));
                narration = wdl.group(3).trim();
                String amount = wdl.group(4).replace(",", "");
                txn.put("transaction_type", "DEBIT");
                txn.put("amount", amount);
                txn.put("withdrawal_amount", amount);
                if (wdl.groupCount() >= 5 && wdl.group(5) != null) {
                    txn.put("value_date", ParserUtil.normalizeDate(wdl.group(5)));
                }
            } else if (dep.find()) {
                String amount = dep.group(1).replace(",", "");
                txn.put("balance", dep.group(2).replace(",", ""));
                narration = dep.group(4).trim();
                txn.put("transaction_type", "CREDIT");
                txn.put("amount", amount);
                txn.put("deposit_amount", amount);
                if (dep.groupCount() >= 5 && dep.group(5) != null) {
                    txn.put("value_date", ParserUtil.normalizeDate(dep.group(5)));
                }
            } else {
                continue; // Can't parse amount
            }

            txn.put("narration", narration);

            // Parse BOB Narration: UPI/{transaction_id}/{time}/{prefix}/{upi_id}
            if (narration.contains("UPI/")) {
                txn.put("mode", "UPI");
                String upiStr = narration.substring(narration.indexOf("UPI/"));
                String[] parts = upiStr.split("/");
                if (parts.length >= 2)
                    txn.put("transaction_id", parts[1]);
                if (parts.length >= 3 && parts[2].matches("\\d{2}:\\d{2}:\\d{2}"))
                    txn.put("transaction_time", parts[2]);
                if (parts.length >= 5) {
                    txn.put("upi_id", parts[4]);
                    String handle = parts[4].split("@")[0];
                    if (txn.get("transaction_type").equals("DEBIT")) {
                        txn.put("payee", handle);
                    } else {
                        txn.put("payer", handle);
                    }
                }
            } else if (narration.contains("IMPS/")) {
                txn.put("mode", "IMPS");
                String impsStr = narration.substring(narration.indexOf("IMPS/"));
                String[] parts = impsStr.split("/");
                if (parts.length >= 3)
                    txn.put("transaction_id", parts[2]);
                if (parts.length >= 5)
                    txn.put("remarks", parts[4]);
            } else if (narration.contains("Int.Pd")) {
                txn.put("mode", "INTEREST");
                txn.put("remarks", narration.substring(narration.indexOf("Int.Pd")));
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
        return text.contains("Bank of Baroda") || text.contains("BANK OF BARODA") || 
               text.contains("NARRATION DEPOSIT(CR)TRAN DATE CHQ.NO. WITHDRAWAL(DR) BALANCE(INR)VALUE DATE");
    }

    @Override
    public String getBankKey() {
        return "BOB";
    }

    @Override
    public String getBankDisplayName() {
        return "Bank of Baroda";
    }
}
