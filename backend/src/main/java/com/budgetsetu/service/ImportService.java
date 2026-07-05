package com.budgetsetu.service;

import com.budgetsetu.dto.response.ImportSummaryResponse;
import com.budgetsetu.dto.response.ImportUploadResponse;
import com.budgetsetu.dto.response.ImportDetailsResponse;
import com.budgetsetu.dto.response.ImportDetailsResponse.*;
import com.budgetsetu.exception.ResourceNotFoundException;
import com.budgetsetu.model.sql.Account;
import com.budgetsetu.model.sql.StatementImport;
import com.budgetsetu.repository.sql.AccountRepository;
import com.budgetsetu.repository.sql.StatementImportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImportService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/html",
            "application/xhtml+xml");

    private final AccountRepository accountRepository;
    private final StatementImportRepository statementImportRepository;
    private final ImportProcessingService importProcessingService;
    private final com.budgetsetu.repository.mongo.ImportLogRepository importLogRepository;
    private final com.budgetsetu.repository.sql.TransactionRepository transactionRepository;
    private final com.budgetsetu.parser.BankDetector bankDetector;
    private final ImportProgressTracker progressTracker;
    private final com.budgetsetu.security.AesUtil aesUtil;

    public ImportUploadResponse uploadStatement(UUID userId,
            UUID accountId,
            String source,
            String password,
            String bankKey,
            MultipartFile file) {
        validateFile(file);

        // Synchronously verify if statement is password protected / correct password is
        // provided
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        try {
            byte[] bytes = file.getBytes();
            if (fileName.endsWith(".pdf") || "application/pdf".equals(file.getContentType())) {
                (password == null || password.isEmpty() ? Loader.loadPDF(bytes) : Loader.loadPDF(bytes, password))
                        .close();
            } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
                org.apache.poi.ss.usermodel.WorkbookFactory.create(new java.io.ByteArrayInputStream(bytes), password)
                        .close();
            } else if (fileName.endsWith(".zip")) {
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
                            // Try extracting to test password
                            List<net.lingala.zip4j.model.FileHeader> fileHeaders = zipFile.getFileHeaders();
                            if (!fileHeaders.isEmpty()) {
                                try (java.io.InputStream is = zipFile.getInputStream(fileHeaders.get(0))) {
                                    is.read(); // Read a byte to verify password
                                }
                            }
                        }
                    }
                } finally {
                    tempFile.delete();
                }
            }
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException
                | org.apache.poi.EncryptedDocumentException e) {
            if (password == null || password.isEmpty()) {
                throw new IllegalArgumentException("PASSWORD_REQUIRED");
            } else {
                throw new IllegalArgumentException("INCORRECT_PASSWORD");
            }
        } catch (net.lingala.zip4j.exception.ZipException e) {
            if (e.getMessage() != null && e.getMessage().contains("Wrong password")) {
                throw new IllegalArgumentException("INCORRECT_PASSWORD");
            }
            throw new IllegalArgumentException("Failed to read the statement file.");
        } catch (IllegalArgumentException e) {
            if ("ZIP file is encrypted but no password provided.".equals(e.getMessage())) {
                throw new IllegalArgumentException("PASSWORD_REQUIRED");
            }
            if ("PASSWORD_REQUIRED".equals(e.getMessage()) || "INCORRECT_PASSWORD".equals(e.getMessage())) {
                throw e;
            }
            throw new IllegalArgumentException("Failed to read the statement file.");
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to read the statement file.");
        }

        Account account;
        if (accountId == null) {
            account = resolveOrCreateAccount(userId, source, password, bankKey, file);
        } else {
            account = accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("This account could not be found."));
        }

        if ("AUTO".equals(source) && account.getBankName() != null) {
            source = account.getBankName();
        }

        EphemeralFile storedFile = storeFile(userId, account.getId(), file);
        StatementImport statementImport = statementImportRepository.save(StatementImport.builder()
                .userId(userId)
                .accountId(account.getId())
                .fileName(file.getOriginalFilename())
                .fileUrl(storedFile.path().toString())
                .source(source)
                .bankKey(bankKey)
                .status("PROCESSING")
                .build());

        importProcessingService.processImportAsync(statementImport.getId(), userId, password, storedFile.key(),
                storedFile.iv());

        return ImportUploadResponse.builder()
                .importId(statementImport.getId().toString())
                .status("PROCESSING")
                .message("Your statement is being processed. This usually takes a few seconds.")
                .build();
    }

    private Account resolveOrCreateAccount(UUID userId, String source, String password, String bankKey,
            MultipartFile file) {
        String text = "";
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        try {
            byte[] bytes = file.getBytes();
            if (fileName.endsWith(".pdf") || "application/pdf".equals(file.getContentType())) {
                try (PDDocument document = password == null || password.isEmpty() ? Loader.loadPDF(bytes)
                        : Loader.loadPDF(bytes, password)) {
                    text = new PDFTextStripper().getText(document);
                }
            } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
                try (org.apache.poi.ss.usermodel.Workbook wb = org.apache.poi.ss.usermodel.WorkbookFactory
                        .create(new java.io.ByteArrayInputStream(bytes), password)) {
                    org.apache.poi.ss.usermodel.DataFormatter formatter = new org.apache.poi.ss.usermodel.DataFormatter();
                    StringBuilder sb = new StringBuilder();
                    org.apache.poi.ss.usermodel.Sheet sheet = wb.getSheetAt(0);
                    for (int i = 0; i <= Math.min(sheet.getLastRowNum(), 100); i++) {
                        org.apache.poi.ss.usermodel.Row row = sheet.getRow(i);
                        if (row != null) {
                            for (org.apache.poi.ss.usermodel.Cell cell : row) {
                                sb.append(formatter.formatCellValue(cell).trim()).append("\t");
                            }
                        }
                        sb.append("\n");
                    }
                    text = sb.toString();
                }
            } else if (fileName.endsWith(".zip")) {
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
                        if (!fileHeaders.isEmpty()) {
                            net.lingala.zip4j.model.FileHeader header = fileHeaders.get(0);
                            try (java.io.InputStream is = zipFile.getInputStream(header)) {
                                if (header.getFileName().toLowerCase().endsWith(".pdf")) {
                                    try (PDDocument document = Loader.loadPDF(is.readAllBytes())) {
                                        text = new PDFTextStripper().getText(document);
                                    }
                                } else {
                                    text = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                                }
                            }
                        }
                    }
                } finally {
                    tempFile.delete();
                }
            } else if (fileName.endsWith(".csv") || "text/csv".equals(file.getContentType())) {
                text = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
            } else {
                text = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
            }
        } catch (org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException
                | org.apache.poi.EncryptedDocumentException e) {
            if (password == null || password.isEmpty()) {
                throw new IllegalArgumentException("PASSWORD_REQUIRED");
            } else {
                throw new IllegalArgumentException("INCORRECT_PASSWORD");
            }
        } catch (net.lingala.zip4j.exception.ZipException e) {
            if (e.getMessage() != null && e.getMessage().contains("Wrong password")) {
                throw new IllegalArgumentException("INCORRECT_PASSWORD");
            }
            throw new IllegalArgumentException("Failed to read the statement for bank profile discovery.");
        } catch (IllegalArgumentException e) {
            if ("ZIP file is encrypted but no password provided.".equals(e.getMessage())) {
                throw new IllegalArgumentException("PASSWORD_REQUIRED");
            }
            if ("PASSWORD_REQUIRED".equals(e.getMessage()) || "INCORRECT_PASSWORD".equals(e.getMessage())) {
                throw e;
            }
            throw new IllegalArgumentException("Failed to read the statement for bank profile discovery.");
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to read the statement for bank profile discovery.");
        }

        AccountDiscovery discovery = discoverAccount(text, source, file.getOriginalFilename());

        String bankName = null;
        if (bankKey != null && !bankKey.isBlank() && !bankKey.equalsIgnoreCase("AUTO")) {
            com.budgetsetu.parser.BankStatementParser parser = bankDetector.getByKey(bankKey);
            if (parser != null) {
                bankName = parser.getBankDisplayName();
            }
        }
        if (bankName == null) {
            bankName = discovery.bankName();
        }

        String accountNumber = discovery.accountNumber();
        String accountType = discovery.accountType();

        final String finalBankName = bankName;
        return accountRepository
                .findByUserIdAndBankNameAndAccountNumberAndAccountType(userId, finalBankName, accountNumber,
                        accountType)
                .orElseGet(() -> accountRepository.save(Account.builder()
                        .userId(userId)
                        .bankName(finalBankName)
                        .accountNumber(accountNumber)
                        .accountType(accountType)
                        .balance(java.math.BigDecimal.ZERO)
                        .isActive(true)
                        .build()));
    }

    private String extractAccountNumber(String text, String sourceName) {
        if (text == null || text.trim().isEmpty()) {
            return "0000";
        }
        String lowerText = text.toLowerCase(Locale.ROOT);

        String[] explicitPatterns = {
                "(?i)accountnumber\\s*=\\s*\"?([xX*]{2,}\\d{4}|\\d{4,})\"?",
                "(?i)account\\s*number\\s*:?\\s*([xX*]{2,}\\d{4}|\\d{4,})\\b",
                "(?i)(?:savings|current)\\s+a/c\\s+([xX*]{2,}\\d{4}|\\d{4,})\\b",
                "(?i)(?:a/c|account|a/c\\.?|account\\s*number|account\\s*no\\.?|bank\\s*account\\s*no\\.?)\\s*(?:no\\.?\\s*)?:?\\s*([xX*]{2,}\\d{4}|\\d{4,})\\b",
                "(?i)statement\\s+of\\s+transactions\\s+in\\s+(?:savings|current)\\s+account\\s+([xX*]{2,}\\d{4}|\\d{4,})\\b",
                "(?i)bank\\s*-\\s*([xX*]{2,}\\d{4}|\\d{4,})\\b",
                "(?i)paid by\\s+[^\\n\\r]*?\\s(\\d{4})\\b",
                "(?i)paid from\\s+[^\\n\\r]*?\\s(\\d{4})\\b",
                "(?i)(?:mobile|mob|mobile\\s*no\\.?|phone\\s*no\\.?|phone)\\s*:?\\s*(?:\\+91[- ]?)?(\\d{10})\\b"
        };
        for (String patternText : explicitPatterns) {
            Matcher matcher = Pattern.compile(patternText).matcher(text);
            if (matcher.find()) {
                String matched = matcher.group(1);
                String last4 = last4Digits(matched);
                if (!last4.isBlank()) {
                    return last4;
                }
            }
        }

        if (lowerText.contains("cif") && (lowerText.contains("sbi") || lowerText.contains("state bank"))) {
            List<String> matches = new ArrayList<>();
            Matcher m = Pattern.compile("\\b\\d{11,16}\\b").matcher(text);
            while (m.find()) {
                matches.add(m.group());
            }
            if (matches.size() >= 2) {
                return last4Digits(matches.get(1));
            } else if (matches.size() == 1) {
                return last4Digits(matches.get(0));
            }
        }

        Matcher m = Pattern.compile("\\b\\d{11,16}\\b").matcher(text);
        if (m.find()) {
            return last4Digits(m.group());
        }

        if (sourceName != null) {
            Matcher sourceDigits = Pattern.compile("\\b\\d{4,}\\b").matcher(sourceName);
            if (sourceDigits.find()) {
                return last4Digits(sourceDigits.group());
            }
        }

        Matcher fallbackMatcher = Pattern.compile("\\b[xX*\\d]*(\\d{4})\\b").matcher(text);
        if (fallbackMatcher.find()) {
            return fallbackMatcher.group(1);
        }
        return "0000";
    }

    private AccountDiscovery discoverAccount(String text, String sourceName, String fileName) {
        if (sourceName != null && !sourceName.trim().isEmpty() && !sourceName.equalsIgnoreCase("AUTO")) {
            String upperSource = sourceName.toUpperCase(Locale.ROOT);
            String bankName = sourceName;
            String accountType = "SAVINGS";

            if (upperSource.equals("PHONEPE")) {
                bankName = "PhonePe";
                accountType = "UPI";
            } else if (upperSource.equals("PAYTM_UPI") || upperSource.equals("PAYTM")) {
                bankName = "Paytm";
                accountType = "UPI";
            } else if (upperSource.equals("GOOGLE_PAY") || upperSource.equals("GPAY")) {
                bankName = "Google Pay";
                accountType = "UPI";
            } else if (upperSource.equals("HDFC")) {
                bankName = "HDFC Bank";
            } else if (upperSource.equals("ICICI")) {
                bankName = "ICICI Bank";
            } else if (upperSource.equals("SBI")) {
                bankName = "SBI";
            } else if (upperSource.equals("BOB")) {
                bankName = "Bank of Baroda";
            } else if (upperSource.equals("CRED")) {
                bankName = "CRED";
                accountType = "CREDIT_CARD";
            } else if (upperSource.equals("BHARATPE")) {
                bankName = "BharatPe";
                accountType = "UPI";
            } else if (upperSource.equals("AMAZONPAY")) {
                bankName = "Amazon Pay";
                accountType = "UPI";
            }

            String accountNumber = extractAccountNumber(text, sourceName);
            return new AccountDiscovery(bankName, accountNumber, accountType);
        }

        String lowerText = text == null ? "" : text.toLowerCase(Locale.ROOT);
        String lowerSource = sourceName == null ? "" : sourceName.toLowerCase(Locale.ROOT);
        String headerText = lowerText.substring(0, Math.min(lowerText.length(), 2000));

        boolean isUpiApp = isUpiAppStatement(headerText, lowerSource);
        boolean isPaymentBank = isPaymentBankStatement(headerText, lowerSource);

        String bankName = resolveBankName(headerText, lowerText, sourceName, isUpiApp, isPaymentBank);
        String accountNumber = extractAccountNumber(text, sourceName);
        String accountType = resolveAccountType(lowerText, lowerSource, isUpiApp, isPaymentBank);
        return new AccountDiscovery(bankName, accountNumber, accountType);
    }

    private String resolveBankName(String headerText, String lowerText, String sourceName,
            boolean isUpiApp, boolean isPaymentBank) {
        String explicitBank = detectExplicitBankName(lowerText);
        if (explicitBank != null) {
            return explicitBank;
        }

        if (lowerText.contains("jio payments") || lowerText.contains("jiopayments")) {
            return "Jio Payments Bank";
        }
        if (lowerText.contains("paytm payments bank")) {
            return "Paytm";
        }
        if (lowerText.contains("airtel payments bank")) {
            return "Airtel Payments Bank";
        }
        if (lowerText.contains("fino payments bank")) {
            return "Fino Payments Bank";
        }
        if (headerText.contains("jio payments") || headerText.contains("jiopayments")) {
            return "Jio Payments Bank";
        }
        if (headerText.contains("hdfc")) {
            return "HDFC Bank";
        }
        if (headerText.contains("icici") || headerText.contains("icicibank")) {
            return "ICICI Bank";
        }
        if (headerText.contains("state bank") || headerText.contains("sbi")) {
            return "SBI";
        }
        if (headerText.contains("axis")) {
            return "Axis Bank";
        }
        if (headerText.contains("central bank")) {
            return "Central Bank of India";
        }
        if (headerText.contains("indian bank")) {
            return "Indian Bank";
        }
        if (headerText.contains("baroda") || headerText.contains("bob")) {
            return "Bank of Baroda";
        }
        if (headerText.contains("punjab national bank") || headerText.contains("pnb")) {
            return "Punjab National Bank";
        }

        if (lowerText.contains("jio payments") || lowerText.contains("jiopayments")) {
            return "Jio Payments Bank";
        }
        if (lowerText.contains("hdfc bank") || lowerText.contains("hdfcbank")) {
            return "HDFC Bank";
        }
        if (lowerText.contains("icici bank") || lowerText.contains("icicibank") || lowerText.contains("icici.bank")) {
            return "ICICI Bank";
        }
        if (lowerText.contains("state bank of india") || lowerText.contains("sbi bank")) {
            return "SBI";
        }
        if (lowerText.contains("axis bank")) {
            return "Axis Bank";
        }
        if (lowerText.contains("central bank")) {
            return "Central Bank of India";
        }
        if (lowerText.contains("indian bank")) {
            return "Indian Bank";
        }
        if (lowerText.contains("bank of baroda")) {
            return "Bank of Baroda";
        }
        if (lowerText.contains("punjab national bank") || lowerText.contains("pnb bank")) {
            return "Punjab National Bank";
        }

        if (isUpiApp) {
            if (lowerText.contains("paytm")) {
                return "Paytm";
            }
            if (lowerText.contains("phonepe") || lowerText.contains("phone pe")) {
                return "PhonePe";
            }
            if (lowerText.contains("gpay") || lowerText.contains("google pay")) {
                return "Google Pay";
            }
            return "UPI";
        }

        if (sourceName != null && !sourceName.trim().isEmpty() && !sourceName.equalsIgnoreCase("AUTO")) {
            return sourceName;
        }
        return "Unknown Bank";
    }

    private String detectExplicitBankName(String lowerText) {
        if (lowerText.contains("bank=\"bank of baroda\"")
                || lowerText.contains("bank name")
                        && lowerText.contains("bank of baroda")) {
            return "Bank of Baroda";
        }
        if (lowerText.contains("bank=\"icici bank\"")
                || lowerText.contains("bank name")
                        && lowerText.contains("icici bank")) {
            return "ICICI Bank";
        }
        if (lowerText.contains("bank=\"hdfc bank\"")
                || lowerText.contains("bank name")
                        && lowerText.contains("hdfc bank")) {
            return "HDFC Bank";
        }
        if (lowerText.contains("bank=\"state bank of india\"")
                || lowerText.contains("bank name")
                        && lowerText.contains("state bank of india")) {
            return "SBI";
        }
        if (lowerText.contains("bank=\"axis bank\"")
                || lowerText.contains("bank name")
                        && lowerText.contains("axis bank")) {
            return "Axis Bank";
        }
        if (lowerText.contains("bank=\"central bank of india\"")
                || lowerText.contains("bank name")
                        && lowerText.contains("central bank of india")) {
            return "Central Bank of India";
        }
        if (lowerText.contains("bank=\"indian bank\"")
                || lowerText.contains("bank name")
                        && lowerText.contains("indian bank")) {
            return "Indian Bank";
        }
        return null;
    }

    private String resolveAccountType(String lowerText, String lowerSource,
            boolean isUpiApp, boolean isPaymentBank) {
        if (isUpiApp) {
            return "UPI";
        }
        if (isPaymentBank) {
            return "SAVINGS";
        }
        Pattern pattern = Pattern
                .compile("(?i)(?:A/c|Account|A/C\\.?|Account\\s*Number)\\s*(?:No\\.?\\s*)?:?\\s*[xX*\\d]{4,}");
        Matcher matcher = pattern.matcher(lowerText);
        if (matcher.find()) {
            int start = matcher.start();
            int windowStart = Math.max(0, start - 80);
            int windowEnd = Math.min(lowerText.length(), start + 120);
            String window = lowerText.substring(windowStart, windowEnd);
            if (window.contains("savings") || window.contains("saving")) {
                return "SAVINGS";
            }
            if (window.contains("current") || window.contains("checking") || window.contains("current account")) {
                return "CURRENT";
            }
        }
        if (lowerText.contains("savings") || lowerText.contains("saving")) {
            return "SAVINGS";
        }
        if (lowerText.contains("current") || lowerText.contains("checking")) {
            return "CURRENT";
        }
        if (lowerText.contains("credit card") || lowerText.contains("cc limit")) {
            return "CREDIT_CARD";
        }
        return "SAVINGS";
    }

    private boolean isUpiAppStatement(String lowerText, String lowerSource) {
        return containsAny(lowerText, lowerSource,
                "paytm statement",
                "payments done by you on paytm app",
                "google pay app",
                "payments made by you on the google pay app",
                "transaction statement",
                "transaction statement period",
                "phonepe statement",
                "phonepe app",
                "upitransactions",
                "bharat interface for money",
                "appname=\"bhim",
                "bhim upi",
                "upi linked bank");
    }

    private boolean isPaymentBankStatement(String lowerText, String lowerSource) {
        return containsAny(lowerText, lowerSource,
                "jio payments bank", "jiopayments", "paytm payments bank", "airtel payments bank",
                "fino payments bank");
    }

    private boolean containsAny(String lowerText, String lowerSource, String... needles) {
        for (String needle : needles) {
            if (lowerText.contains(needle) || lowerSource.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private String last4Digits(String value) {
        if (value == null) {
            return "0000";
        }
        String digits = value.replaceAll("[^\\d]", "");
        if (digits.isBlank()) {
            return "0000";
        }
        return digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
    }

    public ImportSummaryResponse getStatus(UUID userId, UUID importId) {
        StatementImport statementImport = statementImportRepository.findByIdAndUserId(importId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("This import could not be found."));
        return toSummary(statementImport);
    }

    public java.util.List<ImportSummaryResponse> getImportHistory(UUID userId) {
        return statementImportRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toSummary)
                .collect(java.util.stream.Collectors.toList());
    }

    public ImportDetailsResponse getImportDetails(UUID userId, UUID importId) {
        // Validate import belongs to user
        statementImportRepository.findByIdAndUserId(importId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("This import could not be found."));

        com.budgetsetu.model.mongo.ImportLog importLog = importLogRepository.findByImportId(importId.toString())
                .orElseThrow(() -> new ResourceNotFoundException("Import details not found."));

        java.util.List<String> fingerprints = importLog.getEvents().stream()
                .map(event -> event.getFingerprint())
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toList());

        java.util.List<com.budgetsetu.model.sql.Transaction> transactions = transactionRepository
                .findByUserIdAndFingerprintIn(userId, fingerprints);
        java.util.Map<String, com.budgetsetu.model.sql.Transaction> txMap = transactions.stream()
                .collect(java.util.stream.Collectors.toMap(tx -> tx.getFingerprint(), t -> t, (a, b) -> a));

        java.util.List<TransactionDetail> imported = new java.util.ArrayList<>();
        java.util.List<SkippedDetail> skipped = new java.util.ArrayList<>();
        java.util.List<FailedDetail> failed = new java.util.ArrayList<>();

        for (com.budgetsetu.model.mongo.ImportLog.ImportEvent event : importLog.getEvents()) {
            if ("IMPORTED".equals(event.getType())) {
                com.budgetsetu.model.sql.Transaction tx = txMap.get(event.getFingerprint());
                if (tx != null) {
                    imported.add(TransactionDetail.builder()
                            .transactionId(tx.getId().toString())
                            .date(tx.getTransactionDate().toString())
                            .amount(tx.getAmount().toString())
                            .type(tx.getTransactionType())
                            .payee(tx.getPayee())
                            .description(tx.getDescription())
                            .rawRow(aesUtil.decrypt(event.getRawRow()))
                            .build());
                }
            } else if ("SKIPPED".equals(event.getType())) {
                com.budgetsetu.model.sql.Transaction tx = txMap.get(event.getFingerprint());
                TransactionDetail collidedWith = null;
                if (tx != null) {
                    collidedWith = TransactionDetail.builder()
                            .transactionId(tx.getId().toString())
                            .date(tx.getTransactionDate().toString())
                            .amount(tx.getAmount().toString())
                            .type(tx.getTransactionType())
                            .payee(tx.getPayee())
                            .description(tx.getDescription())
                            .rawRow(aesUtil.decrypt(event.getRawRow()))
                            .build();
                }
                skipped.add(SkippedDetail.builder()
                        .reason(event.getReason())
                        .rawRow(aesUtil.decrypt(event.getRawRow()))
                        .collidedWith(collidedWith)
                        .build());
            } else if ("ERROR".equals(event.getType())) {
                failed.add(FailedDetail.builder()
                        .reason(event.getReason())
                        .rawRow(aesUtil.decrypt(event.getRawRow()))
                        .build());
            }
        }

        return ImportDetailsResponse.builder()
                .imported(imported)
                .skipped(skipped)
                .failed(failed)
                .build();
    }

    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamStatus(UUID userId, UUID importId) {
        StatementImport statementImport = statementImportRepository.findByIdAndUserId(importId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("This import could not be found."));

        if (statementImport.getStatus().equals("DONE") || statementImport.getStatus().equals("FAILED")) {
            org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter();
            try {
                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().name("complete")
                        .data(statementImport.getStatus()));
                emitter.complete();
            } catch (java.io.IOException e) {
                emitter.completeWithError(e);
            }
            return emitter;
        }

        return progressTracker.subscribe(importId);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please upload a non-empty statement file.");
        }
        if (file.getSize() > 20L * 1024 * 1024) {
            throw new IllegalArgumentException("This file is too large. Please upload files under 20MB.");
        }
        String contentType = file.getContentType();
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        boolean allowedExtension = fileName.endsWith(".pdf") || fileName.endsWith(".csv")
                || fileName.endsWith(".xls") || fileName.endsWith(".xlsx")
                || fileName.endsWith(".html") || fileName.endsWith(".htm");
        if ((contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) && !allowedExtension) {
            throw new IllegalArgumentException("Only PDF, CSV, Excel, and HTML files are supported.");
        }
    }

    public record EphemeralFile(Path path, byte[] key, byte[] iv) {
    }

    private EphemeralFile storeFile(UUID userId, UUID accountId, MultipartFile file) {
        try {
            String original = file.getOriginalFilename() == null ? "statement" : file.getOriginalFilename();
            String safeFileName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path directory = Path.of("uploads", "imports", userId.toString(), accountId.toString());
            Files.createDirectories(directory);
            Path storedFile = directory.resolve(System.currentTimeMillis() + "_" + safeFileName);

            javax.crypto.KeyGenerator keyGen = javax.crypto.KeyGenerator.getInstance("AES");
            keyGen.init(256);
            javax.crypto.SecretKey secretKey = keyGen.generateKey();
            byte[] iv = new byte[16];
            new java.security.SecureRandom().nextBytes(iv);
            javax.crypto.spec.IvParameterSpec ivSpec = new javax.crypto.spec.IvParameterSpec(iv);
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, secretKey, ivSpec);

            try (java.io.InputStream is = file.getInputStream();
                    java.io.OutputStream os = Files.newOutputStream(storedFile);
                    javax.crypto.CipherOutputStream cos = new javax.crypto.CipherOutputStream(os, cipher)) {
                is.transferTo(cos);
            }
            return new EphemeralFile(storedFile, secretKey.getEncoded(), iv);
        } catch (Exception ex) {
            throw new IllegalStateException("We couldn't save your file right now. Please try again.");
        }
    }

    private ImportSummaryResponse toSummary(StatementImport statementImport) {
        return ImportSummaryResponse.builder()
                .importId(statementImport.getId().toString())
                .status(statementImport.getStatus())
                .fileName(statementImport.getFileName())
                .sourceName(statementImport.getSource())
                .progress(progressTracker.getProgress(statementImport.getId()))
                .totalFound(nullToZero(statementImport.getTotalFound()))
                .newImported(nullToZero(statementImport.getNewImported()))
                .duplicatesSkipped(nullToZero(statementImport.getDuplicates()))
                .failedRows(0)
                .message(statementImport.getErrorMessage())
                .completedAt(statementImport.getCompletedAt() == null
                        ? null
                        : statementImport.getCompletedAt().toInstant(ZoneOffset.UTC))
                .build();
    }

    private int nullToZero(Integer value) {
        return value != null ? value : 0;
    }

    @Transactional
    public void deleteStatementImport(UUID userId, UUID importId) {
        StatementImport statement = statementImportRepository.findByIdAndUserId(importId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Import not found."));

        java.util.Optional<com.budgetsetu.model.mongo.ImportLog> importLogOpt = importLogRepository
                .findByImportId(importId.toString());

        if (importLogOpt.isPresent()) {
            List<String> importedFingerprints = importLogOpt.get().getEvents().stream()
                    .filter(e -> "IMPORTED".equals(e.getType()))
                    .map(e -> e.getFingerprint())
                    .filter(f -> f != null && !f.isEmpty())
                    .toList();

            if (!importedFingerprints.isEmpty()) {
                for (int i = 0; i < importedFingerprints.size(); i += 1000) {
                    int end = Math.min(i + 1000, importedFingerprints.size());
                    transactionRepository.deleteAllByUserIdAndFingerprintIn(userId,
                            importedFingerprints.subList(i, end));
                }
            }
            importLogRepository.deleteByImportId(importId.toString());
        }

        statementImportRepository.delete(statement);
    }

    private record AccountDiscovery(String bankName, String accountNumber, String accountType) {
    }
}
