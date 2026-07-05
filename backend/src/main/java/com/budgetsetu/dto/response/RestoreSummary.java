package com.budgetsetu.dto.response;

public class RestoreSummary {
    private int accountsRestored;
    private int transactionsRestored;
    private int budgetPlansRestored = 0;
    private int budgetAllocationsRestored = 0;
    private int recurringExpensesRestored = 0;
    private int goalsRestored;
    private int rulesRestored;
    private int skipped;

    // Getters and Setters
    public int getAccountsRestored() {
        return accountsRestored;
    }

    public void setAccountsRestored(int accountsRestored) {
        this.accountsRestored = accountsRestored;
    }

    public int getTransactionsRestored() {
        return transactionsRestored;
    }

    public void setTransactionsRestored(int transactionsRestored) {
        this.transactionsRestored = transactionsRestored;
    }

    public int getBudgetPlansRestored() {
        return budgetPlansRestored;
    }

    public void setBudgetPlansRestored(int budgetPlansRestored) {
        this.budgetPlansRestored = budgetPlansRestored;
    }

    public int getBudgetAllocationsRestored() {
        return budgetAllocationsRestored;
    }

    public void setBudgetAllocationsRestored(int budgetAllocationsRestored) {
        this.budgetAllocationsRestored = budgetAllocationsRestored;
    }

    public int getRecurringExpensesRestored() {
        return recurringExpensesRestored;
    }

    public void setRecurringExpensesRestored(int recurringExpensesRestored) {
        this.recurringExpensesRestored = recurringExpensesRestored;
    }

    public int getGoalsRestored() {
        return goalsRestored;
    }

    public void setGoalsRestored(int goalsRestored) {
        this.goalsRestored = goalsRestored;
    }

    public int getRulesRestored() {
        return rulesRestored;
    }

    public void setRulesRestored(int rulesRestored) {
        this.rulesRestored = rulesRestored;
    }

    public int getSkipped() {
        return skipped;
    }

    public void setSkipped(int skipped) {
        this.skipped = skipped;
    }
}
