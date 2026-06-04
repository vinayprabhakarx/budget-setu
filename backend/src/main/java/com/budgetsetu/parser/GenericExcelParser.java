package com.budgetsetu.parser;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GenericExcelParser implements StatementParser {

    @Override
    public List<Map<String, String>> parse(InputStream inputStream, String fileName) {
        return parse(inputStream, fileName, null);
    }

    public List<Map<String, String>> parse(InputStream inputStream, String fileName, String password) {
        List<Map<String, String>> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();

        try {
            byte[] bytes = inputStream.readAllBytes();
            try (Workbook workbook = password == null || password.isEmpty() 
                    ? WorkbookFactory.create(new java.io.ByteArrayInputStream(bytes)) 
                    : WorkbookFactory.create(new java.io.ByteArrayInputStream(bytes), password)) {
                Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
                return rows;
            }

            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(normalizeHeader(formatter.formatCellValue(cell)));
            }

            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row sheetRow = sheet.getRow(rowIndex);
                if (sheetRow == null) {
                    continue;
                }

                Map<String, String> row = new HashMap<>();
                StringBuilder raw = new StringBuilder();
                for (int i = 0; i < headers.size(); i++) {
                    String value = formatter.formatCellValue(sheetRow.getCell(i)).trim();
                    row.put(headers.get(i), value);
                    if (!value.isBlank()) {
                        raw.append(value).append(" | ");
                    }
                }
                if (!row.isEmpty()) {
                    row.put("raw_row", raw.toString());
                    rows.add(row);
                }
            }
            }
            return rows;
        } catch (Exception ex) {
            throw new IllegalArgumentException("This Excel file could not be read.");
        }
    }

    @Override
    public String getSource() {
        return "GENERIC_EXCEL";
    }

    private String normalizeHeader(String header) {
        return header == null
                ? ""
                : header.trim().toLowerCase().replaceAll("[^a-z0-9]+", "_").replaceAll("^_|_$", "");
    }
}
