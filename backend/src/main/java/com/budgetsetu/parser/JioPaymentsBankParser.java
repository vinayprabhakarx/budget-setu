package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JioPaymentsBankParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,]*\\d{2,4})?)");
    private static final Pattern TWO_COL = Pattern.compile("([\\d,]*\\d[\\d,.]*)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");
    private static final Pattern THREE_COL = Pattern.compile("([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");

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
            String cleanLine = fullText.replaceAll("(?i)\\s+(cr|dr|credit|debit)\\s*$", "")
                                       .replaceAll("(?i)\\b(inr|rs\\.?|rupees?)\\b", "")
                                       .trim();

            Matcher m3 = THREE_COL.matcher(cleanLine);
            Matcher m2 = TWO_COL.matcher(cleanLine);
            
            String amount = null;
            String balance = null;
            String type = "UNKNOWN";
            String narration = "";

            if (m3.find()) {
                String dr = m3.group(1);
                String cr = m3.group(2);
                balance = m3.group(3).replace(",", "");
                
                if (!dr.equals("-") && !dr.isBlank() && !dr.equals("0.00") && !dr.equals("0")) {
                    amount = dr.replace(",", "");
                    type = "DEBIT";
                } else if (!cr.equals("-") && !cr.isBlank() && !cr.equals("0.00") && !cr.equals("0")) {
                    amount = cr.replace(",", "");
                    type = "CREDIT";
                }
                narration = cleanLine.substring(0, cleanLine.length() - m3.group(0).length()).trim();
            } else if (m2.find()) {
                amount = m2.group(1).replace(",", "");
                balance = m2.group(2).replace(",", "");
                narration = cleanLine.substring(0, cleanLine.length() - m2.group(0).length()).trim();
                
                // Jio often puts DR/CR in narration
                if (narration.contains("/CR/")) type = "CREDIT";
                else if (narration.contains("/DR/")) type = "DEBIT";
                else if (narration.toUpperCase().contains(" CR.") || narration.toUpperCase().contains("CREDIT")) type = "CREDIT";
                else type = "DEBIT";
            } else {
                continue;
            }

            if (amount == null) continue;

            Map<String, String> txn = ParserUtil.emptyTransaction();
            txn.put("transaction_date", ParserUtil.normalizeDate(dateStr));
            txn.put("amount", amount);
            txn.put("balance", balance);
            txn.put("transaction_type", type);
            if (type.equals("DEBIT")) {
                txn.put("withdrawal_amount", amount);
            } else {
                txn.put("deposit_amount", amount);
            }

            txn.put("narration", narration);

            // Parse Jio Payments Bank Narration: UPI/{direction}/{transaction_id}/{counterparty_name}/{bank_code}/{upi_id}/{remarks}
            if (narration.contains("UPI/")) {
                txn.put("mode", "UPI");
                String upiNarration = narration.substring(narration.indexOf("UPI/"));
                String[] parts = upiNarration.split("/");
                
                if (parts.length >= 3) txn.put("transaction_id", parts[2]);
                if (parts.length >= 4) {
                    if (type.equals("DEBIT")) txn.put("payee", parts[3]);
                    else txn.put("payer", parts[3]);
                }
                if (parts.length >= 6) txn.put("upi_id", parts[5] + "@" + parts[4].toLowerCase());
                if (parts.length >= 7) {
                    String rem = parts[6].trim();
                    if (rem.equals("NA") || rem.equals("NO REMARKS")) rem = null;
                    txn.put("remarks", rem);
                }
            } else if (narration.contains("INT Cr.")) {
                txn.put("mode", "INTEREST");
                txn.put("suggested_category", "Interest Income");
            } else {
                txn.put("mode", ParserUtil.detectMode(narration, "OTHER"));
            }

            txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
            rows.add(txn);
        }
        return rows;
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null) return false;
        return text.contains("Jio Payments Bank") || text.contains("JIO PAYMENTS BANK") || text.contains("Jio Payment Bank");
    }

    @Override
    public String getBankKey() {
        return "JIO";
    }

    @Override
    public String getBankDisplayName() {
        return "Jio Payments Bank";
    }
}
