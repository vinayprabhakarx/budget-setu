package com.budgetsetu.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Analytics API response — summary cards, income/expense trend, and category
 * breakdown.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {

    private SummaryCards summaryCards;
    private SummaryCards previousPeriodSummary;
    private List<TrendPoint> trend;
    private List<CategoryBreakdownItem> categoryBreakdown;
    private List<CategoryBreakdownItem> incomeCategoryBreakdown;
    private List<TopExpenseItem> topExpenses;
    private List<TopExpenseItem> topIncomes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryCards {
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal net;
        private BigDecimal savingsRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopExpenseItem {
        private String transactionId;
        private String description;
        private String payee;
        private String date;
        private BigDecimal amount;
        private String categoryName;
        private String categoryColor;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendPoint {
        private String period;
        private BigDecimal income;
        private BigDecimal expense;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryBreakdownItem {
        private String categoryId;
        private String name;
        private String color;
        private BigDecimal amount;
        private double percent;
    }
}
