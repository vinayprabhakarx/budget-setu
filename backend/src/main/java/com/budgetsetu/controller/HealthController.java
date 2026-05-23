package com.budgetsetu.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check and diagnostics endpoint — public, no auth required.
 */
@RestController
@RequestMapping("/api")
/**
 * REST Controller for application health monitoring.
 * Provides basic liveness checks and deep diagnostic checks across all integrated services (DB, Redis, Email).
 */
public class HealthController {

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "budgetsetu-backend",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/health/diagnostics")
    public ResponseEntity<Map<String, Object>> diagnostics(@RequestParam(value = "email", required = false) String emailToTest) {
        Map<String, Object> results = new LinkedHashMap<>();
        results.put("timestamp", Instant.now().toString());

        // 1. Test PostgreSQL (Supabase)
        try {
            if (jdbcTemplate != null) {
                Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                results.put("postgresql", Map.of("status", "CONNECTED", "test_query", one));
            } else {
                results.put("postgresql", Map.of("status", "NOT_CONFIGURED"));
            }
        } catch (Exception e) {
            results.put("postgresql", Map.of("status", "FAILED", "error", e.getMessage()));
        }

        // 2. Test MongoDB (Atlas)
        try {
            if (mongoTemplate != null) {
                org.bson.Document pingResult = mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
                results.put("mongodb", Map.of("status", "CONNECTED", "ping_response", pingResult.toJson()));
            } else {
                results.put("mongodb", Map.of("status", "NOT_CONFIGURED"));
            }
        } catch (Exception e) {
            results.put("mongodb", Map.of("status", "FAILED", "error", e.getMessage()));
        }

        // 3. Test Redis (Redis Cloud)
        try {
            if (redisTemplate != null) {
                String testKey = "budgetsetu:test:" + System.currentTimeMillis();
                redisTemplate.opsForValue().set(testKey, "working");
                String val = redisTemplate.opsForValue().get(testKey);
                redisTemplate.delete(testKey);
                results.put("redis", Map.of("status", "CONNECTED", "read_write_check", "working".equals(val) ? "OK" : "FAILED"));
            } else {
                results.put("redis", Map.of("status", "NOT_CONFIGURED"));
            }
        } catch (Exception e) {
            results.put("redis", Map.of("status", "FAILED", "error", e.getMessage()));
        }

        // 4. Test Mail (Mailgun SMTP)
        try {
            if (mailSender != null) {
                if (emailToTest != null && !emailToTest.trim().isEmpty()) {
                    SimpleMailMessage message = new SimpleMailMessage();
                    message.setFrom("no-reply@vinayprabhakar.dev");
                    message.setTo(emailToTest);
                    message.setSubject("BudgetSetu Connection Test");
                    message.setText("Congratulations! Your Mailgun SMTP email integration works perfectly with Spring Boot.");
                    mailSender.send(message);
                    results.put("mail", Map.of("status", "CONNECTED", "real_test_email_sent_to", emailToTest));
                } else {
                    // Just verify we can instantiate and ping configuration
                    results.put("mail", Map.of("status", "CONFIGURED", "note", "Provide 'email' query parameter to send a real test mail."));
                }
            } else {
                results.put("mail", Map.of("status", "NOT_CONFIGURED"));
            }
        } catch (Exception e) {
            results.put("mail", Map.of("status", "FAILED", "error", e.getMessage()));
        }

        boolean allOk = results.values().stream()
                .filter(val -> val instanceof Map)
                .map(val -> (Map<?, ?>) val)
                .noneMatch(map -> "FAILED".equals(map.get("status")));

        results.put("overall_status", allOk ? "ALL_OK" : "DEGRADED");

        return ResponseEntity.ok(results);
    }
}

