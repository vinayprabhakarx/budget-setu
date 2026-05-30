package com.budgetsetu.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoalContributionRequest {

    @NotNull(message = "Contribution amount is required.")
    @DecimalMin(value = "0.01", message = "Contribution amount must be greater than zero.")
    private BigDecimal amount;
}
