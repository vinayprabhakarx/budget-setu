package com.budgetsetu.service;

import com.budgetsetu.model.mongo.MerchantRule;
import com.budgetsetu.model.sql.*;
import com.budgetsetu.repository.mongo.MerchantRuleRepository;
import com.budgetsetu.repository.sql.*;
import com.budgetsetu.dto.response.RestoreSummary;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.AesKeyStrength;
import net.lingala.zip4j.model.enums.EncryptionMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.BeanUtils;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BackupService {

    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BudgetPlanRepository budgetPlanRepository;
    @Autowired
    private RecurringExpenseRepository recurringExpenseRepository;
    @Autowired
    private GoalRepository goalRepository;
    @Autowired
    private MerchantRuleRepository merchantRuleRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private void verifyPassword(UUID userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid account password");
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public byte[] exportWorkspace(UUID userId, String accountPassword, String zipPassword) throws IOException {
        verifyPassword(userId, accountPassword);

        List<Account> accounts = accountRepository.findByUserId(userId);
        List<Transaction> transactions = transactionRepository.findByUserId(userId);
        List<Category> categories = categoryRepository.findByUserId(userId);
        List<BudgetPlan> budgetPlans = budgetPlanRepository.findByUserId(userId);
        List<RecurringExpense> recurringExpenses = recurringExpenseRepository.findByUserId(userId);
        List<Goal> goals = goalRepository.findByUserId(userId);
        List<MerchantRule> rules = merchantRuleRepository.findByUserId(userId.toString());

        Path tempDir = Files.createTempDirectory("budgetsetu-backup");
        Path zipFilePath = tempDir.resolve("backup.zip");

        File accountsFile = new File(tempDir.toFile(), "accounts.json");
        File transactionsFile = new File(tempDir.toFile(), "transactions.json");
        File categoriesFile = new File(tempDir.toFile(), "categories.json");
        File budgetPlansFile = new File(tempDir.toFile(), "budget_plans.json");
        File recurringExpensesFile = new File(tempDir.toFile(), "recurring_expenses.json");
        File goalsFile = new File(tempDir.toFile(), "goals.json");
        File rulesFile = new File(tempDir.toFile(), "rules.json");

        objectMapper.writeValue(accountsFile, accounts);
        objectMapper.writeValue(transactionsFile, transactions);
        objectMapper.writeValue(categoriesFile, categories);
        objectMapper.writeValue(budgetPlansFile, budgetPlans);
        objectMapper.writeValue(recurringExpensesFile, recurringExpenses);
        objectMapper.writeValue(goalsFile, goals);
        objectMapper.writeValue(rulesFile, rules);

        ZipParameters zipParameters = new ZipParameters();
        boolean useEncryption = zipPassword != null && !zipPassword.isEmpty();
        if (useEncryption) {
            zipParameters.setEncryptFiles(true);
            zipParameters.setEncryptionMethod(EncryptionMethod.AES);
            zipParameters.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_256);
        }

        try (ZipFile zipFile = (zipPassword != null && !zipPassword.isEmpty())
                ? new ZipFile(zipFilePath.toFile(), zipPassword.toCharArray())
                : new ZipFile(zipFilePath.toFile())) {
            zipFile.addFile(accountsFile, zipParameters);
            zipFile.addFile(transactionsFile, zipParameters);
            zipFile.addFile(categoriesFile, zipParameters);
            zipFile.addFile(budgetPlansFile, zipParameters);
            zipFile.addFile(recurringExpensesFile, zipParameters);
            zipFile.addFile(goalsFile, zipParameters);
            zipFile.addFile(rulesFile, zipParameters);
        }

        byte[] zipBytes = Files.readAllBytes(zipFilePath);

        // Cleanup
        accountsFile.delete();
        transactionsFile.delete();
        categoriesFile.delete();
        budgetPlansFile.delete();
        recurringExpensesFile.delete();
        goalsFile.delete();
        rulesFile.delete();
        zipFilePath.toFile().delete();
        tempDir.toFile().delete();

        return zipBytes;
    }

    @Transactional
    public RestoreSummary restoreWorkspace(UUID userId, MultipartFile file, String accountPassword, String zipPassword)
            throws IOException {
        verifyPassword(userId, accountPassword);

        Path tempDir = Files.createTempDirectory("budgetsetu-restore");
        Path zipFilePath = tempDir.resolve("uploaded.zip");
        file.transferTo(zipFilePath.toFile());

        try (ZipFile zipFile = (zipPassword != null && !zipPassword.isEmpty())
                ? new ZipFile(zipFilePath.toFile(), zipPassword.toCharArray())
                : new ZipFile(zipFilePath.toFile())) {

            if (!zipFile.isValidZipFile()) {
                throw new RuntimeException("Invalid backup file format");
            }
            if (zipFile.isEncrypted()) {
                if (zipPassword == null || zipPassword.isEmpty()) {
                    throw new RuntimeException("ZIP_PASSWORD_REQUIRED");
                }
                zipFile.extractAll(tempDir.toString());
            } else {
                zipFile.extractAll(tempDir.toString());
            }
        } catch (Exception e) {
            if ("ZIP_PASSWORD_REQUIRED".equals(e.getMessage()))
                throw e;
            throw new RuntimeException("Failed to extract backup file. Incorrect zip password?");
        }

        RestoreSummary summary = new RestoreSummary();

        Map<UUID, UUID> accountIdMap = new HashMap<>();
        Map<UUID, UUID> categoryIdMap = new HashMap<>();
        Map<UUID, UUID> budgetPlanIdMap = new HashMap<>();

        // Parse and restore
        File accountsFile = new File(tempDir.toFile(), "accounts.json");
        if (accountsFile.exists()) {
            List<Account> accounts = objectMapper.readValue(accountsFile, new TypeReference<List<Account>>() {
            });
            for (Account acc : accounts) {
                UUID oldId = acc.getId();
                acc.setUserId(userId);
                if (accountRepository.existsById(oldId)) {
                    Account existing = accountRepository.findById(oldId).get();
                    BeanUtils.copyProperties(acc, existing, "id", "createdAt", "updatedAt");
                    accountRepository.save(existing);
                    accountIdMap.put(oldId, oldId);
                } else {
                    acc.setId(null);
                    Account saved = accountRepository.save(acc);
                    accountIdMap.put(oldId, saved.getId());
                }
                summary.setAccountsRestored(summary.getAccountsRestored() + 1);
            }
        }

        File categoriesFile = new File(tempDir.toFile(), "categories.json");
        if (categoriesFile.exists()) {
            List<Category> categories = objectMapper.readValue(categoriesFile, new TypeReference<List<Category>>() {
            });
            for (Category cat : categories) {
                UUID oldId = cat.getId();
                if (cat.getUserId() != null) {
                    cat.setUserId(userId);
                }
                if (categoryRepository.existsById(oldId)) {
                    Category existing = categoryRepository.findById(oldId).get();
                    BeanUtils.copyProperties(cat, existing, "id", "createdAt", "updatedAt");
                    categoryRepository.save(existing);
                    categoryIdMap.put(oldId, oldId);
                } else {
                    cat.setId(null);
                    Category saved = categoryRepository.save(cat);
                    categoryIdMap.put(oldId, saved.getId());
                }
            }
        }

        File budgetPlansFile = new File(tempDir.toFile(), "budget_plans.json");
        if (budgetPlansFile.exists()) {
            List<BudgetPlan> budgetPlans = objectMapper.readValue(budgetPlansFile,
                    new TypeReference<List<BudgetPlan>>() {
                    });
            for (BudgetPlan bp : budgetPlans) {
                UUID oldId = bp.getId();
                bp.setUserId(userId);
                // Process allocations category mapping
                if (bp.getAllocations() != null) {
                    for (BudgetAllocation alloc : bp.getAllocations()) {
                        alloc.setCategoryId(categoryIdMap.getOrDefault(alloc.getCategoryId(), alloc.getCategoryId()));
                    }
                }

                if (budgetPlanRepository.existsById(oldId)) {
                    BudgetPlan existing = budgetPlanRepository.findById(oldId).get();
                    // Custom copy logic because of nested collections
                    existing.setName(bp.getName());
                    existing.setPeriodType(bp.getPeriodType());
                    existing.setStartDate(bp.getStartDate());
                    existing.setEndDate(bp.getEndDate());
                    existing.setTotalAmount(bp.getTotalAmount());

                    // Note: merging nested collections properly requires more logic,
                    // for a fresh start/restore we will clear and add
                    existing.getAllocations().clear();
                    if (bp.getAllocations() != null) {
                        for (BudgetAllocation alloc : bp.getAllocations()) {
                            existing.addAllocation(alloc);
                        }
                    }
                    budgetPlanRepository.save(existing);
                    budgetPlanIdMap.put(oldId, oldId);
                } else {
                    bp.setId(null);
                    // Clear recursive parent from allocations to avoid detached entity passed to
                    // persist
                    if (bp.getAllocations() != null) {
                        for (BudgetAllocation alloc : bp.getAllocations()) {
                            alloc.setId(null);
                            alloc.setBudgetPlan(bp);
                        }
                    }
                    // Removed subBudgets clearing
                    BudgetPlan saved = budgetPlanRepository.save(bp);
                    budgetPlanIdMap.put(oldId, saved.getId());
                }
                summary.setBudgetPlansRestored(summary.getBudgetPlansRestored() + 1);
            }
        }

        File recurringExpensesFile = new File(tempDir.toFile(), "recurring_expenses.json");
        if (recurringExpensesFile.exists()) {
            List<RecurringExpense> recurringExpenses = objectMapper.readValue(recurringExpensesFile,
                    new TypeReference<List<RecurringExpense>>() {
                    });
            for (RecurringExpense re : recurringExpenses) {
                re.setUserId(userId);
                if (re.getCategoryId() != null) {
                    re.setCategoryId(categoryIdMap.getOrDefault(re.getCategoryId(), re.getCategoryId()));
                }
                if (recurringExpenseRepository.existsById(re.getId())) {
                    RecurringExpense existing = recurringExpenseRepository.findById(re.getId()).get();
                    BeanUtils.copyProperties(re, existing, "id", "createdAt", "updatedAt");
                    recurringExpenseRepository.save(existing);
                } else {
                    re.setId(null);
                    recurringExpenseRepository.save(re);
                }
                summary.setRecurringExpensesRestored(summary.getRecurringExpensesRestored() + 1);
            }
        }

        File goalsFile = new File(tempDir.toFile(), "goals.json");
        if (goalsFile.exists()) {
            List<Goal> goals = objectMapper.readValue(goalsFile, new TypeReference<List<Goal>>() {
            });
            for (Goal g : goals) {
                g.setUserId(userId);
                if (goalRepository.existsById(g.getId())) {
                    Goal existing = goalRepository.findById(g.getId()).get();
                    BeanUtils.copyProperties(g, existing, "id", "createdAt", "updatedAt");
                    goalRepository.save(existing);
                } else {
                    g.setId(null);
                    goalRepository.save(g);
                }
                summary.setGoalsRestored(summary.getGoalsRestored() + 1);
            }
        }

        File transactionsFile = new File(tempDir.toFile(), "transactions.json");
        if (transactionsFile.exists()) {
            List<Transaction> transactions = objectMapper.readValue(transactionsFile,
                    new TypeReference<List<Transaction>>() {
                    });
            for (Transaction t : transactions) {
                t.setUserId(userId);
                if (t.getAccountId() != null) {
                    t.setAccountId(accountIdMap.getOrDefault(t.getAccountId(), t.getAccountId()));
                }
                if (t.getCategoryId() != null) {
                    t.setCategoryId(categoryIdMap.getOrDefault(t.getCategoryId(), t.getCategoryId()));
                }
                if (transactionRepository.existsById(t.getId())) {
                    Transaction existing = transactionRepository.findById(t.getId()).get();
                    BeanUtils.copyProperties(t, existing, "id", "createdAt", "updatedAt");
                    transactionRepository.save(existing);
                } else {
                    t.setId(null);
                    transactionRepository.save(t);
                }
                summary.setTransactionsRestored(summary.getTransactionsRestored() + 1);
            }
        }

        File rulesFile = new File(tempDir.toFile(), "rules.json");
        if (rulesFile.exists()) {
            List<MerchantRule> rules = objectMapper.readValue(rulesFile, new TypeReference<List<MerchantRule>>() {
            });
            for (MerchantRule r : rules) {
                r.setUserId(userId.toString());
                merchantRuleRepository.save(r);
                summary.setRulesRestored(summary.getRulesRestored() + 1);
            }
        }

        // Cleanup
        accountsFile.delete();
        transactionsFile.delete();
        categoriesFile.delete();
        budgetPlansFile.delete();
        recurringExpensesFile.delete();
        goalsFile.delete();
        rulesFile.delete();
        zipFilePath.toFile().delete();
        tempDir.toFile().delete();

        return summary;
    }
}
