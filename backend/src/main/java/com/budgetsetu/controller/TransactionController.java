package com.budgetsetu.controller;

import com.budgetsetu.dto.request.TransactionRequest;
import com.budgetsetu.model.mongo.AuditEvent;
import com.budgetsetu.model.sql.Transaction;
import com.budgetsetu.service.AuditService;
import com.budgetsetu.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
/**
 * REST Controller for transactions.
 * Manages individual income and expense records, including creation,
 * modification, soft-deletion, and audit history.
 */
public class TransactionController {

    private final TransactionService transactionService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<Page<Transaction>> getTransactions(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 25) Pageable pageable) {
        return ResponseEntity.ok(transactionService.getTransactions(
                userId, startDate, endDate, categoryId, accountId, type, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransaction(@PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(transactionService.getTransaction(id, userId));
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody TransactionRequest request) {
        Transaction transaction = transactionService.createTransaction(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody TransactionRequest request) {
        Transaction transaction = transactionService.updateTransaction(id, userId, request);
        return ResponseEntity.ok(transaction);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Transaction> patchTransaction(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId,
            @RequestBody java.util.Map<String, Object> updates) {
        Transaction transaction = transactionService.patchTransaction(id, userId, updates);
        return ResponseEntity.ok(transaction);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        transactionService.softDelete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<AuditEvent>> getTransactionHistory(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        // Validate transaction ownership before returning history
        transactionService.getTransaction(id, userId);
        return ResponseEntity.ok(auditService.getHistory("TRANSACTION", id));
    }
}
