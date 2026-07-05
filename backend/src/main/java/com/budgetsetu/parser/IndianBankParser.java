package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class IndianBankParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern
            .compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,]*\\d{2,4})?)");
    private static final Pattern THREE_COL = Pattern
            .compile("([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*|\\-)\\s+([\\d,]*\\d[\\d,.]*)\\s*$");
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

                if (narration.toUpperCase().contains("CREDIT") || narration.toUpperCase().contains("DEP ")) {
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

            // Indian Bank uses `/` heavily in narration, sometimes spread across newlines
            // Re-join from original block to preserve structure if possible, but fullText
            // is already space joined.
            // But we might have spaces around `/`. Let's clean it up.
            String cleanNarration = narration.replaceAll("\\s*/\\s*", "/");
            txn.put("narration", cleanNarration);

            // Parse Indian Bank Narration:
            // {bank_code}/{counterparty_name}/{masked_account}/...
            // Often UPI lines have /UPI/ inside them. Let's find /UPI/
            if (cleanNarration.contains("/UPI/")) {
                txn.put("mode", "UPI");
                String[] parts = cleanNarration.split("/");

                if (parts.length >= 2) {
                    if (type.equals("DEBIT"))
                        txn.put("payee", parts[1]);
                    else
                        txn.put("payer", parts[1]);
                }

                for (int i = 0; i < parts.length; i++) {
                    if (parts[i].equals("UPI")) {
                        if (i - 1 >= 0 && parts[i - 1].contains("@")) {
                            txn.put("upi_id", parts[i - 1]);
                        }
                        if (i + 1 < parts.length)
                            txn.put("transaction_id", parts[i + 1]);
                        if (i + 2 < parts.length) {
                            String rem = parts[i + 2];
                            if (rem.equals("NO REMARKS") || rem.equals("NA"))
                                rem = null;
                            txn.put("remarks", rem);
                        }
                        break;
                    }
                }
            } else if (cleanNarration.contains("CREDIT INTEREST")) {
                txn.put("mode", "INTEREST");
                txn.put("suggested_category", "Interest Income");
            } else {
                txn.put("mode", ParserUtil.detectMode(cleanNarration, "OTHER"));
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
        return text.contains("Indian Bank") || text.contains("INDIAN BANK");
    }

    @Override
    public String getBankKey() {
        return "INDIAN";
    }

    @Override
    public String getBankDisplayName() {
        return "Indian Bank";
    }
}
