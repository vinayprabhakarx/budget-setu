package com.budgetsetu.model.mongo;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB document representing a submitted contact form.
 * Sensitive message contents are encrypted at rest using AES-256-GCM.
 */
@Document(collection = "contact_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactSubmission {

    @Id
    private String id;

    @Indexed
    private String email;

    private String fullName;

    private String topic;

    /**
     * Stored encrypted at rest (e.g., enc:v1:...) using AesUtil
     */
    private String message;

    private boolean read;

    @CreatedDate
    private Instant createdAt;
}
