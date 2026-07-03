package com.budgetsetu.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Value;
import com.budgetsetu.service.MailService;
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
    private MailService mailService;

    @Value("${app.admin.email:test.vinayprabhakar@gmail.com}")
    private String adminEmail;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> results = new LinkedHashMap<>();
        results.put("service", "budget-setu");
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

        // 2. Test MongoDB (MongoDB Atlas)
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

        // 4. Test Mail (Resend API configuration check without sending emails)
        try {
            if (mailService != null && mailService.isConfigured()) {
                results.put("mail", Map.of("status", "CONNECTED", "provider", "Resend API"));
            } else {
                results.put("mail", Map.of("status", "NOT_CONFIGURED", "provider", "Resend API"));
            }
        } catch (Exception e) {
            results.put("mail", Map.of("status", "FAILED", "provider", "Resend API", "error", e.getMessage()));
        }

        boolean allOk = results.values().stream()
                .filter(val -> val instanceof Map)
                .map(val -> (Map<?, ?>) val)
                .noneMatch(map -> "FAILED".equals(map.get("status")));

        results.put("status", allOk ? "UP" : "DEGRADED");
        results.put("overall_status", allOk ? "ALL_OK" : "DEGRADED");

        return ResponseEntity.ok(results);
    }
}

