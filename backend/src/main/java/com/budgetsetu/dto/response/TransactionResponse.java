package com.budgetsetu.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private String id;
    private String payee;
    private BigDecimal amount;
    private String transactionType;
    private LocalDate transactionDate;
    private CategoryInfo category;
    private String paymentMode;
    private String description;
    private List<String> tags;
    private String source;
    private String accountId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryInfo {
        private String id;
        private String name;
        private String color;
    }
}
