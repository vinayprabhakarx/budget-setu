package com.budgetsetu.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class BudgetPlanResponse {
    private String id;
    private String name;
    private String periodType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalAmount;
    private BigDecimal totalSpent;
    private List<BudgetAllocationResponse> allocations;

    @Data
    @Builder
    public static class BudgetAllocationResponse {
        private String id;
        private String categoryId;
        private String categoryName;
        private String categoryColor;
        private BigDecimal amount;
        private BigDecimal spent;
    }
}
