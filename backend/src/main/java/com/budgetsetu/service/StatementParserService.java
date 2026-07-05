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

        if (needsExtraction) {
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

                // If a specific bank was chosen, return exactly what it produced (no fallback
                // to generic)
                if (!isAutoMode) {
                    return result;
                }

                // In AUTO mode, only return if we actually found transactions, otherwise fall
                // back to generic
                if (result != null && !result.isEmpty()) {
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
        if (lowerSource.contains("pdf") || lowerFileName.endsWith(".pdf")) {
            return pdfParser.parse(new ByteArrayInputStream(fileBytes), fileName, password);
        }
        if (lowerSource.contains("xls") || lowerFileName.endsWith(".xls") || lowerFileName.endsWith(".xlsx")) {
            return excelParser.parse(new ByteArrayInputStream(fileBytes), fileName, password);
        }
        if (lowerSource.contains("html") || lowerFileName.endsWith(".html") || lowerFileName.endsWith(".htm")) {
            return htmlParser.parse(new ByteArrayInputStream(fileBytes), fileName);
        }
        if (lowerSource.contains("csv") || lowerFileName.endsWith(".csv")) {
            return csvParser.parse(new ByteArrayInputStream(fileBytes), fileName);
        }

        throw new IllegalArgumentException("Only PDF, CSV, Excel, and HTML files are supported.");
    }

    public List<Map<String, String>> parse(InputStream inputStream, String fileName, String source, String password) {
        return parse(inputStream, fileName, source, password, "AUTO");
    }
}
