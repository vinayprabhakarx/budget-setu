package com.budgetsetu.service;

import com.budgetsetu.dto.request.AccountRequest;
import com.budgetsetu.exception.ResourceNotFoundException;
import com.budgetsetu.model.sql.Account;
import com.budgetsetu.repository.sql.AccountRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import com.budgetsetu.repository.sql.StatementImportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final StatementImportRepository statementImportRepository;

    public List<Account> getActiveAccounts(UUID userId) {
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrue(userId);
        for (Account account : accounts) {
            account.setBalance(calculateAccountBalance(account, userId));
        }
        return accounts;
    }

    public Account getAccount(UUID id, UUID userId) {
        Account account = accountRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("This account could not be found."));
        account.setBalance(calculateAccountBalance(account, userId));
        return account;
    }

    private java.math.BigDecimal calculateAccountBalance(Account account, UUID userId) {
        if (account == null) {
            return null;
        }

        // 1. First priority: check if there are statement transactions with a running balance
        List<java.math.BigDecimal> latestBalList = transactionRepository.findLatestRunningBalance(
                account.getId(), userId, org.springframework.data.domain.PageRequest.of(0, 1));
        if (latestBalList != null && !latestBalList.isEmpty()) {
            return latestBalList.get(0);
        }

        // 2. Second priority: if not available in statement, check if manual balance date is set
        if (account.getManualBalanceDate() != null) {
            java.math.BigDecimal manualBal = account.getManualBalance() != null ? account.getManualBalance() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal sumAfter = transactionRepository.sumTransactionsAfterDate(account.getId(), userId, account.getManualBalanceDate());
            return manualBal.add(sumAfter != null ? sumAfter : java.math.BigDecimal.ZERO);
        }

        // 3. Otherwise, return null (leave blank, don't display)
        return null;
    }

    @Transactional
    public Account createAccount(UUID userId, AccountRequest request) {
        if (accountRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new IllegalArgumentException(
                    "You already have an account named '" + request.getName() + "'. Please use a different name."
            );
        }

        String accountNumber = request.getAccountNumber();
        if (accountNumber != null && accountNumber.length() >= 4) {
            accountNumber = accountNumber.substring(accountNumber.length() - 4);
        }

        Account account = Account.builder()
                .userId(userId)
                .name(request.getName().trim())
                .bankName(request.getBankName())
                .accountNumber(accountNumber)
                .accountType(request.getAccountType().toUpperCase())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .manualBalance(request.getManualBalance())
                .manualBalanceDate(request.getManualBalanceDate())
                .build();

        return accountRepository.save(account);
    }

    @Transactional
    public Account updateAccount(UUID id, UUID userId, AccountRequest request) {
        Account account = getAccount(id, userId);

        if (!account.getName().equals(request.getName().trim())) {
            if (accountRepository.existsByUserIdAndName(userId, request.getName().trim())) {
                throw new IllegalArgumentException(
                        "You already have an account named '" + request.getName() + "'. Please use a different name."
                );
            }
        }

        account.setName(request.getName().trim());
        account.setBankName(request.getBankName());

        String accountNumber = request.getAccountNumber();
        if (accountNumber != null && accountNumber.length() >= 4) {
            accountNumber = accountNumber.substring(accountNumber.length() - 4);
        }
        account.setAccountNumber(accountNumber);

        account.setAccountType(request.getAccountType().toUpperCase());
        if (request.getCurrency() != null) {
            account.setCurrency(request.getCurrency());
        }
        account.setManualBalance(request.getManualBalance());
        account.setManualBalanceDate(request.getManualBalanceDate());

        return accountRepository.save(account);
    }

    @Transactional
    public void deleteAccount(UUID id, UUID userId) {
        Account account = getAccount(id, userId);
        transactionRepository.deleteByAccountIdAndUserId(id, userId);
        statementImportRepository.deleteByAccountIdAndUserId(id, userId);
        accountRepository.delete(account);
    }

    @Transactional
    public Account mergeAccounts(UUID userId, com.budgetsetu.dto.request.MergeAccountRequest request) {
        if (request.getSourceAccountId().equals(request.getDestinationAccountId())) {
            throw new IllegalArgumentException("Source and destination accounts must be different.");
        }

        Account sourceAccount = getAccount(request.getSourceAccountId(), userId);
        Account destAccount = getAccount(request.getDestinationAccountId(), userId);

        // Relink all transactions
        transactionRepository.updateAccountId(request.getSourceAccountId(), request.getDestinationAccountId(), userId);

        // Relink all statement imports
        statementImportRepository.updateAccountId(request.getSourceAccountId(), request.getDestinationAccountId(), userId);

        java.math.BigDecimal sourceBal = sourceAccount.getBalance() != null ? sourceAccount.getBalance() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal destBal = destAccount.getBalance() != null ? destAccount.getBalance() : java.math.BigDecimal.ZERO;

        // Update destination account details
        String mode = request.getDetailsSource().trim().toUpperCase();
        if ("SOURCE".equals(mode)) {
            // Keep source details on the destination account
            destAccount.setName(sourceAccount.getName());
            destAccount.setBankName(sourceAccount.getBankName());
            destAccount.setAccountNumber(sourceAccount.getAccountNumber());
            destAccount.setAccountType(sourceAccount.getAccountType());
            destAccount.setCurrency(sourceAccount.getCurrency());
            destAccount.setBalance(destBal.add(sourceBal));
        } else if ("DESTINATION".equals(mode)) {
            // Keep destination details, just sum balance
            destAccount.setBalance(destBal.add(sourceBal));
        } else if ("CUSTOM".equals(mode)) {
            // Custom details
            String customName = request.getCustomName();
            if (customName == null || customName.trim().isBlank()) {
                throw new IllegalArgumentException("Custom account name is required.");
            }
            customName = customName.trim();
            // Validate name uniqueness if it changes
            if (!destAccount.getName().equalsIgnoreCase(customName)) {
                java.util.Optional<Account> existingOpt = accountRepository.findByUserIdAndName(userId, customName);
                if (existingOpt.isPresent()) {
                    Account existing = existingOpt.get();
                    if (!existing.getId().equals(request.getSourceAccountId()) && !existing.getId().equals(request.getDestinationAccountId())) {
                        throw new IllegalArgumentException("You already have an account named '" + customName + "'. Please use a different name.");
                    }
                }
            }

            destAccount.setName(customName);
            destAccount.setBankName(request.getCustomBankName());

            String accountNumber = request.getCustomAccountNumber();
            if (accountNumber != null && accountNumber.length() >= 4) {
                accountNumber = accountNumber.substring(accountNumber.length() - 4);
            }
            destAccount.setAccountNumber(accountNumber);

            if (request.getCustomAccountType() == null || request.getCustomAccountType().trim().isBlank()) {
                throw new IllegalArgumentException("Custom account type is required.");
            }
            destAccount.setAccountType(request.getCustomAccountType().trim().toUpperCase());

            if (request.getCustomCurrency() != null) {
                destAccount.setCurrency(request.getCustomCurrency().trim());
            }

            if (request.getCustomBalance() != null) {
                destAccount.setBalance(request.getCustomBalance());
            } else {
                destAccount.setBalance(destBal.add(sourceBal));
            }
        } else {
            throw new IllegalArgumentException("Invalid details source selection: " + request.getDetailsSource());
        }

        // Delete source account
        accountRepository.delete(sourceAccount);

        // Save and return destination account
        return accountRepository.save(destAccount);
    }
}
