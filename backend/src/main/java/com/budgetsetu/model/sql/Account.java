package com.budgetsetu.model.sql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A financial account tracked by the user (bank, credit card, UPI, cash).
 * Only the last 4 digits of account numbers are ever stored.
 */
@Entity
@Table(name = "accounts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "name"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "account_number", length = 50)
    private String accountNumber;

    @Column(name = "account_type", nullable = false, length = 50)
    private String accountType;

    @Builder.Default
    @Column(precision = 15, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "manual_balance", precision = 15, scale = 2)
    private BigDecimal manualBalance;

    @Column(name = "manual_balance_date")
    private java.time.LocalDate manualBalanceDate;

    @Builder.Default
    @Column(length = 10)
    private String currency = "INR";

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
