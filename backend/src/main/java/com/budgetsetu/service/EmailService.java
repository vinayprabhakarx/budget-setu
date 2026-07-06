package com.budgetsetu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
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
        
        log.info("---------- DEV MODE: EMAIL VERIFICATION ----------");
        log.info("To: {}", email);
        log.info("Magic Link: {}", magicLink);
        log.info("--------------------------------------------------");

        String plainTextBody = "Welcome to BudgetSetu!\n\n" +
                "Please verify your email address to activate your account by clicking the link below:\n" +
                magicLink + "\n\n" +
                "This link will expire in 5 minutes.\n\n" +
                "Best regards,\nThe BudgetSetu Team";

        String htmlBody = com.budgetsetu.email.EmailTemplateBuilder.buildActionEmail(
                subject,
                "Welcome to BudgetSetu! 👋",
                "We're excited to have you on board. To get started and activate your account, please verify your email address by clicking the button below.\n\nThis link will automatically expire in 5 minutes for your security.",
                "Verify My Email",
                magicLink,
                "You received this email because you registered for a BudgetSetu account."
        );

        mailService.sendEmail(email, subject, plainTextBody, htmlBody);
    }

    public void sendPasswordResetEmail(String email, String token) {
        String magicLink = frontendUrl + "/reset-password/confirm?token=" + token;
        String subject = "Reset your BudgetSetu Password";
        
        log.info("---------- DEV MODE: PASSWORD RESET ----------");
        log.info("To: {}", email);
        log.info("Magic Link: {}", magicLink);
        log.info("----------------------------------------------");

        String plainTextBody = "Hello,\n\n" +
                "You requested a password reset for your BudgetSetu account. Please click the link below to get your verification code:\n" +
                magicLink + "\n\n" +
                "This link will expire in 10 minutes.\n\n" +
                "If you did not request a password reset, you can safely ignore this email.\n\n" +
                "Best regards,\nThe BudgetSetu Team";

        String htmlBody = com.budgetsetu.email.EmailTemplateBuilder.buildActionEmail(
                subject,
                "Password Reset Request",
                "We received a request to reset the password for your BudgetSetu account. You can securely reset your password by clicking the button below.\n\nThis secure link will expire in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.",
                "Reset Password",
                magicLink,
                "You received this email because a password reset was requested for your account."
        );

        mailService.sendEmail(email, subject, plainTextBody, htmlBody);
    }

    public void sendContactConfirmationEmail(String email, String fullName, String topic) {
        String contactEmail = (adminEmail == null || adminEmail.trim().isEmpty()) ? "" : adminEmail.trim();
        String subject = "We received your message - BudgetSetu";
        
        String plainTextBody = "Hello " + fullName + ",\n\n" +
                "Thank you for reaching out to BudgetSetu! We have received your message regarding \"" + topic + "\".\n\n" +
                (contactEmail.isEmpty() ? "Our team will review your inquiry and get back to you shortly.\n\n"
                        : "If you need to follow up, you can reply directly to this email or contact us at " + contactEmail + ".\n\n") +
                "Best regards,\nThe BudgetSetu Team";

        String htmlBody = com.budgetsetu.email.EmailTemplateBuilder.buildActionEmail(
                subject,
                "Thanks for reaching out!",
                "Hello " + fullName + ",\n\nWe have successfully received your message regarding <strong>\"" + topic + "\"</strong>. Our team is reviewing your inquiry and will get back to you as soon as possible." + 
                (!contactEmail.isEmpty() ? "\n\nIf you need to follow up, you can simply reply directly to this email." : ""),
                null,
                null,
                "You received this email because you contacted BudgetSetu support."
        );

        mailService.sendEmail(email, subject, plainTextBody, htmlBody);
    }

    public void sendContactAdminNotification(String fullName, String email, String topic, String message) {
        if (adminEmail == null || adminEmail.trim().isEmpty()) {
            return;
        }
        String subject = "[Contact Form] New submission: " + topic + " from " + fullName;
        
        String plainTextBody = "New contact form submission received on BudgetSetu:\n\n" +
                "Name: " + fullName + "\n" +
                "Email: " + email + "\n" +
                "Topic: " + topic + "\n\n" +
                "Message:\n" + message + "\n\n" +
                "--- BudgetSetu System ---";

        String htmlBody = com.budgetsetu.email.EmailTemplateBuilder.buildActionEmail(
                subject,
                "New Support Inquiry",
                "A new message was submitted via the contact form.\n\n<strong>Name:</strong> " + fullName + "\n<strong>Email:</strong> " + email + "\n<strong>Topic:</strong> " + topic + "\n\n<strong>Message:</strong>\n<div style=\"background-color:#F3F4F6;padding:15px;border-radius:6px;margin-top:10px;\">" + message.replace("\n", "<br/>") + "</div>",
                "Reply to User",
                "mailto:" + email + "?subject=Re: " + topic,
                "This is an automated administrative notification from BudgetSetu."
        );

        mailService.sendEmail(adminEmail, subject, plainTextBody, htmlBody);
    }
}
