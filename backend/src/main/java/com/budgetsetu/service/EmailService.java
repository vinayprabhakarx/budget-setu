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
                "You requested a password reset for your BudgetSetu account. Please click the link below to get your verification code:\n" +
                magicLink + "\n\n" +
                "This link will expire in 10 minutes.\n\n" +
                "If you did not request a password reset, you can safely ignore this email.\n\n" +
                "Best regards,\nThe BudgetSetu Team";

        mailService.sendEmail(email, subject, body);
    }
}
