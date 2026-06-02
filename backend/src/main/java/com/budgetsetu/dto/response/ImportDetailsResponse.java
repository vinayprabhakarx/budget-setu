package com.budgetsetu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportDetailsResponse {

    private List<TransactionDetail> imported;
    private List<SkippedDetail> skipped;
    private List<FailedDetail> failed;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TransactionDetail {
        private String transactionId;
        private String date;
        private String amount;
        private String type;
        private String payee;
        private String description;
        private String rawRow;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SkippedDetail {
        private String reason;
        private String rawRow;
        private TransactionDetail collidedWith;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class FailedDetail {
        private String reason;
        private String rawRow;
    }
}
