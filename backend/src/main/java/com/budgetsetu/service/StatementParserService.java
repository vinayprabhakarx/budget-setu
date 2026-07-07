package com.budgetsetu.service;

import com.budgetsetu.parser.BankDetector;
import com.budgetsetu.parser.BankStatementParser;
import com.budgetsetu.parser.GenericCsvParser;
import com.budgetsetu.parser.GenericHtmlParser;
import com.budgetsetu.parser.GenericExcelParser;
import com.budgetsetu.parser.GenericPdfParser;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatementParserService {

    private final BankDetector bankDetector;
    private final GenericCsvParser csvParser;
    private final GenericExcelParser excelParser;
    private final GenericPdfParser pdfParser;
    private final GenericHtmlParser htmlParser;

    public List<Map<String, String>> parse(InputStream inputStream, String fileName, String source, String password,
            String bankKey) {
        byte[] fileBytes;
        try {
            fileBytes = inputStream.readAllBytes();
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not read file.");
        }

        String lowerFileName = fileName == null ? "" : fileName.toLowerCase();
        String lowerSource = source == null ? "" : source.toLowerCase();

        String extractedText = "";
        boolean needsExtraction = bankKey == null || bankKey.isBlank() || bankKey.equalsIgnoreCase("AUTO");

        // Always extract text to find the statement year
        if (lowerSource.contains("pdf") || lowerFileName.endsWith(".pdf")) {
                try (PDDocument document = password == null || password.isEmpty() ? Loader.loadPDF(fileBytes)
                        : Loader.loadPDF(fileBytes, password)) {
                    extractedText = new PDFTextStripper().getText(document);
                    if (extractedText != null)
                        extractedText = extractedText.replace("\u0000", "");
                } catch (Exception e) {
                    // Ignore extraction errors
                }
            } else if (lowerFileName.endsWith(".xls") || lowerFileName.endsWith(".xlsx")) {
                try (org.apache.poi.ss.usermodel.Workbook wb = password == null || password.isEmpty()
                        ? org.apache.poi.ss.usermodel.WorkbookFactory
                                .create(new java.io.ByteArrayInputStream(fileBytes))
                        : org.apache.poi.ss.usermodel.WorkbookFactory
                                .create(new java.io.ByteArrayInputStream(fileBytes), password)) {
                    org.apache.poi.ss.usermodel.DataFormatter formatter = new org.apache.poi.ss.usermodel.DataFormatter();
                    StringBuilder sb = new StringBuilder();
                    org.apache.poi.ss.usermodel.Sheet sheet = wb.getSheetAt(0);
                    for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 50); i++) {
                        org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                        if (row != null) {
                            for (org.apache.poi.ss.usermodel.Cell cell : row) {
                                sb.append(formatter.formatCellValue(cell).trim()).append("\t");
                            }
                        }
                        sb.append("\n");
                    }
                    extractedText = sb.toString();
                } catch (Exception e) {
                    // Ignore extraction errors
                }
            } else {
                extractedText = new String(fileBytes, StandardCharsets.UTF_8);
            }

        java.time.LocalDate[] dateRange = com.budgetsetu.parser.ParserUtil.extractDateRangeFromHeader(extractedText);
        String statementYear = null;
        if (dateRange != null && dateRange[0].getYear() == dateRange[1].getYear()) {
            statementYear = String.valueOf(dateRange[0].getYear());
        }

        BankStatementParser specificParser = null;
        if (!needsExtraction) {
            specificParser = bankDetector.getByKey(bankKey);
        } else {
            specificParser = bankDetector.detect(extractedText, fileName);
        }

        boolean isAutoMode = bankKey == null || bankKey.isBlank() || bankKey.equalsIgnoreCase("AUTO");

        if (specificParser != null) {
            try {
                List<Map<String, String>> result = specificParser.parse(new ByteArrayInputStream(fileBytes), fileName,
                        password);

                if (result != null && !result.isEmpty()) {
                    injectStatementYear(result, statementYear);
                    injectDateRange(result, dateRange);
                    return result;
                }
                
                // If a specific bank was chosen, return exactly what it produced (no fallback
                // to generic)
                if (!isAutoMode) {
                    injectStatementYear(result, statementYear);
                    injectDateRange(result, dateRange);
                    return result;
                }

            } catch (Exception ex) {
                if (!isAutoMode) {
                    throw new RuntimeException("Explicitly selected parser failed to process file", ex);
                }
                // specific parser failed in AUTO mode, fall back to generic
            }
        }

        // Generic fallback
        List<Map<String, String>> genericResult = null;
        if (lowerSource.contains("pdf") || lowerFileName.endsWith(".pdf")) {
            genericResult = pdfParser.parse(new ByteArrayInputStream(fileBytes), fileName, password);
        } else if (lowerSource.contains("xls") || lowerFileName.endsWith(".xls") || lowerFileName.endsWith(".xlsx")) {
            genericResult = excelParser.parse(new ByteArrayInputStream(fileBytes), fileName, password);
        } else if (lowerSource.contains("html") || lowerFileName.endsWith(".html") || lowerFileName.endsWith(".htm")) {
            genericResult = htmlParser.parse(new ByteArrayInputStream(fileBytes), fileName);
        } else if (lowerSource.contains("csv") || lowerFileName.endsWith(".csv")) {
            genericResult = csvParser.parse(new ByteArrayInputStream(fileBytes), fileName);
        }

        if (genericResult != null) {
            injectStatementYear(genericResult, statementYear);
            injectDateRange(genericResult, dateRange);
            return genericResult;
        }

        throw new IllegalArgumentException("Only PDF, CSV, Excel, and HTML files are supported.");
    }

    private void injectDateRange(List<Map<String, String>> rows, java.time.LocalDate[] dateRange) {
        if (dateRange != null && rows != null) {
            for (Map<String, String> row : rows) {
                row.putIfAbsent("statement_start_date", dateRange[0].toString());
                row.putIfAbsent("statement_end_date", dateRange[1].toString());
            }
        }
    }

    private void injectStatementYear(List<Map<String, String>> rows, String year) {
        if (year != null && rows != null) {
            for (Map<String, String> row : rows) {
                row.putIfAbsent("statement_year", year);
            }
        }
    }

    public List<Map<String, String>> parse(InputStream inputStream, String fileName, String source, String password) {
        return parse(inputStream, fileName, source, password, "AUTO");
    }
}
