package com.budgetsetu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String userId;
    private String email;
    private String fullName;
    private java.time.LocalDateTime createdAt;
    private boolean emailVerified;
    private String role;
}
