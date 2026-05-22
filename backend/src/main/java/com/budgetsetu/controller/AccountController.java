package com.budgetsetu.controller;

import com.budgetsetu.dto.request.AccountRequest;
import com.budgetsetu.model.sql.Account;
import com.budgetsetu.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
/**
 * REST Controller for managing user financial accounts.
 * Provides endpoints for creating, retrieving, updating, deleting, and merging bank accounts, credit cards, and cash wallets.
 */
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<Account>> getAccounts(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.getActiveAccounts(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccount(@PathVariable UUID id,
                                               @AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.getAccount(id, userId));
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@AuthenticationPrincipal UUID userId,
                                                  @Valid @RequestBody AccountRequest request) {
        Account account = accountService.createAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(account);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(@PathVariable UUID id,
                                                 @AuthenticationPrincipal UUID userId,
                                                 @Valid @RequestBody AccountRequest request) {
        Account account = accountService.updateAccount(id, userId, request);
        return ResponseEntity.ok(account);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable UUID id,
                                               @AuthenticationPrincipal UUID userId) {
        accountService.deleteAccount(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    public ResponseEntity<Account> mergeAccounts(@AuthenticationPrincipal UUID userId,
                                                 @Valid @RequestBody com.budgetsetu.dto.request.MergeAccountRequest request) {
        Account mergedAccount = accountService.mergeAccounts(userId, request);
        return ResponseEntity.ok(mergedAccount);
    }
}
