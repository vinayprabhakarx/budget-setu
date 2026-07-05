package com.budgetsetu.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

/**
 * Standard API error response — matches the format in the security doc.
 * Every error uses this structure for consistency.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private int status;
    private String error;
    private String message;
    private String field;
    private Instant timestamp;
    private String requestId;
}
