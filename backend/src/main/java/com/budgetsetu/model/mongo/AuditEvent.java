package com.budgetsetu.model.mongo;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Append-only audit trail for every data modification.
 * Records are never deleted or modified.
 */
@Document(collection = "audit_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditEvent {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String entityType; // TRANSACTION, BUDGET, GOAL, ACCOUNT
    private String entityId;
    private String action; // CREATE, UPDATE, DELETE
    private String fieldChanged;
    private String oldValue;
    private String newValue;
    private String source; // USER, SYSTEM

    @Builder.Default
    private Instant timestamp = Instant.now();
}
