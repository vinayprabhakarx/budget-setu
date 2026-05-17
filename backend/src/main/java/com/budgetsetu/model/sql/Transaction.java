package com.budgetsetu.model.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Central table — every financial event (expense, income, transfer, refund) is
 * one row.
 * <p>
 * {@code fingerprint} is the dedup hash: Date + Amount + Reference +
 * Description + Account.
 * {@code category_source} tells the UI whether the field
 * was auto-filled or set by the user.
 */
@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "category_id")
    private UUID categoryId;

    // ── Core financial fields ──────────────────────────────
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_type", nullable = false, length = 20)
    private String transactionType;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "payee")
    private String payee;

    // ── Classification fields ──────────────────────────────
    @Column(name = "payment_mode", length = 30)
    private String paymentMode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT[]")
    private String[] tags;

    // ── Import tracking fields ─────────────────────────────
    @Builder.Default
    @Column(length = 20)
    private String source = "MANUAL";

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "raw_description", columnDefinition = "TEXT")
    private String rawDescription;

    @Column(name = "category_source", length = 20)
    private String categorySource;

    @Column(name = "running_balance", precision = 15, scale = 2)
    private BigDecimal runningBalance;

    // ── Duplicate detection ────────────────────────────────
    @Column(unique = true, length = 512)
    private String fingerprint;

    // ── Soft delete ────────────────────────────────────────
    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
