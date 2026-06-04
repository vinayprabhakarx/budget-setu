package com.budgetsetu.parser;

import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GenericCsvParser implements StatementParser {

    @Override
    public List<Map<String, String>> parse(InputStream inputStream, String fileName) {
        List<Map<String, String>> rows = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            List<String> allLines = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) {
                    allLines.add(line);
                }
            }

            if (allLines.isEmpty()) {
                return rows;
            }

            int headerIndex = -1;
            String[] headers = null;
            for (int i = 0; i < allLines.size(); i++) {
                String[] parts = splitCsvLine(allLines.get(i));
                boolean hasDate = false;
                boolean hasDescription = false;
                boolean hasAmount = false;
                for (String part : parts) {
                    String normalized = part.trim().toLowerCase();
                    if (normalized.contains("date")) {
                        hasDate = true;
                    }
                    if (normalized.contains("particulars") || normalized.contains("description") || normalized.contains("narration") || normalized.contains("details") || normalized.contains("mode")) {
                        hasDescription = true;
                    }
                    if (normalized.contains("deposit") || normalized.contains("withdrawal") || normalized.contains("amount") || normalized.contains("balance") || normalized.contains("debit") || normalized.contains("credit")) {
                        hasAmount = true;
                    }
                }
                if (hasDate && hasDescription && hasAmount) {
                    headerIndex = i;
                    headers = parts;
                    break;
                }
            }

            if (headers == null) {
                headerIndex = 0;
                headers = splitCsvLine(allLines.get(0));
            }

            for (int i = headerIndex + 1; i < allLines.size(); i++) {
                String currentLine = allLines.get(i);
                String[] values = splitCsvLine(currentLine);
                if (values.length == 0) {
                    continue;
                }
                if (values.length > headers.length) {
                    values = mergeOverflowColumns(values, headers.length);
                }

                int dateColIdx = -1;
                for (int h = 0; h < headers.length; h++) {
                    if (normalizeHeader(headers[h]).contains("date")) {
                        dateColIdx = h;
                        break;
                    }
                }
                if (dateColIdx != -1 && dateColIdx < values.length) {
                    String dateVal = values[dateColIdx].trim();
                    if (dateVal.isEmpty() || !dateVal.matches(".*\\d+.*")) {
                        continue;
                    }
                }

                Map<String, String> row = new HashMap<>();
                for (int j = 0; j < values.length; j++) {
                    String key = j < headers.length ? normalizeHeader(headers[j]) : "column_" + j;
                    row.put(key, values[j].trim());
                }
                row.put("raw_row", currentLine);
                rows.add(row);
            }
            return rows;
        } catch (Exception ex) {
            throw new IllegalArgumentException("This CSV file could not be read.");
        }
    }

    @Override
    public String getSource() {
        return "GENERIC_CSV";
    }

    private String normalizeHeader(String header) {
        return header == null
                ? ""
                : header.trim().toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_|_$", "");
    }

    private String[] splitCsvLine(String line) {
        return line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
    }

    private String[] mergeOverflowColumns(String[] values, int headerCount) {
        if (headerCount <= 0 || values.length <= headerCount) {
            return values;
        }

        String[] merged = new String[headerCount];
        int copyCount = Math.max(0, headerCount - 1);
        for (int i = 0; i < copyCount; i++) {
            merged[i] = values[i];
        }

        StringBuilder tail = new StringBuilder();
        for (int i = headerCount - 1; i < values.length; i++) {
            if (tail.length() > 0) {
                tail.append(",");
            }
            tail.append(values[i]);
        }
        merged[headerCount - 1] = tail.toString();
        return merged;
    }
}
