package com.budgetsetu.controller;

import com.budgetsetu.dto.request.RecurringExpenseRequest;
import com.budgetsetu.dto.response.RecurringExpenseResponse;
import com.budgetsetu.service.RecurringExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recurring-expenses")
@RequiredArgsConstructor
/**
 * REST Controller for recurring expenses.
 * Manages fixed subscriptions and recurring bills, tracking their due dates and
 * statuses.
 */
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    @PostMapping
    public ResponseEntity<RecurringExpenseResponse> createRecurringExpense(Authentication authentication,
            @Valid @RequestBody RecurringExpenseRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(recurringExpenseService.createRecurringExpense(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecurringExpenseResponse> updateRecurringExpense(Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody RecurringExpenseRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(recurringExpenseService.updateRecurringExpense(userId, id, request));
    }

    @GetMapping
    public ResponseEntity<List<RecurringExpenseResponse>> getRecurringExpenses(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(recurringExpenseService.getRecurringExpenses(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecurringExpense(Authentication authentication, @PathVariable UUID id) {
        UUID userId = UUID.fromString(authentication.getName());
        recurringExpenseService.deleteRecurringExpense(userId, id);
        return ResponseEntity.noContent().build();
    }
}
