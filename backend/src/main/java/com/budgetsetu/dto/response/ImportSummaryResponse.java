package com.budgetsetu.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportSummaryResponse {

    private String importId;
    private String status;
    private String fileName;
    private String sourceName;
    private int totalFound;
    private int newImported;
    private int duplicatesSkipped;
    private int failedRows;
    private int progress;
    private String message;
    private Instant completedAt;
}
