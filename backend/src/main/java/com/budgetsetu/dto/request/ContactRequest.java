package com.budgetsetu.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ContactRequest {

    @NotBlank(message = "Name is required.")
    private String fullName;

    @NotBlank(message = "Email is required.")
    @Email(message = "Please provide a valid email address.")
    private String email;

    @NotBlank(message = "Topic is required.")
    private String topic;

    @NotBlank(message = "Message is required.")
    private String message;
}
