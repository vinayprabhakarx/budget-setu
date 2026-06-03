package com.budgetsetu.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
@Data
@Builder
public class RecurringExpenseResponse {
    private String id;
    private String categoryId;
    private String categoryName;
    private String categoryColor;
    private String name;
    private BigDecimal amount;
    private String frequency;
    private LocalDate startDate;
    private String status;
    private LocalDate pausedUntil;
    private LocalDate nextDueDate;
}
