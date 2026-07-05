package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GenericHtmlParser implements StatementParser {

    private static final Pattern ROW_PATTERN = Pattern.compile("(?is)<tr[^>]*>(.*?)</tr>");
    private static final Pattern CELL_PATTERN = Pattern.compile("(?is)<t[dh][^>]*>(.*?)</t[dh]>");

    @Override
    public List<Map<String, String>> parse(InputStream inputStream, String fileName) {
        try {
            String html = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            return parseTableRows(html);
        } catch (Exception ex) {
            throw new IllegalArgumentException("This HTML file could not be read.");
        }
    }

    @Override
    public String getSource() {
        return "GENERIC_HTML";
    }

    private List<Map<String, String>> parseTableRows(String html) {
        List<List<String>> rows = new ArrayList<>();
        Matcher rowMatcher = ROW_PATTERN.matcher(html);
        while (rowMatcher.find()) {
            String rowHtml = rowMatcher.group(1);
            List<String> cells = new ArrayList<>();
            Matcher cellMatcher = CELL_PATTERN.matcher(rowHtml);
            while (cellMatcher.find()) {
                cells.add(cleanCell(cellMatcher.group(1)));
            }
            if (!cells.isEmpty()) {
                rows.add(cells);
            }
        }

        if (rows.isEmpty()) {
            return List.of();
        }

        int headerIndex = -1;
        List<String> headers = null;
        for (int i = 0; i < rows.size(); i++) {
            List<String> row = rows.get(i);
            String joined = String.join(" ", row).toLowerCase(Locale.ROOT);
            if (joined.contains("date") && (joined.contains("amount") || joined.contains("debit")
                    || joined.contains("credit") || joined.contains("reference"))) {
                headerIndex = i;
                headers = row.stream().map(this::normalizeHeader).toList();
                break;
            }
        }

        if (headers == null) {
            headers = new ArrayList<>();
            for (int i = 0; i < rows.get(0).size(); i++) {
                headers.add("column_" + i);
            }
            headerIndex = 0;
        }

        List<Map<String, String>> parsed = new ArrayList<>();
        for (int i = headerIndex + 1; i < rows.size(); i++) {
            List<String> row = rows.get(i);
            if (isTrivialRow(row)) {
                continue;
            }
            Map<String, String> mapped = new HashMap<>();
            for (int j = 0; j < row.size(); j++) {
                String key = j < headers.size() ? headers.get(j) : "column_" + j;
                mapped.put(key, row.get(j));
            }
            String drCr = firstNonBlank(mapped, "dr_cr", "drcr", "debit_credit");
            String payCollect = firstNonBlank(mapped, "pay_collect");
            String amount = firstNonBlank(mapped, "amount_in_rs", "amount", "value");
            String reference = firstNonBlank(mapped, "payment_id_reference_number", "reference_number", "payment_id",
                    "reference");
            String transactionType = resolveTransactionType(drCr, payCollect);
            String counterparty = "INCOME".equals(transactionType)
                    ? firstNonBlank(mapped, "sender", "receiver")
                    : firstNonBlank(mapped, "receiver", "sender");

            mapped.put("amount", amount == null ? "" : amount);
            mapped.put("debit", "EXPENSE".equals(transactionType) ? amount == null ? "" : amount : "");
            mapped.put("credit", "INCOME".equals(transactionType) ? amount == null ? "" : amount : "");
            if (!"UNKNOWN".equals(transactionType)) {
                mapped.put("transaction_type", transactionType);
            }
            mapped.put("merchant_name", counterparty == null ? "" : counterparty);
            mapped.put("payee", counterparty == null ? "" : counterparty);
            mapped.put("counterparty", counterparty == null ? "" : counterparty);
            mapped.put("reference_number", reference == null ? "" : reference);
            mapped.put("description",
                    String.join(" ", nonBlankValues(reference, counterparty, payCollect, drCr)).trim());
            mapped.put("raw_row", String.join(" | ", row));
            parsed.add(mapped);
        }

        return parsed;
    }

    private boolean isTrivialRow(List<String> row) {
        if (row.isEmpty()) {
            return true;
        }
        String joined = String.join(" ", row).trim();
        return joined.isEmpty() || joined.length() < 3;
    }

    private String cleanCell(String html) {
        String text = html.replaceAll("(?is)<script.*?</script>", " ")
                .replaceAll("(?is)<style.*?</style>", " ")
                .replaceAll("(?is)<[^>]+>", " ");
        text = text.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
        return text.replaceAll("\\s+", " ").trim();
    }

    private String normalizeHeader(String header) {
        return header == null
                ? ""
                : header.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_").replaceAll("^_|_$", "");
    }

    private String resolveTransactionType(String drCr, String payCollect) {
        String normalized = (drCr == null ? "" : drCr).trim().toUpperCase(Locale.ROOT);
        if ("DR".equals(normalized) || "PAY".equalsIgnoreCase(payCollect)) {
            return "EXPENSE";
        }
        if ("CR".equals(normalized) || "COLLECT".equalsIgnoreCase(payCollect)) {
            return "INCOME";
        }
        return "UNKNOWN";
    }

    private String firstNonBlank(Map<String, String> row, String... keys) {
        for (String key : keys) {
            String value = row.get(key);
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private List<String> nonBlankValues(String... values) {
        List<String> result = new ArrayList<>();
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                result.add(value.trim());
            }
        }
        return result;
    }
}
