package com.budgetsetu.service;

import com.budgetsetu.dto.request.TransactionRequest;
import com.budgetsetu.exception.DuplicateTransactionException;
import com.budgetsetu.exception.ResourceNotFoundException;
import com.budgetsetu.model.sql.Transaction;
import com.budgetsetu.repository.sql.TransactionRepository;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.util.FingerprintUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AuditService auditService;
    private final AnalyticsService analyticsService;
    private final DashboardService dashboardService;
    private final BudgetPlanService budgetPlanService;

    public Page<Transaction> getTransactions(UUID userId,
            LocalDate startDate,
            LocalDate endDate,
            UUID categoryId,
            UUID accountId,
            String type,
            String search,
            Pageable pageable) {
        Specification<Transaction> spec = Specification.where((root, query, cb) -> cb.and(
                cb.equal(root.get("userId"), userId),
                cb.equal(root.get("isDeleted"), false)));

        if (startDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
        }
        if (endDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("categoryId"), categoryId));
        }
        if (accountId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("accountId"), accountId));
        }
        if (type != null && !type.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("transactionType"), type.toUpperCase()));
        }
        if (search != null && !search.isBlank()) {
            List<Transaction> allMatching = transactionRepository.findAll(spec);
            String searchLower = search.toLowerCase(Locale.ROOT);
            String searchClean = searchLower.replace(",", "").replace("₹", "").replace("$", "").replace("rs.", "")
                    .replace("rs", "").replace("inr", "").replace(" ", "").replace("+", "").replace("-", "");
            Map<UUID, String> catNames = new HashMap<>();
            if (categoryRepository != null) {
                categoryRepository.findAllForUser(userId).forEach(
                        c -> catNames.put(c.getId(), c.getName() != null ? c.getName().toLowerCase(Locale.ROOT) : ""));
            }
            List<Transaction> filtered = allMatching.stream().filter(t -> {
                if (t.getPayee() != null && t.getPayee().toLowerCase(Locale.ROOT).contains(searchLower))
                    return true;
                if (t.getDescription() != null && t.getDescription().toLowerCase(Locale.ROOT).contains(searchLower))
                    return true;
                if (t.getReferenceNumber() != null
                        && t.getReferenceNumber().toLowerCase(Locale.ROOT).contains(searchLower))
                    return true;
                if (t.getPaymentMode() != null && t.getPaymentMode().toLowerCase(Locale.ROOT).contains(searchLower))
                    return true;
                if (t.getRawDescription() != null
                        && t.getRawDescription().toLowerCase(Locale.ROOT).contains(searchLower))
                    return true;
                if (t.getAmount() != null) {
                    String amtPlain = t.getAmount().toPlainString();
                    String amtStripped = t.getAmount().stripTrailingZeros().toPlainString();
                    if (amtPlain.contains(searchLower) || amtStripped.contains(searchLower))
                        return true;
                    if (!searchClean.isEmpty() && (amtPlain.contains(searchClean) || amtStripped.contains(searchClean)))
                        return true;
                }
                if (t.getTransactionDate() != null && t.getTransactionDate().toString().contains(searchLower))
                    return true;
                if (t.getTransactionType() != null
                        && t.getTransactionType().toLowerCase(Locale.ROOT).contains(searchLower))
                    return true;
                if (t.getSource() != null && t.getSource().toLowerCase(Locale.ROOT).contains(searchLower))
                    return true;
                if (t.getTags() != null) {
                    for (String tag : t.getTags()) {
                        if (tag != null && tag.toLowerCase(Locale.ROOT).contains(searchLower))
                            return true;
                    }
                }
                if (t.getCategoryId() != null) {
                    String cName = catNames.get(t.getCategoryId());
                    if (cName != null && cName.contains(searchLower))
                        return true;
                }
                return false;
            }).toList();

            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), filtered.size());
            List<Transaction> pageContent = start <= end ? filtered.subList(start, end) : List.of();
            return new PageImpl<>(pageContent, pageable, filtered.size());
        }

        return transactionRepository.findAll(spec, pageable);
    }

    public Transaction getTransaction(UUID id, UUID userId) {
        return transactionRepository.findByIdAndUserIdAndIsDeletedFalse(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("This transaction could not be found."));
    }

    @Transactional
    public Transaction createTransaction(UUID userId, TransactionRequest request) {
        // Edge case: reject future dates
        if (request.getTransactionDate().isAfter(LocalDate.now().plusDays(1))) {
            throw new IllegalArgumentException("Transaction date cannot be in the future.");
        }

        // Generate fingerprint for dedup
        String fingerprint = FingerprintUtil.generate(
                request.getTransactionDate().toString(),
                request.getAmount().toPlainString(),
                null, // No reference for manual entries
                request.getPayee(),
                request.getAccountId().toString());

        if (transactionRepository.existsByUserIdAndFingerprint(userId, fingerprint)) {
            throw new DuplicateTransactionException(
                    "A transaction with these details already exists.");
        }

        Transaction transaction = Transaction.builder()
                .userId(userId)
                .accountId(request.getAccountId())
                .categoryId(request.getCategoryId())
                .amount(request.getAmount())
                .transactionType(request.getTransactionType().toUpperCase())
                .transactionDate(request.getTransactionDate())
                .payee(request.getPayee())
                .paymentMode(request.getPaymentMode())
                .description(request.getDescription())
                .referenceNumber(request.getReferenceNumber())
                .source("MANUAL")
                .categorySource(request.getCategoryId() != null ? "USER_SET" : null)
                .fingerprint(fingerprint)
                .build();

        syncTransactionTypeWithCategory(transaction, request.getCategoryId());

        Transaction saved = transactionRepository.save(transaction);
        analyticsService.evictAnalyticsCache(userId);
        dashboardService.evictDashboardCache(userId);
        budgetPlanService.evictBudgetCache(userId);
        return saved;
    }

    @Transactional
    public Transaction updateTransaction(UUID id, UUID userId, TransactionRequest request) {
        Transaction transaction = getTransaction(id, userId);

        // Edge case: reject future dates
        if (request.getTransactionDate().isAfter(LocalDate.now().plusDays(1))) {
            throw new IllegalArgumentException("Transaction date cannot be in the future.");
        }

        // Compare old and new values, log to AuditService for each change
        recordChange(userId, id, "accountId", transaction.getAccountId(), request.getAccountId());
        recordChange(userId, id, "categoryId", transaction.getCategoryId(), request.getCategoryId());
        recordChange(userId, id, "amount", transaction.getAmount(), request.getAmount());
        recordChange(userId, id, "transactionType", transaction.getTransactionType(),
                request.getTransactionType() != null ? request.getTransactionType().toUpperCase() : null);
        recordChange(userId, id, "transactionDate", transaction.getTransactionDate(), request.getTransactionDate());
        recordChange(userId, id, "payee", transaction.getPayee(), request.getPayee());
        recordChange(userId, id, "paymentMode", transaction.getPaymentMode(), request.getPaymentMode());
        recordChange(userId, id, "description", transaction.getDescription(), request.getDescription());

        recordChange(userId, id, "referenceNumber", transaction.getReferenceNumber(), request.getReferenceNumber());

        // Update fields
        transaction.setAccountId(request.getAccountId());
        transaction.setCategoryId(request.getCategoryId());
        transaction.setAmount(request.getAmount());
        transaction.setTransactionType(request.getTransactionType().toUpperCase());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setPayee(request.getPayee());
        transaction.setPaymentMode(request.getPaymentMode());
        transaction.setDescription(request.getDescription());
        transaction.setReferenceNumber(request.getReferenceNumber());

        // Recalculate fingerprint
        String fingerprint = FingerprintUtil.generate(
                request.getTransactionDate().toString(),
                request.getAmount().toPlainString(),
                request.getReferenceNumber() != null ? request.getReferenceNumber() : transaction.getReferenceNumber(), // update
                                                                                                                        // if
                                                                                                                        // provided,
                                                                                                                        // else
                                                                                                                        // preserve
                request.getPayee(),
                request.getAccountId().toString());

        // If fingerprint changed, verify uniqueness
        if (!fingerprint.equals(transaction.getFingerprint())) {
            if (transactionRepository.existsByUserIdAndFingerprint(userId, fingerprint)) {
                throw new DuplicateTransactionException(
                        "A transaction with these details already exists.");
            }
            transaction.setFingerprint(fingerprint);
        }

        syncTransactionTypeWithCategory(transaction, transaction.getCategoryId());

        Transaction saved = transactionRepository.save(transaction);
        analyticsService.evictAnalyticsCache(userId);
        dashboardService.evictDashboardCache(userId);
        budgetPlanService.evictBudgetCache(userId);
        return saved;
    }

    @Transactional
    public void softDelete(UUID id, UUID userId) {
        Transaction transaction = getTransaction(id, userId);
        transaction.setIsDeleted(true);
        transaction.setDeletedAt(LocalDateTime.now());
        transactionRepository.save(transaction);
        analyticsService.evictAnalyticsCache(userId);
        dashboardService.evictDashboardCache(userId);
        budgetPlanService.evictBudgetCache(userId);

        auditService.recordEvent(userId, "TRANSACTION", id, "is_deleted", "false", "true", "USER");
    }

    @Transactional
    public Transaction patchTransaction(UUID id, UUID userId, java.util.Map<String, Object> updates) {
        Transaction transaction = getTransaction(id, userId);

        if (updates.containsKey("categoryId")) {
            Object categoryIdVal = updates.get("categoryId");
            UUID newCategoryId = categoryIdVal == null ? null : UUID.fromString(categoryIdVal.toString());
            recordChange(userId, id, "categoryId", transaction.getCategoryId(), newCategoryId);
            transaction.setCategoryId(newCategoryId);
        }
        if (updates.containsKey("payee")) {
            Object payeeVal = updates.get("payee");
            String newPayee = payeeVal == null ? null : payeeVal.toString();
            recordChange(userId, id, "payee", transaction.getPayee(), newPayee);
            transaction.setPayee(newPayee);
        }
        if (updates.containsKey("paymentMode")) {
            Object modeVal = updates.get("paymentMode");
            String newMode = modeVal == null ? null : modeVal.toString();
            recordChange(userId, id, "paymentMode", transaction.getPaymentMode(), newMode);
            transaction.setPaymentMode(newMode);
        }
        if (updates.containsKey("description")) {
            Object descVal = updates.get("description");
            String newDesc = descVal == null ? null : descVal.toString();
            recordChange(userId, id, "description", transaction.getDescription(), newDesc);
            transaction.setDescription(newDesc);
        }
        if (updates.containsKey("referenceNumber")) {
            Object refVal = updates.get("referenceNumber");
            String newRef = refVal == null ? null : refVal.toString();
            recordChange(userId, id, "referenceNumber", transaction.getReferenceNumber(), newRef);
            transaction.setReferenceNumber(newRef);
        }
        if (updates.containsKey("tags")) {
            Object tagsVal = updates.get("tags");
            List<String> newTags = null;
            if (tagsVal instanceof List<?> rawList) {
                newTags = rawList.stream()
                        .filter(tag -> tag instanceof String)
                        .map(tag -> (String) tag)
                        .toList();
            }
            transaction.setTags(newTags != null ? newTags.toArray(new String[0]) : null);
        }

        // Re-calculate fingerprint
        String fingerprint = FingerprintUtil.generate(
                transaction.getTransactionDate().toString(),
                transaction.getAmount().toPlainString(),
                transaction.getReferenceNumber(),
                transaction.getPayee(),
                transaction.getAccountId().toString());
        transaction.setFingerprint(fingerprint);

        syncTransactionTypeWithCategory(transaction, transaction.getCategoryId());

        Transaction saved = transactionRepository.save(transaction);
        analyticsService.evictAnalyticsCache(userId);
        dashboardService.evictDashboardCache(userId);
        budgetPlanService.evictBudgetCache(userId);
        return saved;
    }

    private void syncTransactionTypeWithCategory(Transaction transaction, UUID categoryId) {
        if (categoryId != null) {
            categoryRepository.findById(categoryId).ifPresent(category -> {
                transaction.setTransactionType(category.getType());
            });
        }
    }

    private void recordChange(UUID userId, UUID entityId, String field, Object oldValue, Object newValue) {
        String oldValStr = oldValue == null ? "null" : oldValue.toString();
        String newValStr = newValue == null ? "null" : newValue.toString();
        if (!oldValStr.equals(newValStr)) {
            auditService.recordEvent(userId, "TRANSACTION", entityId, field, oldValStr, newValStr, "USER");
        }
    }
}
