package com.budgetsetu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountRequest {

    @NotBlank(message = "Account name is required.")
    private String name;

    private String bankName;
    private String accountNumber;

    @NotBlank(message = "Account type is required.")
    private String accountType;

    private String currency;

    private java.math.BigDecimal manualBalance;
    private java.time.LocalDate manualBalanceDate;
}
