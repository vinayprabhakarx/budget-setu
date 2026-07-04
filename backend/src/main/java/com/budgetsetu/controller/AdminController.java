package com.budgetsetu.controller;

import com.budgetsetu.dto.response.AdminMetricsResponse;
import com.budgetsetu.dto.response.AdminUserDto;
import com.budgetsetu.model.mongo.AdminAuditLog;
import com.budgetsetu.model.mongo.MerchantRule;
import com.budgetsetu.repository.mongo.ContactSubmissionRepository;
import com.budgetsetu.repository.mongo.MerchantRuleRepository;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.security.AesUtil;
import com.budgetsetu.service.AdminService;
import com.budgetsetu.service.LogFileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final LogFileService logFileService;
    private final ContactSubmissionRepository contactSubmissionRepository;
    private final MerchantRuleRepository merchantRuleRepository;
    private final CategoryRepository categoryRepository;
    private final AesUtil aesUtil;

    @GetMapping("/metrics")
    public ResponseEntity<AdminMetricsResponse> getMetrics() {
        return ResponseEntity.ok(adminService.getPlatformMetrics());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserDto>> getUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getUsers(pageable));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> request,
            Principal principal) {
        String newRole = request.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // principal.getName() usually returns the subject (userId) in our JWT setup.
        // Wait, JwtAuthFilter sets principal to userId. But we need adminEmail for
        // auditing.
        // Actually, we can just pass the userId as the admin identifier for now.
        String adminIdStr = principal.getName();
        adminService.updateUserRole(userId, newRole.toUpperCase(), adminIdStr);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/toggle-suspend")
    public ResponseEntity<Void> toggleSuspend(
            @PathVariable UUID userId,
            Principal principal) {
        String adminIdStr = principal.getName();
        adminService.toggleUserSuspend(userId, adminIdStr);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID userId,
            Principal principal) {
        String adminIdStr = principal.getName();
        adminService.deleteUser(userId, adminIdStr);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAuditLogs(pageable));
    }

    @GetMapping("/logs/application")
    public ResponseEntity<List<String>> getApplicationLogs(@RequestParam(defaultValue = "100") int lines) {
        return ResponseEntity.ok(logFileService.getApplicationLogs(lines));
    }

    @GetMapping("/logs/error")
    public ResponseEntity<List<String>> getErrorLogs(@RequestParam(defaultValue = "100") int lines) {
        return ResponseEntity.ok(logFileService.getErrorLogs(lines));
    }

    @GetMapping("/logs/database")
    public ResponseEntity<List<Map<String, Object>>> getDatabaseLogs() {
        return ResponseEntity.ok(logFileService.getDatabaseActivity());
    }

    @GetMapping("/contact-submissions")
    public ResponseEntity<List<com.budgetsetu.model.mongo.ContactSubmission>> getContactSubmissions() {
        List<com.budgetsetu.model.mongo.ContactSubmission> submissions = contactSubmissionRepository
                .findAllByOrderByCreatedAtDesc();
        for (com.budgetsetu.model.mongo.ContactSubmission sub : submissions) {
            sub.setMessage(aesUtil.decrypt(sub.getMessage()));
        }
        return ResponseEntity.ok(submissions);
    }

    @PatchMapping("/contact-submissions/{id}/read")
    public ResponseEntity<Void> toggleReadStatus(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        contactSubmissionRepository.findById(id).ifPresent(sub -> {
            sub.setRead(body.getOrDefault("read", !sub.isRead()));
            contactSubmissionRepository.save(sub);
        });
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/contact-submissions/{id}")
    public ResponseEntity<Void> deleteContactSubmission(@PathVariable String id) {
        contactSubmissionRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // -----------------------------------------------------------------------
    // Admin – Merchant Rules CRUD
    // -----------------------------------------------------------------------

    @Data
    public static class AdminMerchantRuleRequest {
        @NotBlank
        private String merchantPattern;
        @NotBlank
        private String categoryId;
        private String matchType = "CONTAINS";
    }

    @GetMapping("/merchant-rules")
    public ResponseEntity<List<Map<String, Object>>> getSystemMerchantRules() {
        List<MerchantRule> rules = merchantRuleRepository.findByUserIdIsNull();
        List<Map<String, Object>> result = new ArrayList<>();
        for (MerchantRule rule : rules) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id", rule.getId());
            r.put("merchantPattern", rule.getMerchantPattern());
            r.put("matchType", rule.getMatchType());
            r.put("categoryId", rule.getCategoryId());
            r.put("source", rule.getSource());
            r.put("createdAt", rule.getCreatedAt());
            if (rule.getCategoryId() != null) {
                try {
                    categoryRepository.findById(UUID.fromString(rule.getCategoryId())).ifPresent(cat -> {
                        r.put("categoryName", cat.getName());
                        r.put("categoryIcon", cat.getIcon());
                        r.put("categoryColor", cat.getColor());
                        r.put("categoryType", cat.getType());
                    });
                } catch (Exception ignored) {
                }
            }
            result.add(r);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/merchant-rules")
    public ResponseEntity<MerchantRule> createSystemMerchantRule(@Valid @RequestBody AdminMerchantRuleRequest req) {
        String keyword = req.getMerchantPattern().trim().toLowerCase();
        if (merchantRuleRepository.findByMerchantPatternIgnoreCaseAndUserIdIsNull(keyword).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        MerchantRule rule = MerchantRule.builder()
                .userId(null)
                .merchantPattern(keyword)
                .matchType(req.getMatchType() != null ? req.getMatchType() : "CONTAINS")
                .categoryId(req.getCategoryId())
                .source("ADMIN")
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(merchantRuleRepository.save(rule));
    }

    @PutMapping("/merchant-rules/{id}")
    public ResponseEntity<MerchantRule> updateSystemMerchantRule(
            @PathVariable String id,
            @Valid @RequestBody AdminMerchantRuleRequest req) {
        return merchantRuleRepository.findById(id)
                .filter(r -> r.getUserId() == null)
                .map(rule -> {
                    rule.setMerchantPattern(req.getMerchantPattern().trim().toLowerCase());
                    rule.setCategoryId(req.getCategoryId());
                    if (req.getMatchType() != null)
                        rule.setMatchType(req.getMatchType());
                    return ResponseEntity.ok(merchantRuleRepository.save(rule));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/merchant-rules/{id}")
    public ResponseEntity<Void> deleteSystemMerchantRule(@PathVariable String id) {
        return merchantRuleRepository.findById(id)
                .filter(r -> r.getUserId() == null)
                .map(rule -> {
                    merchantRuleRepository.delete(rule);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
