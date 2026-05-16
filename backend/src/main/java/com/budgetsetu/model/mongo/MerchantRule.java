package com.budgetsetu.model.mongo;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Merchant-to-category mapping rule.
 * userId = null → system-wide rule applied to all users.
 * userId = set  → user-specific correction.
 */
@Document(collection = "merchant_rules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MerchantRule {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String merchantPattern;
    private String matchType;       // EXACT, CONTAINS, STARTS_WITH
    private String categoryId;
    private String purposeSuggestion;
    private String source;          // SYSTEM, USER

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
