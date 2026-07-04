package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class BhimUpiParser extends BaseBankParser {

    private static final Pattern ROW_PATTERN = Pattern.compile("(?is)<tr[^>]*>(.*?)</tr>");
    private static final Pattern CELL_PATTERN = Pattern.compile("(?is)<t[dh][^>]*>(.*?)</t[dh]>");

    @Override
    public List<Map<String, String>> parseText(String text, String fileName) {
        List<Map<String, String>> rows = new ArrayList<>();
        if (text == null || text.isBlank() || !text.contains("<table")) return rows;

        Matcher rowMatcher = ROW_PATTERN.matcher(text);
        while (rowMatcher.find()) {
            String rowHtml = rowMatcher.group(1);
            List<String> cells = new ArrayList<>();
            Matcher cellMatcher = CELL_PATTERN.matcher(rowHtml);
            while (cellMatcher.find()) {
                cells.add(cleanCell(cellMatcher.group(1)));
            }

            if (cells.size() >= 10 && cells.get(0).matches("\\d{1,2}/\\d{1,2}/\\d{2,4}")) {
                if ("FAILED".equalsIgnoreCase(cells.get(10))) continue; // Skip failed

                String dateStr = cells.get(0);
                String timeStr = cells.get(1);
                String sender = cells.get(4);
                String receiver = cells.get(5);
                String txId = cells.get(6);
                String amount = cells.get(8).replace(",", "");
                String drCr = cells.get(9);

                Map<String, String> txn = ParserUtil.emptyTransaction();
                txn.put("transaction_date", ParserUtil.normalizeDate(dateStr));
                txn.put("transaction_time", timeStr);
                txn.put("amount", amount);
                txn.put("transaction_id", txId);
                txn.put("reference_number", txId);
                txn.put("mode", "UPI");

                if ("CR".equalsIgnoreCase(drCr)) {
                    txn.put("transaction_type", "CREDIT");
                    txn.put("deposit_amount", amount);
                    txn.put("payer", extractName(sender));
                    txn.put("upi_id", extractUpiId(sender));
                } else {
                    txn.put("transaction_type", "DEBIT");
                    txn.put("withdrawal_amount", amount);
                    txn.put("payee", extractName(receiver));
                    txn.put("upi_id", extractUpiId(receiver));
                }

                txn.put("merchant", ParserUtil.normalizeMerchant(txn.get("payee")));
                String partyName = "CR".equalsIgnoreCase(drCr) ? txn.get("payer") : txn.get("payee");
                txn.put("narration", "BHIM UPI " + txn.get("transaction_type") + " to/from " + partyName);
                
                rows.add(txn);
            }
        }
        return rows;
    }

    private String cleanCell(String text) {
        if (text == null) return "";
        return text.replaceAll("(?is)<[^>]+>", " ").replaceAll("&nbsp;", " ").replaceAll("\\s+", " ").trim();
    }

    private String extractName(String cellText) {
        // e.g. xxxxx00000@upi(JOHN DOE)
        Matcher m = Pattern.compile("\\((.*?)\\)").matcher(cellText);
        if (m.find()) {
            return m.group(1).trim();
        }
        return cellText.replaceAll("@.*", "").trim();
    }

    private String extractUpiId(String cellText) {
        if (cellText == null) return "";
        int idx = cellText.indexOf('(');
        if (idx != -1) {
            String upi = cellText.substring(0, idx).trim();
            if (upi.contains("@")) return upi;
        } else if (cellText.contains("@")) {
            return cellText.trim();
        }
        return "";
    }

    @Override
    public boolean canHandle(String text, String fileName) {
        if (text == null) return false;
        return text.contains("BHIM") && text.contains("UPI") && text.contains("<table") && (text.contains("Payment ID/Reference Number") || text.contains("Pay/Collect"));
    }

    @Override
    public String getBankKey() {
        return "BHIM";
    }

    @Override
    public String getBankDisplayName() {
        return "BHIM UPI";
    }
}
