package com.budgetsetu.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Full name is required.")
    @Size(max = 25, message = "Full name cannot exceed 25 characters.")
    private String fullName;

    @NotBlank(message = "Email is required.")
    @Email(message = "Please provide a valid email address.")
    @Size(max = 50, message = "Email cannot exceed 50 characters.")
    private String email;

    @NotBlank(message = "Password is required.")
    @Size(min = 8, max = 25, message = "Password must be between 8 and 25 characters.")
    @jakarta.validation.constraints.Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>\\-_]).{8,25}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    private String password;
}
