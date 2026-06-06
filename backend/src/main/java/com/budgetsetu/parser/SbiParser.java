package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SbiParser extends BaseBankParser {

    private static final Pattern SBI_SUFFIX = Pattern.compile("([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");
    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,]*\\d{2,4})?)");

    @Override
    public List<Map<String, String>> parseText(String text, String fileName) {
        List<Map<String, String>> rows = new ArrayList<>();
        if (text == null || text.isBlank()) return rows;

        List<List<String>> blocks = groupIntoBlocks(text);

        for (List<String> block : blocks) {
            String firstLine = block.get(0);
            Matcher dateMatcher = DATE_LEAD.matcher(firstLine);
            if (!dateMatcher.find()) continue;

            String dateStr = dateMatcher.group(1);
            String fullText = String.join(" ", block).replaceAll("\\s+", " ").trim();

            String cleanLine = fullText.replaceAll("(?i)\\s+(cr|dr|credit|debit)\\s*$", "")
                                       .replaceAll("(?i)\\b(inr|rs\\.?|rupees?)\\b", "")
                                       .trim();

            Matcher sbiMatcher = SBI_SUFFIX.matcher(cleanLine);
            if (sbiMatcher.find()) {
                String debitStr = sbiMatcher.group(1);
                String creditStr = sbiMatcher.group(2);
                String balanceStr = sbiMatcher.group(3);

                Map<String, String> txn = ParserUtil.emptyTransaction();
                txn.put("transaction_date", ParserUtil.normalizeDate(dateStr));
                
                // Removing the amount suffix to get pure narration
                String narration = fullText.substring(0, fullText.length() - sbiMatcher.group(0).length()).trim();
                
                // Clean trailing branch details like "0097738162095 AT 00097 JAMUI -"
                narration = narration.replaceAll("(?i)\\s+\\d{10,}\\s+AT\\s+\\d+\\s+[A-Z]+.*$", "").trim();
                // Clean any trailing standalone hyphens
                narration = narration.replaceAll("(?i)\\s+-$", "").trim();
                // Clean "DEP TFR" or "WDL TFR" from start
                narration = narration.replaceAll("^(?i)(DEP TFR|WDL TFR)\\s+", "").trim();

                txn.put("narration", narration);

                if (!debitStr.equals("-") && !debitStr.isBlank()) {
                    txn.put("transaction_type", "DEBIT");
                    txn.put("amount", debitStr.replace(",", ""));
                    txn.put("withdrawal_amount", debitStr.replace(",", ""));
                } else if (!creditStr.equals("-") && !creditStr.isBlank()) {
                    txn.put("transaction_type", "CREDIT");
                    txn.put("amount", creditStr.replace(",", ""));
                    txn.put("deposit_amount", creditStr.replace(",", ""));
                }

                if (balanceStr != null && !balanceStr.isBlank()) {
                    txn.put("balance", balanceStr.replace(",", ""));
                }

                // Parse SBI Narration: UPI/{direction}/{transaction_id}/{counterparty_name}/{bank_code}/{upi_id}/{remarks}
                if (narration.contains("UPI/")) {
                    txn.put("mode", "UPI");
                    String[] parts = narration.split("/");
                    for (int i = 0; i < parts.length; i++) {
                        if (parts[i].equals("CR") || parts[i].equals("DR")) {
                            if (i + 1 < parts.length) txn.put("transaction_id", parts[i + 1]);
                            if (i + 2 < parts.length) {
                                String counterParty = parts[i + 2].trim();
                                if (txn.get("transaction_type").equals("DEBIT")) {
                                    txn.put("payee", counterParty);
                                } else {
                                    txn.put("payer", counterParty);
                                }
                            }
                            if (i + 4 < parts.length) txn.put("upi_id", parts[i + 4] + "@" + parts[i + 3].toLowerCase());
                            if (i + 5 < parts.length) txn.put("remarks", parts[i + 5].split(" ")[0]); // stop at branch ref
                            break;
                        }
                    }
                } else {
                    txn.put("mode", ParserUtil.detectMode(narration, "OTHER"));
                }
                
                String suggestedCat = ParserUtil.detectSuggestedCategory(narration);
                if (suggestedCat != null) {
                    txn.put("suggested_category", suggestedCat);
                }

                txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
                rows.add(txn);
            }
        }
        return rows;
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null) return false;
        return text.contains("STATE BANK OF INDIA") || text.contains("State Bank of India");
    }

    @Override
    public String getBankKey() {
        return "SBI";
    }

    @Override
    public String getBankDisplayName() {
        return "State Bank of India";
    }
}
