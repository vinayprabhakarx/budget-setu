package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class IciciParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");
    private static final Pattern THREE_COL = Pattern.compile("([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");
    private static final Pattern TWO_COL = Pattern.compile("([\\d,]*\\d[\\d,.]*)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");

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
                narration = cleanLine.substring(dateMatcher.group(0).length(), cleanLine.length() - m3.group(0).length()).trim();
            } else if (m2.find()) {
                amount = m2.group(1).replace(",", "");
                balance = m2.group(2).replace(",", "");
                narration = cleanLine.substring(dateMatcher.group(0).length(), cleanLine.length() - m2.group(0).length()).trim();
                
                if (narration.toUpperCase().contains("CREDIT") || narration.toUpperCase().contains("DEP ")) {
                    type = "CREDIT";
                } else {
                    type = "DEBIT";
                }
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

            // Parse ICICI Narration: UPI/{payee_name}/{upi_id}/{remarks}/{bank_name}/{transaction_id}/...
            if (narration.contains("UPI/")) {
                txn.put("mode", "UPI");
                String upiStr = narration.substring(narration.indexOf("UPI/"));
                String[] parts = upiStr.split("/");
                if (parts.length >= 2) {
                    if (type.equals("DEBIT")) txn.put("payee", parts[1]);
                    else txn.put("payer", parts[1]);
                }
                if (parts.length >= 3) txn.put("upi_id", parts[2]);
                if (parts.length >= 4) {
                    String rem = parts[3].trim();
                    if (rem.equals("NO REMARKS") || rem.equals("NA")) rem = null;
                    txn.put("remarks", rem);
                }
                if (parts.length >= 6) txn.put("transaction_id", parts[5]);
            } else if (narration.contains("VIN/") || narration.contains("INF/")) {
                txn.put("mode", "NETBANKING");
                String netStr = narration.contains("VIN/") ? narration.substring(narration.indexOf("VIN/")) : narration.substring(narration.indexOf("INF/"));
                String[] parts = netStr.split("/");
                if (parts.length >= 2) {
                    if (type.equals("DEBIT")) txn.put("payee", parts[1]);
                    else txn.put("payer", parts[1]);
                }
                if (parts.length >= 4) txn.put("transaction_id", parts[3]);
            } else if (narration.contains("VISA REF ")) {
                txn.put("mode", "OTHER");
                String merchant = narration.substring(narration.indexOf("VISA REF")).replace("VISA REF", "").trim();
                txn.put("payee", merchant);
                txn.put("suggested_category", "Refunds");
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
        if (text == null) return false;
        return text.contains("ICICI Bank") || text.contains("ICICI BANK") || text.contains("www.icici.bank.in");
    }

    @Override
    public String getBankKey() {
        return "ICICI";
    }

    @Override
    public String getBankDisplayName() {
        return "ICICI Bank";
    }
}
