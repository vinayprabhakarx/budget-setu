package com.budgetsetu.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dashboard summary response — single API call returns all dashboard data.
 */
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DashboardResponse {

    private Summary summary;
    private List<CategoryBreakdown> categoryBreakdown;
    private List<MonthlyTrend> monthlyTrend;
    private List<BudgetStatus> budgetStatus;
    private List<TransactionResponse> recentTransactions;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class Summary {
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal netSavings;
        private BigDecimal netWorth;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CategoryBreakdown {
        private String categoryId;
        private String name;
        private String color;
        private BigDecimal amount;
        private double percentage;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class MonthlyTrend {
        private String month;
        private BigDecimal income;
        private BigDecimal expense;
    }

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class BudgetStatus {
        private String categoryName;
        private BigDecimal budgetAmount;
        private BigDecimal spentAmount;
        private double percentage;
    }
}
