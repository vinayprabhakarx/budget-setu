package com.budgetsetu.parser;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;

public abstract class BaseBankParser implements BankStatementParser {

    @Override
    public List<Map<String, String>> parse(InputStream inputStream, String fileName, String password) {
        String text = "";
        try {
            byte[] bytes = inputStream.readAllBytes();
            String lowerFileName = fileName != null ? fileName.toLowerCase() : "";

            if (lowerFileName.endsWith(".zip")) {
                java.io.File tempFile = java.io.File.createTempFile("stmt", ".zip");
                try {
                    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(tempFile)) {
                        fos.write(bytes);
                    }
                    try (net.lingala.zip4j.ZipFile zipFile = new net.lingala.zip4j.ZipFile(tempFile)) {
                        if (zipFile.isEncrypted()) {
                            if (password == null || password.isEmpty()) {
                                throw new IllegalArgumentException("ZIP file is encrypted but no password provided.");
                            }
                            zipFile.setPassword(password.toCharArray());
                        }
                        List<net.lingala.zip4j.model.FileHeader> fileHeaders = zipFile.getFileHeaders();
                        if (fileHeaders.isEmpty()) {
                            throw new IllegalArgumentException("ZIP file is empty.");
                        }
                        net.lingala.zip4j.model.FileHeader header = fileHeaders.get(0);
                        try (InputStream is = zipFile.getInputStream(header)) {
                            // Recursively parse the inner file
                            return parse(is, header.getFileName(), password);
                        }
                    }
                } finally {
                    tempFile.delete();
                }
            } else if (lowerFileName.endsWith(".pdf")) {
                try (PDDocument document = password == null || password.isEmpty() ? Loader.loadPDF(bytes)
                        : Loader.loadPDF(bytes, password)) {
                    text = new PDFTextStripper().getText(document);
                    text = text.replace("\u0000", ""); // Strip null bytes for PostgreSQL
                }
            } else if (lowerFileName.endsWith(".xls") || lowerFileName.endsWith(".xlsx")) {
                try (Workbook wb = WorkbookFactory.create(new java.io.ByteArrayInputStream(bytes), password)) {
                    DataFormatter formatter = new DataFormatter();
                    StringBuilder sb = new StringBuilder();
                    Sheet sheet = wb.getSheetAt(0);
                    for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                        Row row = sheet.getRow(i);
                        if (row != null) {
                            for (Cell cell : row) {
                                sb.append(formatter.formatCellValue(cell).trim()).append("\t");
                            }
                        }
                        sb.append("\n");
                    }
                    text = sb.toString().replace("\u0000", "");
                }
            } else {
                text = new String(bytes, StandardCharsets.UTF_8).replace("\u0000", "");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to read file in " + getBankDisplayName() + " parser", e);
        }

        return parseText(text, fileName);
    }

    protected List<List<String>> groupIntoBlocks(String text) {
        List<List<String>> blocks = new java.util.ArrayList<>();
        if (text == null || text.isBlank())
            return blocks;

        String[] lines = text.split("\\r?\\n");
        List<String> currentBlock = new java.util.ArrayList<>();
        java.util.regex.Pattern dateLead = java.util.regex.Pattern.compile(
                "^\\s*([A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4}|\\d{1,2}[-\\s]+[A-Za-z]{3}(?:[-\\s,]*\\d{2,4})?)");

        for (String line : lines) {
            if (line.trim().isEmpty())
                continue;
            if (dateLead.matcher(line).find()) {
                if (!currentBlock.isEmpty()) {
                    blocks.add(new java.util.ArrayList<>(currentBlock));
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
