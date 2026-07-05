package com.budgetsetu.model.mongo;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@Document(collection = "admin_audit_logs")
public class AdminAuditLog {
    @Id
    private String id;

    @Indexed
    private String adminEmail;

    @Indexed
    private String targetUserEmail;

    private String action; // e.g. "PROMOTED_TO_ADMIN", "SUSPENDED_USER", "DELETED_USER"
    private String details;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
