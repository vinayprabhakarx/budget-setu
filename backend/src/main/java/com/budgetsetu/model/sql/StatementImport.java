package com.budgetsetu.model.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tracks every statement file uploaded by a user.
 */
@Entity
@Table(name = "statement_imports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatementImport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(length = 100)
    private String source;

    @Column(name = "bank_key", length = 50)
    private String bankKey;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Builder.Default
    @Column(length = 20)
    private String status = "PENDING";

    @Builder.Default
    @Column(name = "total_found")
    private Integer totalFound = 0;

    @Builder.Default
    @Column(name = "new_imported")
    private Integer newImported = 0;

    @Builder.Default
    private Integer duplicates = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
