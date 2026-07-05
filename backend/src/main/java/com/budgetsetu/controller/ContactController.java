package com.budgetsetu.controller;

import com.budgetsetu.dto.request.ContactRequest;
import com.budgetsetu.model.mongo.ContactSubmission;
import com.budgetsetu.repository.mongo.ContactSubmissionRepository;
import com.budgetsetu.security.AesUtil;
import com.budgetsetu.service.EmailService;
import com.budgetsetu.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

/**
 * REST Controller for handling public contact form submissions.
 */
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Slf4j
public class ContactController {

    private final EmailService emailService;
    private final RateLimitService rateLimitService;
    private final ContactSubmissionRepository contactSubmissionRepository;
    private final AesUtil aesUtil;

    @PostMapping
    public ResponseEntity<Map<String, String>> submitContactForm(@Valid @RequestBody ContactRequest request,
            HttpServletRequest httpServletRequest) {
        String clientIp = getClientIp(httpServletRequest);
        String emailKey = "rate-limit:contact:email:" + request.getEmail().toLowerCase().trim();
        String ipKey = "rate-limit:contact:ip:" + clientIp;

        // Rate limit: max 3 submissions per email address per hour (3600s)
        rateLimitService.checkRateLimit(emailKey, 3, 3600);
        // Rate limit: max 5 submissions per IP address per hour (3600s)
        rateLimitService.checkRateLimit(ipKey, 5, 3600);

        log.info("Received contact form submission from {} ({}) regarding topic: {}",
                request.getFullName(), request.getEmail(), request.getTopic());

        // Save submission in MongoDB with message encrypted at rest
        try {
            ContactSubmission submission = ContactSubmission.builder()
                    .fullName(request.getFullName())
                    .email(request.getEmail())
                    .topic(request.getTopic())
                    .message(aesUtil.encrypt(request.getMessage()))
                    .read(false)
                    .createdAt(Instant.now())
                    .build();
            contactSubmissionRepository.save(submission);
        } catch (Exception e) {
            log.error("Failed to save contact submission to MongoDB: {}", e.getMessage(), e);
        }

        // Send confirmation email to user
        emailService.sendContactConfirmationEmail(request.getEmail(), request.getFullName(), request.getTopic());

        return ResponseEntity.ok(Map.of("message", "Message submitted successfully."));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
