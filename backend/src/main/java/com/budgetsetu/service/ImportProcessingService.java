package com.budgetsetu.service;

import com.budgetsetu.model.mongo.ImportLog;
import com.budgetsetu.model.mongo.MerchantRule;
import com.budgetsetu.model.sql.Account;
import com.budgetsetu.model.sql.Category;
import com.budgetsetu.model.sql.StatementImport;
import com.budgetsetu.model.sql.Transaction;
import com.budgetsetu.repository.mongo.ImportLogRepository;
import com.budgetsetu.repository.mongo.MerchantRuleRepository;
import com.budgetsetu.repository.sql.AccountRepository;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.repository.sql.StatementImportRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import com.budgetsetu.util.FingerprintUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class ImportProcessingService {

    private final StatementImportRepository statementImportRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final MerchantRuleRepository merchantRuleRepository;
    private final ImportLogRepository importLogRepository;
    private final StatementParserService statementParserService;
    private final AuditService auditService;
    private final ImportProgressTracker progressTracker;
    private final com.budgetsetu.security.AesUtil aesUtil;

    @Async
    public void processImportAsync(UUID importId, UUID userId, String password, byte[] key, byte[] iv) {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(userId, null,
                        java.util.List.of()));
        StatementImport statementImport = null;
        try {
            statementImport = statementImportRepository.findById(importId).orElse(null);
            if (statementImport == null) {
                return;
            }
            progressTracker.updateProgress(importId, 10);

            try {
                statementImport.setStatus("PROCESSING");
                statementImportRepository.save(statementImport);

                Account account = accountRepository
                        .findByIdAndUserId(statementImport.getAccountId(), statementImport.getUserId())
                        .orElseThrow(() -> new IllegalStateException("This account could not be found."));

                Path filePath = Path.of(statementImport.getFileUrl());

                javax.crypto.SecretKey secretKey = new javax.crypto.spec.SecretKeySpec(key, "AES");
                javax.crypto.spec.IvParameterSpec ivSpec = new javax.crypto.spec.IvParameterSpec(iv);
                javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
                cipher.init(javax.crypto.Cipher.DECRYPT_MODE, secretKey, ivSpec);

                List<Map<String, String>> rawRows;
                try (java.io.InputStream is = Files.newInputStream(filePath);
                        javax.crypto.CipherInputStream cis = new javax.crypto.CipherInputStream(is, cipher)) {
                    rawRows = statementParserService.parse(
                            cis,
                            statementImport.getFileName(),
                            statementImport.getSource(),
                            password,
                            statementImport.getBankKey());
                }

                progressTracker.updateProgress(importId, 50);

                Category uncategorized = getUncategorizedCategory(statementImport.getUserId());
                List<Category> availableCategories = categoryRepository.findAllForUser(statementImport.getUserId());
                List<MerchantRule> merchantRules = loadMerchantRules(statementImport.getUserId());
                Set<String> existingFingerprints = new HashSet<>();
                List<String> candidateFingerprints = new ArrayList<>();
                List<ParsedRow> parsedRows = new ArrayList<>();
                List<ImportLog.ImportEvent> events = new ArrayList<>();

                int fallbackYear = extractFallbackYear(statementImport.getFileName());
                int total = rawRows.size();
                int processed = 0;
                for (Map<String, String> row : rawRows) {
                    ParsedRow parsed = parseRow(row, account.getId(), statementImport.getUserId(), merchantRules,
                            availableCategories, uncategorized, fallbackYear);
                    parsedRows.add(parsed);
                    candidateFingerprints.add(parsed.fingerprint());
                    processed++;
                    if (processed % 50 == 0) {
                        progressTracker.updateProgress(importId, 50 + (int) ((processed / (double) total) * 20)); // 50
                                                                                                                  // to
                                                                                                                  // 70%
                    }
                }
                progressTracker.updateProgress(importId, 70);

                existingFingerprints.addAll(transactionRepository
                        .findByUserIdAndFingerprintIn(statementImport.getUserId(), candidateFingerprints)
                        .stream()
                        .map(t -> t.getFingerprint())
                        .collect(Collectors.toSet()));

                List<Transaction> newTransactions = new ArrayList<>();
                int duplicates = 0;
                LocalDate periodStart = null;
                LocalDate periodEnd = null;

                Set<String> seenFingerprints = new HashSet<>(existingFingerprints);
                int savedRows = 0;
                for (ParsedRow parsed : parsedRows) {
                    savedRows++;
                    if (savedRows % 50 == 0) {
                        progressTracker.updateProgress(importId, 70 + (int) ((savedRows / (double) total) * 30)); // 70
                                                                                                                  // to
                                                                                                                  // 100%
                    }

                    if (parsed.error() != null) {
                        events.add(ImportLog.ImportEvent.builder()
                                .timestamp(Instant.now())
                                .type("ERROR")
                                .rawRow(aesUtil.encrypt(parsed.rawRow()))
                                .reason(parsed.error())
                                .build());
                        continue;
                    }

                    if (seenFingerprints.contains(parsed.fingerprint())) {
                        duplicates++;
                        events.add(ImportLog.ImportEvent.builder()
                                .timestamp(Instant.now())
                                .type("SKIPPED")
                                .rawRow(aesUtil.encrypt(parsed.rawRow()))
                                .fingerprint(parsed.fingerprint())
                                .reason("DUPLICATE")
                                .build());
                        continue;
                    }

                    seenFingerprints.add(parsed.fingerprint());

                    String finalType = parsed.transactionType();
                    if (parsed.categoryId() != null) {
                        for (Category c : availableCategories) {
                            if (c.getId().equals(parsed.categoryId())) {
                                finalType = c.getType().toUpperCase();
                                break;
                            }
                        }
                    }

                    Transaction transaction = Transaction.builder()
                            .userId(statementImport.getUserId())
                            .accountId(account.getId())
                            .categoryId(parsed.categoryId())
                            .amount(parsed.amount())
                            .transactionType(finalType)
                            .transactionDate(parsed.transactionDate())
                            .payee(parsed.payee())
                            .paymentMode(parsed.paymentMode())
                            .description(parsed.description())
                            .tags(new String[0])
                            .source("IMPORT")
                            .referenceNumber(parsed.referenceNumber())
                            .rawDescription(parsed.rawRow())
                            .categorySource(parsed.categoryId() != null ? "AUTO_FILLED" : "NONE")
                            .fingerprint(parsed.fingerprint())
                            .runningBalance(parsed.runningBalance())
                            .build();
                    newTransactions.add(transaction);

                    if (periodStart == null || parsed.transactionDate().isBefore(periodStart)) {
                        periodStart = parsed.transactionDate();
                    }
                    if (periodEnd == null || parsed.transactionDate().isAfter(periodEnd)) {
                        periodEnd = parsed.transactionDate();
                    }

                    events.add(ImportLog.ImportEvent.builder()
                            .timestamp(Instant.now())
                            .type("IMPORTED")
                            .rawRow(aesUtil.encrypt(parsed.rawRow()))
                            .fingerprint(parsed.fingerprint())
                            .build());
                }

                if (!newTransactions.isEmpty()) {
                    List<Transaction> saved = transactionRepository.saveAll(newTransactions);
                    for (Transaction transaction : saved) {
                        if (transaction.getCategoryId() != null
                                && !transaction.getCategoryId().equals(uncategorized.getId())) {
                            auditService.recordEvent(
                                    transaction.getUserId(),
                                    "TRANSACTION",
                                    transaction.getId(),
                                    "categoryId",
                                    "null",
                                    transaction.getCategoryId().toString(),
                                    "SYSTEM");
                        }
                    }
                }

                statementImport.setTotalFound(rawRows.size());
                statementImport.setNewImported(newTransactions.size());
                statementImport.setDuplicates(duplicates);
                statementImport.setPeriodStart(periodStart);
                statementImport.setPeriodEnd(periodEnd);
                statementImport.setStatus("DONE");
                statementImport.setCompletedAt(LocalDateTime.now());
                statementImport.setErrorMessage(null);
                statementImportRepository.save(statementImport);

                progressTracker.complete(importId, "DONE");

                importLogRepository.save(ImportLog.builder()
                        .importId(statementImport.getId().toString())
                        .userId(statementImport.getUserId().toString())
                        .events(events)
                        .createdAt(Instant.now())
                        .build());
            } catch (Exception ex) {
                log.error("Failed to process import: " + importId, ex);
                statementImport.setStatus("FAILED");
                statementImport.setErrorMessage(ex.getMessage());
                statementImport.setCompletedAt(LocalDateTime.now());
                statementImportRepository.save(statementImport);

                progressTracker.complete(importId, "FAILED");

                importLogRepository.save(ImportLog.builder()
                        .importId(statementImport.getId().toString())
                        .userId(statementImport.getUserId().toString())
                        .events(List.of(ImportLog.ImportEvent.builder()
                                .timestamp(Instant.now())
                                .type("ERROR")
                                .rawRow("")
                                .reason(ex.getMessage())
                                .build()))
                        .createdAt(Instant.now())
                        .build());
            }
        } finally {
            progressTracker.clearProgress(importId);
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
            
            // Instantly delete the file from disk, fulfilling the immediate deletion requirement
            if (statementImport != null && statementImport.getFileUrl() != null) {
                try {
                    java.nio.file.Files.deleteIfExists(java.nio.file.Path.of(statementImport.getFileUrl()));
                } catch (Exception ignored) {
                    log.warn("Failed to delete ephemeral file for import: " + importId);
                }
            }
        }
    }

    private ParsedRow parseRow(Map<String, String> row,
            UUID accountId,
            UUID userId,
            List<MerchantRule> merchantRules,
            List<Category> categories,
            Category uncategorized,
            int fallbackYear) {
        try {
            String rawRow = row.getOrDefault("raw_row", row.toString());
            LocalDate transactionDate = parseDate(row, fallbackYear);
            AmountInfo amountInfo = parseAmount(row);

            String explicitType = firstNonBlank(row, "transaction_type", "type", "dr_cr", "drcr", "pay_collect");
            String transactionType = resolveTransactionType(explicitType, amountInfo);
            BigDecimal amount = amountInfo.amount().abs().setScale(2, RoundingMode.HALF_UP);

            String runningBalanceText = firstNonBlank(row, "balance", "calculated_balance", "running_balance",
                    "closing_balance", "available_balance");
            BigDecimal runningBalance = null;
            if (runningBalanceText != null && !runningBalanceText.isBlank()) {
                try {
                    runningBalance = parseMoney(runningBalanceText);
                } catch (Exception ignored) {
                }
            }

            String payeeFromRow = firstNonBlank(row, "payee", "merchant_name", "merchant", "counterparty",
                    "payee_name");
            String rawParticulars = firstNonBlank(row,
                    "narration",
                    "description",
                    "note",
                    "details",
                    "particulars",
                    "transaction_details",
                    "remarks",
                    "merchant_name",
                    "merchant",
                    "payee");

            ParticularsDetails details = extractDetailsFromParticulars(rawParticulars, transactionType);

            String payee = payeeFromRow;
            if (payee == null || payee.isBlank() || payee.equalsIgnoreCase(rawParticulars)) {
                payee = details.payee();
            }
            if (payee == null) {
                payee = "Unknown";
            }
            if (payee.length() > 255) {
                payee = payee.substring(0, 255);
            }

            String payeeNormalized = normalizeMerchant(payee);
            String referenceNumber = firstNonBlank(row,
                    "reference_number",
                    "upi_ref_no",
                    "upi_transaction_id",
                    "rrn",
                    "reference",
                    "ref_no",
                    "upi_ref",
                    "utr",
                    "transaction_id",
                    "transaction_id_no",
                    "cheque_or_ref_no",
                    "cheque_ref_no",
                    "chq_ref_no",
                    "cheque");
            if (referenceNumber == null || referenceNumber.isBlank()) {
                referenceNumber = details.referenceNumber();
            }
            if (referenceNumber != null && referenceNumber.length() > 255) {
                referenceNumber = referenceNumber.substring(0, 255);
            }

            String description = firstNonBlank(row, "note", "description", "remarks", "personal_remark", "bank_remark",
                    "other_remark", "narration", "details", "particulars", "transaction_details");
            if (description == null || description.isBlank() || description.equalsIgnoreCase(rawParticulars)) {
                description = details.description() != null ? details.description() : rawParticulars;
            }

            String paymentMode = firstNonBlank(row, "mode", "payment_mode");
            if (paymentMode == null || paymentMode.isBlank() || "OTHER".equalsIgnoreCase(paymentMode)) {
                String modeTarget = (rawParticulars != null ? rawParticulars : "").toUpperCase(Locale.ROOT);
                if (modeTarget.contains("UPI")) paymentMode = "UPI";
                else if (modeTarget.contains("NEFT")) paymentMode = "NEFT";
                else if (modeTarget.contains("IMPS")) paymentMode = "IMPS";
                else if (modeTarget.contains("RTGS")) paymentMode = "RTGS";
                else if (modeTarget.contains("ATM") || modeTarget.contains("CASH")) paymentMode = "CASH";
                else if (modeTarget.contains("POS") || modeTarget.contains("SWIPE")) paymentMode = "POS";
                else paymentMode = "OTHER";
            }
            if (paymentMode.length() > 30) {
                paymentMode = paymentMode.substring(0, 30);
            }

            String searchTarget = (payeeNormalized + " "
                    + (description != null ? description.toLowerCase(Locale.ROOT) : "") + " "
                    + (rawParticulars != null ? rawParticulars.toLowerCase(Locale.ROOT) : "") + " "
                    + (referenceNumber != null ? referenceNumber.toLowerCase(Locale.ROOT) : "") + " "
                    + paymentMode.toLowerCase(Locale.ROOT) + " "
                    + (transactionType != null ? transactionType.toLowerCase(Locale.ROOT) : "")).trim();
            Category matchedCategory = matchCategory(searchTarget, merchantRules, categories, uncategorized);

            if (matchedCategory.getId().equals(uncategorized.getId())) {
                String suggestedCatName = row.get("suggested_category");
                if (suggestedCatName != null) {
                    Category found = categories.stream()
                            .filter(c -> c.getName().equalsIgnoreCase(suggestedCatName))
                            .findFirst()
                            .orElse(null);
                    if (found != null) {
                        matchedCategory = found;
                    }
                }
            }
            String fingerprint = FingerprintUtil.generate(
                    transactionDate.toString(),
                    amount.toPlainString(),
                    normalizeFingerprintValue(referenceNumber),
                    normalizeFingerprintValue(payeeNormalized, description),
                    accountId.toString());

            return new ParsedRow(
                    rawRow,
                    transactionDate,
                    amount,
                    transactionType,
                    payee,
                    payeeNormalized,
                    description,
                    referenceNumber,
                    matchedCategory.getId(),
                    paymentMode,
                    fingerprint,
                    runningBalance,
                    null);
        } catch (Exception ex) {
            return new ParsedRow(
                    row.getOrDefault("raw_row", row.toString()),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    ex.getMessage());
        }
    }

    private Category matchCategory(String merchantNormalized,
            List<MerchantRule> merchantRules,
            List<Category> categories,
            Category uncategorized) {
        Optional<MerchantRule> matchedRule = merchantRules.stream()
                .filter(rule -> rule.getMerchantPattern() != null && !rule.getMerchantPattern().trim().isEmpty())
                .sorted(Comparator.comparingInt(rule -> -rule.getMerchantPattern().length()))
                .filter(rule -> merchantNormalized.contains(rule.getMerchantPattern().toLowerCase(Locale.ROOT).trim()))
                .findFirst();

        if (matchedRule.isPresent()) {
            String categoryId = matchedRule.get().getCategoryId();
            return categories.stream()
                    .filter(category -> category.getId().toString().equals(categoryId))
                    .findFirst()
                    .orElse(uncategorized);
        }

        return uncategorized;
    }

    private List<MerchantRule> loadMerchantRules(UUID userId) {
        List<MerchantRule> rules = merchantRuleRepository.findByUserIdIsNullOrUserId(userId.toString());
        if (!rules.isEmpty()) {
            return rules;
        }
        return List.of();
    }

    private Category getUncategorizedCategory(UUID userId) {
        return categoryRepository.findFirstByUserIdIsNullAndNameIgnoreCase("Uncategorized")
                .orElseGet(() -> categoryRepository.findAllForUser(userId).stream()
                        .filter(category -> "Uncategorized".equalsIgnoreCase(category.getName()))
                        .findFirst()
                        .orElseGet(() -> {
                            Category created = Category.builder()
                                    .userId(userId)
                                    .name("Uncategorized")
                                    .icon("❓")
                                    .color("#A8A29E")
                                    .type("EXPENSE")
                                    .isDefault(false)
                                    .build();
                            return categoryRepository.save(created);
                        }));
    }

    private int extractFallbackYear(String fileName) {
        if (fileName == null) {
            return LocalDate.now().getYear();
        }
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(20\\d{2})").matcher(fileName);
        if (m.find()) {
            try {
                int year = Integer.parseInt(m.group(1));
                if (year <= LocalDate.now().getYear() + 1 && year > 2000) {
                    return year;
                }
            } catch (Exception ignored) {}
        }
        return LocalDate.now().getYear();
    }

    private LocalDate parseDate(Map<String, String> row, int fallbackYear) {
        String rawDate = firstNonBlank(row, "date", "transaction_date", "txn_date", "value_date");
        if (rawDate == null) {
            throw new IllegalArgumentException("Missing transaction date.");
        }

        String cleanedDate = rawDate.trim();

        // 1. Try standard formatters
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("dd.MM.yyyy"),
                DateTimeFormatter.ofPattern("d/M/uuuu"),
                DateTimeFormatter.ofPattern("d-M-uuuu"),
                DateTimeFormatter.ofPattern("dd/MM/yy"),
                DateTimeFormatter.ofPattern("dd-MM-yy"),
                DateTimeFormatter.ofPattern("dd.MM.yy"),
                DateTimeFormatter.ofPattern("d/M/yy"),
                DateTimeFormatter.ofPattern("d-M-yy"));
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(cleanedDate, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }

        // 2. Try monthly names with year formatters (case-insensitive)
        List<String> monthYearPatterns = List.of(
                "dd MMM, yyyy",
                "d MMM, yyyy",
                "dd MMM yyyy",
                "d MMM yyyy",
                "dd-MMM-yyyy",
                "d-MMM-yyyy",
                "dd MMM, yy",
                "d MMM, yy",
                "dd MMM yy",
                "d MMM yy",
                "dd-MMM-yy",
                "d-MMM-yy");
        for (String pattern : monthYearPatterns) {
            try {
                DateTimeFormatter fmt = new java.time.format.DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern(pattern)
                        .toFormatter(Locale.ENGLISH);
                return LocalDate.parse(cleanedDate, fmt);
            } catch (DateTimeParseException ignored) {
            }
        }

        // 3. Try monthly names without year formatters (case-insensitive), defaulting
        // to extracted fallback year or bounding it by the statement date range
        List<String> monthOnlyPatterns = List.of(
                "dd MMM",
                "d MMM",
                "dd-MMM",
                "d-MMM");
        
        LocalDate statementStart = null;
        LocalDate statementEnd = null;
        try {
            if (row.containsKey("statement_start_date") && row.containsKey("statement_end_date")) {
                statementStart = LocalDate.parse(row.get("statement_start_date"));
                statementEnd = LocalDate.parse(row.get("statement_end_date"));
            }
        } catch (Exception ignored) {}

        for (String pattern : monthOnlyPatterns) {
            try {
                DateTimeFormatter fmt = new java.time.format.DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern(pattern)
                        .toFormatter(Locale.ENGLISH);
                
                // Parse it just to get Month and Day
                java.time.temporal.TemporalAccessor parsedAccessor = fmt.parse(cleanedDate);
                int month = parsedAccessor.get(java.time.temporal.ChronoField.MONTH_OF_YEAR);
                int day = parsedAccessor.get(java.time.temporal.ChronoField.DAY_OF_MONTH);
                
                if (statementStart != null && statementEnd != null) {
                    for (int year = statementStart.getYear(); year <= statementEnd.getYear(); year++) {
                        try {
                            LocalDate testDate = LocalDate.of(year, month, day);
                            if ((testDate.isEqual(statementStart) || testDate.isAfter(statementStart)) && 
                                (testDate.isEqual(statementEnd) || testDate.isBefore(statementEnd))) {
                                return testDate;
                            }
                        } catch (Exception ignored) {}
                    }
                }
                
                // Fallback to default year if range logic fails or isn't available
                try {
                    return LocalDate.of(fallbackYear, month, day);
                } catch (Exception ignored) {}
            } catch (DateTimeParseException ignored) {
            }
        }

        throw new IllegalArgumentException("Invalid transaction date: " + rawDate);
    }

    private AmountInfo parseAmount(Map<String, String> row) {
        String debitText = firstNonBlank(row, "debit", "debits", "withdrawal", "withdrawals", "expense", "expenses",
                "withdrawal_amount", "payment", "payments");
        String creditText = firstNonBlank(row, "credit", "credits", "deposit", "deposits", "income", "received");
        String amountText = firstNonBlank(row, "amount", "amount_in_rs", "transaction_amount", "value");

        BigDecimal creditVal = null;
        if (creditText != null) {
            try {
                creditVal = parseMoney(creditText);
            } catch (Exception ignored) {
            }
        }

        BigDecimal debitVal = null;
        if (debitText != null) {
            try {
                debitVal = parseMoney(debitText);
            } catch (Exception ignored) {
            }
        }

        if (creditVal != null && creditVal.compareTo(BigDecimal.ZERO) > 0) {
            return new AmountInfo(creditVal, "INCOME");
        }
        if (debitVal != null && debitVal.compareTo(BigDecimal.ZERO) > 0) {
            return new AmountInfo(debitVal, "EXPENSE");
        }

        if (amountText != null) {
            BigDecimal amount = parseMoney(amountText);
            if (amount.compareTo(BigDecimal.ZERO) != 0) {
                return new AmountInfo(amount.abs(), amount.signum() < 0 ? "EXPENSE" : "INCOME");
            }
        }

        throw new IllegalArgumentException("Zero or missing amount.");
    }

    private BigDecimal parseMoney(String raw) {
        String normalized = raw.replaceAll("[^0-9.-]", "");
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("Missing amount.");
        }
        return new BigDecimal(normalized);
    }

    private String resolveTransactionType(String explicitType, AmountInfo amountInfo) {
        if (explicitType != null && !explicitType.isBlank()) {
            String normalized = explicitType.trim().toUpperCase(Locale.ROOT);
            if ("DR".equals(normalized) || "DEBIT".equals(normalized) || "PAY".equals(normalized)) {
                return "EXPENSE";
            }
            if ("CR".equals(normalized) || "CREDIT".equals(normalized) || "COLLECT".equals(normalized)) {
                return "INCOME";
            }
            return normalized;
        }
        return amountInfo.transactionType();
    }

    private String normalizeMerchant(String merchantName) {
        return merchantName == null
                ? "unknown_merchant"
                : merchantName.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    private String normalizeFingerprintValue(String value) {
        return normalizeFingerprintValue(value, null);
    }

    private String normalizeFingerprintValue(String primary, String fallback) {
        String value = primary;
        if (value == null || value.isBlank()) {
            value = fallback;
        }
        if (value == null) {
            return null;
        }
        String normalized = value.toLowerCase(Locale.ROOT)
                .replaceAll(
                        "(?i)\\b(upi|imps|neft|rtgs|dr|cr|debit|credit|payment|from|to|note|tag|transaction|ref|reference|id)\\b",
                        " ")
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized.isBlank() ? null : normalized;
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

    private record AmountInfo(BigDecimal amount, String transactionType) {
    }

    private record ParsedRow(
            String rawRow,
            LocalDate transactionDate,
            BigDecimal amount,
            String transactionType,
            String payee,
            String payeeNormalized,
            String description,
            String referenceNumber,
            UUID categoryId,
            String paymentMode,
            String fingerprint,
            BigDecimal runningBalance,
            String error) {
    }

    ParticularsDetails extractDetailsFromParticulars(String particulars, String transactionType) {
        if (particulars == null || particulars.isBlank()) {
            return new ParticularsDetails("Unknown", null, null);
        }

        String raw = particulars.trim();
        String merchant = raw;
        String refNum = null;
        String note = null;

        // 1. Check if it's standard UPI/IMPS/NEFT with slash separators
        if (raw.toUpperCase(Locale.ROOT).startsWith("UPI/") || raw.toUpperCase(Locale.ROOT).startsWith("IMPS/")
                || raw.toUpperCase(Locale.ROOT).startsWith("NEFT/")) {
            String[] parts = raw.split("/");
            if (parts.length >= 3) {
                refNum = parts[1].trim();
                // For UPI, the layout is UPI/DR/RRN/Merchant/... so RRN is parts[2]
                if (raw.toUpperCase(Locale.ROOT).startsWith("UPI/")) {
                    if (parts.length >= 4) {
                        refNum = parts[2].trim();
                        merchant = parts[3].trim();
                        if (parts.length >= 7) {
                            note = parts[6].trim();
                        } else if (parts.length >= 6) {
                            note = parts[5].trim();
                        } else if (parts.length >= 5) {
                            note = parts[4].trim();
                        }
                    }
                } else {
                    merchant = parts[2].trim();
                    if (parts.length >= 4) {
                        note = parts[3].trim();
                    }
                }
            }
        }
        // 2. Check HDFC style UPI format: UPI-Merchant-VPA-RRN-Description
        else if (raw.toUpperCase(Locale.ROOT).startsWith("UPI-")) {
            String[] parts = raw.split("-");
            if (parts.length >= 5) {
                merchant = parts[1].trim();
                refNum = parts[4].trim();
                if (parts.length >= 6) {
                    note = parts[5].trim();
                }
            } else if (parts.length >= 3) {
                merchant = parts[1].trim();
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\b\\d{12}\\b").matcher(raw);
                if (m.find()) {
                    refNum = m.group();
                }
            }
        }
        // 3. Fallback to extracting digits and prefixes
        else {
            String upper = raw.toUpperCase(Locale.ROOT);
            if (upper.contains("UPI REF NO") || upper.contains("UPI REF")) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?:UPI\\s+REF\\s+(?:NO\\s+)?)(\\d+)")
                        .matcher(upper);
                if (m.find()) {
                    refNum = m.group(1);
                }
            } else {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\b\\d{12}\\b").matcher(raw);
                if (m.find()) {
                    refNum = m.group();
                }
            }

            if (upper.startsWith("PAID TO ")) {
                merchant = raw.substring(8).trim();
            } else if (upper.startsWith("RECEIVED FROM ")) {
                merchant = raw.substring(14).trim();
            } else if (upper.startsWith("REFUND FROM ")) {
                merchant = raw.substring(12).trim();
            } else if (upper.startsWith("MONEY SENT TO ")) {
                merchant = raw.substring(14).trim();
            }
        }

        // 4. Standardize Interest, Charges, GST, etc.
        String upperMerchant = merchant.toUpperCase(Locale.ROOT);
        if (upperMerchant.contains("INTEREST PAID") || upperMerchant.contains("INTEREST CR")
                || upperMerchant.contains("INT CR.") || upperMerchant.contains("INT.CR")
                || upperMerchant.contains("INT CR") || upperMerchant.contains("INT. PAID")) {
            merchant = "Interest Paid";
        } else if (upperMerchant.contains("INTEREST CHARGED") || upperMerchant.contains("INTEREST DR")
                || upperMerchant.contains("INT DR.") || upperMerchant.contains("INT.DR")
                || upperMerchant.contains("INT DR") || upperMerchant.contains("INT. CHARGED")) {
            merchant = "Interest Charged";
        } else if (upperMerchant.contains("ANNUAL MAINTENANCE CHARGE") || upperMerchant.contains("AMC")) {
            merchant = "Annual Maintenance Charges";
        } else if (upperMerchant.contains("GST")) {
            merchant = "GST Charges";
        } else if (upperMerchant.contains("CHARGES") || upperMerchant.contains("CHARGE")
                || upperMerchant.contains("CHG")) {
            merchant = "Bank Charges";
        }

        if (note == null) {
            java.util.regex.Matcher noteMatcher = java.util.regex.Pattern
                    .compile("(?i)\\bnote\\s*:?\\s*(.+?)(?:\\s+tag:|\\s+upi\\s+id:|\\s+upi\\s+ref\\s+no:?|$)")
                    .matcher(raw);
            if (noteMatcher.find()) {
                note = noteMatcher.group(1).replaceAll("\\s{2,}", " ").trim();
            }
        }

        merchant = cleanMerchantName(merchant);

        if (merchant == null || merchant.isBlank()) {
            merchant = "Unknown";
        }

        return new ParticularsDetails(merchant, refNum, note);
    }

    String cleanMerchantName(String name) {
        if (name == null)
            return null;
        String cleaned = name.replaceAll("(?i)^\\s*(mr\\.?|ms\\.?|mrs\\.?|dr\\.?|upi-)\\s+", "").trim();
        cleaned = cleaned.replaceAll("\\s+\\d{4,}\\s*$", "").trim();
        if (cleaned.contains("/")) {
            String[] parts = cleaned.split("/");
            if (parts.length > 0 && !parts[0].trim().isEmpty()) {
                cleaned = parts[0].trim();
            }
        }
        return cleaned;
    }

    record ParticularsDetails(String payee, String referenceNumber, String description) {
    }
}
