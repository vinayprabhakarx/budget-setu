package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PnbParser extends BaseBankParser {

    private static final Pattern DATE_LEAD = Pattern.compile("^\\s*(\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})");
    @Override
    public List<Map<String, String>> parseText(String text, String fileName) {
        List<Map<String, String>> rows = new ArrayList<>();
        if (text == null || text.isBlank()) return rows;

        // PNB PDF structure is Date, Amount, CR/DR, Balance, Remarks
        // Wait, the PDF had "Date Instrument ID Amount(INR) Type Balance Remarks"
        // Let's refine the grouping logic or regex based on actual dump.

        List<List<String>> blocks = groupIntoBlocks(text);

        for (List<String> block : blocks) {
            String fullText = String.join(" ", block).replaceAll("\\s+", " ").trim();
            
            // Check if this block comes from Excel (contains tab characters)
            // Wait, if groupIntoBlocks joins lines with spaces, tabs might be lost?
            // Actually groupIntoBlocks doesn't modify the line characters, but String.join(" ", block) adds spaces.
            // Let's check the original line if it has tabs.
            String origLine = block.get(0);
            if (origLine.contains("\t")) {
                String[] columns = origLine.split("\t");
                if (columns.length >= 9) {
                    String date = columns[1].trim();
                    if (date.matches("\\d{2}/\\d{2}/\\d{4}")) {
                        Map<String, String> txn = ParserUtil.emptyTransaction();
                        txn.put("transaction_date", ParserUtil.normalizeDate(date));
                        txn.put("narration", columns[2].trim());
                        
                        String drAmount = columns[6].trim();
                        String crAmount = columns[7].trim();
                        String balance = columns[8].trim().replace("Cr.", "").replace("Dr.", "").trim();
                        
                        txn.put("balance", balance.replace(",", ""));
                        
                        if (!drAmount.isEmpty() && !drAmount.equals("-")) {
                            txn.put("transaction_type", "DEBIT");
                            txn.put("amount", drAmount.replace(",", ""));
                            txn.put("withdrawal_amount", drAmount.replace(",", ""));
                        } else if (!crAmount.isEmpty() && !crAmount.equals("-")) {
                            txn.put("transaction_type", "CREDIT");
                            txn.put("amount", crAmount.replace(",", ""));
                            txn.put("deposit_amount", crAmount.replace(",", ""));
                        }
                        
                        processNarration(txn);
                        rows.add(txn);
                    }
                }
                continue; // Skip the PDF regex parsing for this row
            }

            Matcher dateMatcher = DATE_LEAD.matcher(fullText);
            if (!dateMatcher.find()) continue;

            // PNB PDF pattern: Date (optional instrument ID) Amount CR/DR Balance Remarks
            // Let's use a flexible regex that skips optional Instrument ID
            Pattern flexPattern = Pattern.compile(
                "^\\s*\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}\\s+(?:\\d+\\s+)?([\\d,]+\\.\\d{1,2})\\s+(CR|DR|Cr|Dr)\\s+([\\d,]+\\.\\d{1,2})\\s+(.*)$"
            );
            
            // Wait, for Excel the date might look like '30-Apr-2026', let's adjust DATE_LEAD
            // Let's just match the start of string
            
            // If the row doesn't match flexPattern, we check if it matches without instrument ID.
            Matcher m = flexPattern.matcher(fullText);
            
            if (!m.find()) {
                // Try alternate pattern if date is different format
                // In Excel, dates might be "30-Apr-2026"
                Pattern altPattern = Pattern.compile(
                    "^\\s*(?:\\d{1,2}[-/.]\\w{3}[-/.]\\d{2,4}|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})\\s+(?:\\d+\\s+)?([\\d,]+\\.\\d{1,2})\\s+(CR|DR|Cr|Dr)\\s+([\\d,]+\\.\\d{1,2})\\s+(.*)$"
                );
                m = altPattern.matcher(fullText);
                if (!m.find()) continue;
            }

            String amount = m.group(1).replace(",", "");
            String typeIndicator = m.group(2).toUpperCase();
            String balance = m.group(3).replace(",", "");
            String narration = m.group(4).trim();

            Map<String, String> txn = ParserUtil.emptyTransaction();
            // Need the actual date string from fullText, but wait, altPattern doesn't capture date.
            // Let's capture the date in altPattern
            String dateMatch = fullText.split("\\s+")[0];
            txn.put("transaction_date", ParserUtil.normalizeDate(dateMatch));
            txn.put("amount", amount);
            txn.put("balance", balance);
            
            if (typeIndicator.equals("DR")) {
                txn.put("transaction_type", "DEBIT");
                txn.put("withdrawal_amount", amount);
            } else {
                txn.put("transaction_type", "CREDIT");
                txn.put("deposit_amount", amount);
            }
            txn.put("narration", narration);

            processNarration(txn);
            rows.add(txn);
        }
        return rows;
    }

    private void processNarration(Map<String, String> txn) {
        String narration = txn.get("narration");
        String typeIndicator = txn.get("transaction_type");
        if (narration.contains("UPI/")) {
            txn.put("mode", "UPI");
            String upiStr = narration.substring(narration.indexOf("UPI/"));
            String[] parts = upiStr.split("/");
            if (parts.length >= 3) txn.put("transaction_id", parts[2]);
            if (parts.length >= 4) {
                if ("DEBIT".equals(typeIndicator)) txn.put("payee", parts[3]);
                else txn.put("payer", parts[3]);
            }
            if (parts.length >= 6) txn.put("upi_id", parts[5]);
        } else if (narration.contains("NEFT_IN:")) {
            txn.put("mode", "NEFT");
            String[] parts = narration.split("/");
            if (parts.length > 0) {
                String firstPart = parts[0];
                if (firstPart.contains(":")) {
                    txn.put("transaction_id", firstPart.substring(firstPart.indexOf(":") + 1));
                }
            }
            if (parts.length >= 3) {
                txn.put("payer", parts[parts.length - 1].trim());
            }
        } else if (narration.contains("IMPS")) {
            txn.put("mode", "IMPS");
        } else {
            txn.put("mode", ParserUtil.detectMode(narration, "OTHER"));
        }

        String suggestedCat = ParserUtil.detectSuggestedCategory(narration);
        if (suggestedCat != null && !txn.containsKey("suggested_category")) {
            txn.put("suggested_category", suggestedCat);
        }

        txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null) return false;
        return text.contains("Punjab National Bank") || text.contains("PUNB") || text.contains("PNB");
    }

    @Override
    public String getBankKey() {
        return "PNB";
    }

    @Override
    public String getBankDisplayName() {
        return "Punjab National Bank";
    }
    
    @Override
    protected List<List<String>> groupIntoBlocks(String text) {
        // Override groupIntoBlocks to support Excel date format DD-MMM-YYYY as well
        List<List<String>> blocks = new ArrayList<>();
        if (text == null || text.isBlank()) return blocks;

        String[] lines = text.split("\\r?\\n");
        List<String> currentBlock = new ArrayList<>();
        Pattern dateLead = Pattern.compile(
                "^\\s*(?:[a-zA-Z0-9-]+\\s+|\t)?([A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}[-/.]\\w{3}[-/.]\\d{2,4}|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,]*\\d{2,4})?)"
        );

        for (String line : lines) {
            if (line.trim().isEmpty()) continue;
            if (dateLead.matcher(line).find()) {
                if (!currentBlock.isEmpty()) {
                    blocks.add(new ArrayList<>(currentBlock));
                    currentBlock.clear();
                }
            }
            if (!currentBlock.isEmpty() || dateLead.matcher(line).find()) {
                currentBlock.add(line);
            }
        }
        if (!currentBlock.isEmpty()) {
            blocks.add(currentBlock);
        }
        return blocks;
    }
}
