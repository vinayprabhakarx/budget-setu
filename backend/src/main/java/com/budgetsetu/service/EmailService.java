package com.budgetsetu.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final MailService mailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.admin.email:}")
    private String adminEmail;

    public void sendVerificationEmail(String email, String token) {
        String magicLink = frontendUrl + "/magic-link?token=" + token;
        String subject = "Verify your BudgetSetu Email";
        String body = "Welcome to BudgetSetu!\n\n" +
                "Please verify your email address to activate your account by clicking the link below:\n" +
                magicLink + "\n\n" +
                "This link will expire in 5 minutes.\n\n" +
                "Best regards,\nThe BudgetSetu Team";

        mailService.sendEmail(email, subject, body);
    }

    public void sendPasswordResetEmail(String email, String token) {
        String magicLink = frontendUrl + "/reset-password/confirm?token=" + token;
        String subject = "Reset your BudgetSetu Password";
        String body = "Hello,\n\n" +
                "You requested a password reset for your BudgetSetu account. Please click the link below to get your verification code:\n"
                +
                magicLink + "\n\n" +
                "This link will expire in 10 minutes.\n\n" +
                "If you did not request a password reset, you can safely ignore this email.\n\n" +
                "Best regards,\nThe BudgetSetu Team";

        mailService.sendEmail(email, subject, body);
    }

    public void sendContactConfirmationEmail(String email, String fullName, String topic) {
        String subject = "We received your message - BudgetSetu";
        String body = "Hello " + fullName + ",\n\n" +
                "Thank you for reaching out to BudgetSetu! We have received your message regarding \"" + topic
                + "\".\n\n" +
                "Our team will review your inquiry and get back to you shortly at this email address.\n\n" +
                "Best regards,\nThe BudgetSetu Team";

        mailService.sendEmail(email, subject, body);
    }

    public void sendContactAdminNotification(String fullName, String email, String topic, String message) {
        if (adminEmail == null || adminEmail.trim().isEmpty()) {
            return;
        }
        String subject = "[Contact Form] New submission: " + topic + " from " + fullName;
        String body = "New contact form submission received on BudgetSetu:\n\n" +
                "Name: " + fullName + "\n" +
                "Email: " + email + "\n" +
                "Topic: " + topic + "\n\n" +
                "Message:\n" + message + "\n\n" +
                "--- BudgetSetu System ---";

        mailService.sendEmail(adminEmail, subject, body);
    }
}
