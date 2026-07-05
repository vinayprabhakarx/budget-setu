package com.budgetsetu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountRequest {
    private String accountHolderName;

    private String bankName;
    private String accountNumber;

    @NotBlank(message = "Account Type is required")
    private String accountType;

    private java.math.BigDecimal manualBalance;
    private java.time.LocalDate manualBalanceDate;
}
