package com.budgetsetu.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class BudgetPlanRequest {

    @NotBlank(message = "Name is required.")
    private String name;

    @NotBlank(message = "Period type is required.")
    private String periodType;

    @NotNull(message = "Start date is required.")
    private LocalDate startDate;

    @NotNull(message = "End date is required.")
    private LocalDate endDate;

    @NotNull(message = "Total amount is required.")
    @DecimalMin(value = "0.01", message = "Total amount must be greater than zero.")
    private BigDecimal totalAmount;

    @Valid
    private List<BudgetAllocationRequest> allocations;

    @Data
    public static class BudgetAllocationRequest {
        @NotNull(message = "Category ID is required.")
        private UUID categoryId;

        @NotNull(message = "Amount is required.")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero.")
        private BigDecimal amount;
    }
}
