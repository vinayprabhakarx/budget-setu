package com.budgetsetu.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRequest {

    @NotNull(message = "Account is required.")
    private UUID accountId;

    private UUID categoryId;

    @NotNull(message = "Amount is required.")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero.")
    private BigDecimal amount;

    @NotBlank(message = "Transaction type is required.")
    private String transactionType;

    @NotNull(message = "Transaction date is required.")
    private LocalDate transactionDate;

    private String payee;
    private String paymentMode;
    private String description;
    private String referenceNumber;
}
