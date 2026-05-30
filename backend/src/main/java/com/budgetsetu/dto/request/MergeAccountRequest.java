package com.budgetsetu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MergeAccountRequest {

    @NotNull(message = "Source account ID is required.")
    private UUID sourceAccountId;

    @NotNull(message = "Destination account ID is required.")
    private UUID destinationAccountId;

    @NotBlank(message = "Details source selection is required.")
    private String detailsSource; // "SOURCE", "DESTINATION", "CUSTOM"

    private String customName;
    private String customBankName;
    private String customAccountNumber;
    private String customAccountType;
    private String customCurrency;
    private BigDecimal customBalance;
}
