package com.budgetsetu.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

import java.util.UUID;
import java.time.LocalDate;

@Data
public class RecurringExpenseRequest {

    private UUID categoryId;

    @NotBlank(message = "Name is required.")
    private String name;

    @NotNull(message = "Amount is required.")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero.")
    private BigDecimal amount;

    @NotBlank(message = "Frequency is required.")
    private String frequency;

    @NotNull(message = "Start date is required.")
    private LocalDate startDate;

    @NotBlank(message = "Status is required.")
    private String status;

    private LocalDate pausedUntil;
}
