package com.budgetsetu.model.mongo;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Detailed event log for every import operation.
 * One document per import — the events array holds one entry per parsed row.
 */
@Document(collection = "import_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ImportLog {

    @Id
    private String id;

    @Indexed
    private String importId;

    @Indexed
    private String userId;

    private List<ImportEvent> events;

    @CreatedDate
    private Instant createdAt;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ImportEvent {
        private Instant timestamp;
        private String type;        // PARSED, SKIPPED, IMPORTED, ERROR
        private String rawRow;
        private String fingerprint;
        private String reason;      // DUPLICATE, INVALID_DATE, MISSING_AMOUNT
    }
}
