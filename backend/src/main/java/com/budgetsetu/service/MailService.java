package com.budgetsetu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    @Value("${app.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    public boolean isConfigured() {
        return resendApiKey != null && !resendApiKey.trim().isEmpty();
    }

    public boolean sendEmail(String to, String subject, String body) {
        if (!isConfigured()) {
            log.warn("Resend API key (RESEND_API_KEY) is not configured. Email to {} with subject '{}' was suppressed.", to, subject);
            return false;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String cleanApiKey = resendApiKey.replace("\"", "").replace("'", "").trim();
            headers.setBearerAuth(cleanApiKey);
            headers.set("User-Agent", "BudgetSetu/1.0 (Java/Spring Boot)");

            Map<String, Object> payload = new HashMap<>();
            payload.put("from", fromEmail);
            payload.put("to", Collections.singletonList(to));
            payload.put("subject", subject);
            payload.put("text", body);
            payload.put("html", "<div style=\"font-family: Arial, sans-serif; line-height: 1.6;\">" + 
                    body.replace("\n", "<br/>") + "</div>");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            String url = "https://api.resend.com/emails";

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully via Resend API to {} with subject: {}", to, subject);
                return true;
            } else {
                log.error("Failed to send email via Resend API to {} with subject: {}. Response: {}", to, subject, response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to send email via Resend API to {} with subject: {}", to, subject, e);
            return false;
        }
    }
}

