package com.budgetsetu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mailgun.api-key}")
    private String apiKey;

    @Value("${app.mailgun.domain}")
    private String domain;

    @Value("${app.mailgun.from-email}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        if (apiKey == null || apiKey.trim().isEmpty() || domain == null || domain.trim().isEmpty()) {
            log.warn("Mailgun API key or domain is not configured. Falling back to SMTP.");
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                log.info("Email sent successfully via SMTP to {} with subject: {}", to, subject);
            } catch (Exception e) {
                log.error("Failed to send email via SMTP to {} with subject: {}", to, subject, e);
            }
            return;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth("api", apiKey);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("from", fromEmail);
            map.add("to", to);
            map.add("subject", subject);
            map.add("text", body);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            String url = "https://api.mailgun.net/v3/" + domain + "/messages";

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully via Mailgun API to {} with subject: {}", to, subject);
            } else {
                log.error("Failed to send email via Mailgun API to {} with subject: {}. Response: {}", to, subject, response.getBody());
            }
        } catch (Exception e) {
            log.error("Failed to send email via Mailgun API to {} with subject: {}", to, subject, e);
        }
    }
}
