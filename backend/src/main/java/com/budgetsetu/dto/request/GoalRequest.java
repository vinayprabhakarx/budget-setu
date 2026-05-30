package com.budgetsetu.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GoalRequest {

    @NotBlank(message = "Goal name is required.")
    private String name;

    @NotNull(message = "Target amount is required.")
    @DecimalMin(value = "0.01", message = "Target amount must be greater than zero.")
    private BigDecimal targetAmount;

    private LocalDate targetDate;

    private String priority;

    private String description;
}
