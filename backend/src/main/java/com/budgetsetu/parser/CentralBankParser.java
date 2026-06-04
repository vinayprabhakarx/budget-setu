package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CentralBankParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");
    private static final Pattern TWO_COL = Pattern.compile("([\\d,]*\\d[\\d,.]*)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");

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
            String cleanLine = fullText.replaceAll("(?i)\\s+(cr|dr|credit|debit)\\s*$", "")
                    .replaceAll("(?i)\\b(inr|rs\\.?|rupees?)\\b", "")
                    .trim();

            Matcher m2 = TWO_COL.matcher(cleanLine);

            String amount = null;
            String balance = null;
            String type = "UNKNOWN";
            String narration = "";

            if (m2.find()) {
                amount = m2.group(1).replace(",", "");
                balance = m2.group(2).replace(",", "");

                // m2 was matched on cleanLine, so we should take substring of cleanLine
                narration = cleanLine.substring(0, cleanLine.length() - m2.group(0).length()).trim();

                // Fallback type inference based on keywords
                String nUp = narration.toUpperCase();
                if (nUp.contains("CREDIT") || nUp.contains("DEP") || nUp.contains("BY TRANSFER")
                        || nUp.contains("INT.PD")) {
                    type = "CREDIT";
                } else {
                    type = "DEBIT";
                }
            } else {
                continue;
            }

            if (amount == null)
                continue;

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

            // Parse Central Bank Narration
            if (narration.contains("BY TRANSFER/UPI/RRN")) {
                txn.put("mode", "UPI");
                String rest = narration
                        .substring(narration.indexOf("BY TRANSFER/UPI/RRN") + "BY TRANSFER/UPI/RRN".length()).trim();
                String[] parts = rest.split("/");
                if (parts.length >= 1)
                    txn.put("transaction_id", parts[0].trim());
                if (parts.length >= 2) {
                    String[] remName = parts[1].split("_", 2);
                    if (remName.length == 2) {
                        txn.put("remarks", remName[0].trim());
                        if (type.equals("DEBIT"))
                            txn.put("payee", remName[1].trim());
                        else
                            txn.put("payer", remName[1].trim());
                    } else {
                        if (type.equals("DEBIT"))
                            txn.put("payee", parts[1].trim());
                        else
                            txn.put("payer", parts[1].trim());
                    }
                }
            } else if (narration.contains("BY TRANSFER/NEFT")) {
                txn.put("mode", "NETBANKING");
                String rest = narration.substring(narration.indexOf("BY TRANSFER/NEFT") + "BY TRANSFER/NEFT".length())
                        .trim();
                String[] parts = rest.split("\\s+");
                if (parts.length > 0) {
                    txn.put("transaction_id", parts[parts.length - 1]);
                    String party = rest.substring(0, rest.lastIndexOf(parts[parts.length - 1])).trim();
                    if (type.equals("DEBIT"))
                        txn.put("payee", party);
                    else
                        txn.put("payer", party);
                }
            } else if (narration.contains("ATM WDL/")) {
                txn.put("mode", "CARD");
            } else if (narration.contains("POS PRCH/")) {
                txn.put("mode", "CARD");
                String[] parts = narration.split("/");
                if (parts.length >= 3) {
                    String[] ecom = parts[2].split("\\|");
                    if (ecom.length == 2)
                        txn.put("payee", ecom[1].trim());
                }
            } else if (narration.contains("BY TRANSFER/IMPSP2A")) {
                txn.put("mode", "NETBANKING");
                String rest = narration
                        .substring(narration.indexOf("BY TRANSFER/IMPSP2A") + "BY TRANSFER/IMPSP2A".length()).trim();
                String[] parts = rest.split("\\s+", 2);
                if (parts.length == 2) {
                    txn.put("transaction_id", parts[0].trim());
                    if (type.equals("DEBIT"))
                        txn.put("payee", parts[1].trim());
                    else
                        txn.put("payer", parts[1].trim());
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
        return text.contains("Central Bank of India") || text.contains("CENTRAL BANK OF INDIA");
    }

    @Override
    public String getBankKey() {
        return "CBI";
    }

    @Override
    public String getBankDisplayName() {
        return "Central Bank of India";
    }
}
