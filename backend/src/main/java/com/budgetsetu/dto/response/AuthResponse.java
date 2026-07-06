package com.budgetsetu.dto.response;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String userId;
    private String email;
    private String fullName;
    private java.time.LocalDateTime createdAt;
    private String accessToken;
    private String role;
    private boolean hasLocalPassword;
    private String avatarUrl;
    @JsonProperty("isGoogleLinked")
    private boolean isGoogleLinked;
}
