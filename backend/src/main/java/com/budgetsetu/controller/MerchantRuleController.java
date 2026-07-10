package com.budgetsetu.controller;

import com.budgetsetu.model.mongo.MerchantRule;
import com.budgetsetu.repository.mongo.MerchantRuleRepository;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import com.budgetsetu.model.sql.Transaction;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST Controller for Merchant Rules.
 *
 * User endpoints → /api/merchant-rules
 * Admin endpoints → /api/admin/merchant-rules (in AdminController)
 */
@RestController
@RequestMapping("/api/merchant-rules")
@RequiredArgsConstructor
@Slf4j
public class MerchantRuleController {

    private final MerchantRuleRepository merchantRuleRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    // -----------------------------------------------------------------------
    // DTOs
    // -----------------------------------------------------------------------

    @Data
    public static class MerchantRuleRequest {
        @NotBlank
        @jakarta.validation.constraints.Size(max = 255)
        private String merchantPattern;
        @NotBlank
        private String categoryId;
        private String matchType = "CONTAINS";
    }

    @Data
    public static class RecategorizeRequest {
        @NotBlank
        @jakarta.validation.constraints.Size(max = 255)
        private String merchantPattern;
        @NotBlank
        private String categoryId;
        /** true = also change categorySource to USER */
        private boolean updateSource = true;
    }

    // -----------------------------------------------------------------------
    // GET all rules visible to the user (system + personal)
    // -----------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMerchantRules(
            @AuthenticationPrincipal UUID userId) {
        List<MerchantRule> rules = merchantRuleRepository.findByUserIdIsNullOrUserId(userId.toString());
        return ResponseEntity.ok(enrichRules(rules));
    }

    // -----------------------------------------------------------------------
    // POST – create user-specific rule
    // -----------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<MerchantRule> createUserRule(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody MerchantRuleRequest req) {

        String keyword = req.getMerchantPattern().trim().toLowerCase();

        // Prevent duplicate for this user
        if (merchantRuleRepository.findByMerchantPatternIgnoreCaseAndUserId(keyword, userId.toString()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        MerchantRule rule = MerchantRule.builder()
                .userId(userId.toString())
                .merchantPattern(keyword)
                .matchType(req.getMatchType() != null ? req.getMatchType() : "CONTAINS")
                .categoryId(req.getCategoryId())
                .source("USER")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(merchantRuleRepository.save(rule));
    }

    // -----------------------------------------------------------------------
    // PUT – update a user's own rule
    // -----------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<MerchantRule> updateUserRule(
            @AuthenticationPrincipal UUID userId,
            @PathVariable String id,
            @Valid @RequestBody MerchantRuleRequest req) {

        return merchantRuleRepository.findById(id)
                .filter(r -> userId.toString().equals(r.getUserId()))
                .map(rule -> {
                    rule.setMerchantPattern(req.getMerchantPattern().trim().toLowerCase());
                    rule.setCategoryId(req.getCategoryId());
                    if (req.getMatchType() != null)
                        rule.setMatchType(req.getMatchType());
                    return ResponseEntity.ok(merchantRuleRepository.save(rule));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -----------------------------------------------------------------------
    // DELETE – user deletes their own rule
    // -----------------------------------------------------------------------

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserRule(
            @AuthenticationPrincipal UUID userId,
            @PathVariable String id) {

        return merchantRuleRepository.findById(id)
                .filter(r -> userId.toString().equals(r.getUserId()))
                .map(rule -> {
                    merchantRuleRepository.delete(rule);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -----------------------------------------------------------------------
    // POST /{id}/contribute – promote user rule to system-wide
    // -----------------------------------------------------------------------

    @PostMapping("/{id}/contribute")
    public ResponseEntity<MerchantRule> contributeGlobally(
            @AuthenticationPrincipal UUID userId,
            @PathVariable String id) {

        return merchantRuleRepository.findById(id)
                .filter(r -> userId.toString().equals(r.getUserId()))
                .map(rule -> {
                    // Check not already a system rule with same pattern
                    Optional<MerchantRule> existing = merchantRuleRepository
                            .findByMerchantPatternIgnoreCaseAndUserIdIsNull(rule.getMerchantPattern());
                    if (existing.isPresent()) {
                        // Update existing system rule's category
                        MerchantRule sys = existing.get();
                        sys.setCategoryId(rule.getCategoryId());
                        merchantRuleRepository.save(sys);
                    } else {
                        // Create new system rule
                        MerchantRule sysRule = MerchantRule.builder()
                                .userId(null)
                                .merchantPattern(rule.getMerchantPattern())
                                .matchType(rule.getMatchType())
                                .categoryId(rule.getCategoryId())
                                .source("USER_CONTRIBUTED")
                                .build();
                        merchantRuleRepository.save(sysRule);
                    }
                    // Keep user rule for reference
                    return ResponseEntity.ok(rule);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // -----------------------------------------------------------------------
    // POST /recategorize – re-categorize matching transactions for this user
    // -----------------------------------------------------------------------

    @PostMapping("/recategorize")
    public ResponseEntity<Map<String, Object>> recategorize(
            @AuthenticationPrincipal UUID userId,
            @RequestBody RecategorizeRequest req) {

        String pattern = req.getMerchantPattern().trim().toLowerCase();
        UUID categoryId;
        try {
            categoryId = UUID.fromString(req.getCategoryId());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid categoryId"));
        }

        // Verify category exists and is visible to this user
        boolean categoryExists = categoryRepository.findAllForUser(userId).stream()
                .anyMatch(c -> c.getId().equals(categoryId));
        if (!categoryExists) {
            return ResponseEntity.badRequest().body(Map.of("error", "Category not found"));
        }

        List<Transaction> matching = transactionRepository.findAllByUserIdAndIsDeletedFalse(userId).stream()
                .filter(t -> {
                    if (t.getPayee() != null && t.getPayee().toLowerCase(Locale.ROOT).contains(pattern))
                        return true;
                    if (t.getDescription() != null && t.getDescription().toLowerCase(Locale.ROOT).contains(pattern))
                        return true;
                    if (t.getReferenceNumber() != null
                            && t.getReferenceNumber().toLowerCase(Locale.ROOT).contains(pattern))
                        return true;
                    if (t.getPaymentMode() != null && t.getPaymentMode().toLowerCase(Locale.ROOT).contains(pattern))
                        return true;
                    if (t.getRawDescription() != null
                            && t.getRawDescription().toLowerCase(Locale.ROOT).contains(pattern))
                        return true;
                    return false;
                })
                .toList();

        int updated = 0;
        for (Transaction t : matching) {
            t.setCategoryId(categoryId);
            if (req.isUpdateSource()) {
                t.setCategorySource("USER");
            }
            transactionRepository.save(t);
            updated++;
        }

        log.info("MerchantRuleController: recategorize '{}' → updated {} transactions for user {}", pattern, updated,
                userId);
        return ResponseEntity.ok(Map.of("updated", updated, "pattern", pattern));
    }

    // -----------------------------------------------------------------------
    // Helper – enrich rules with category name/icon/color
    // -----------------------------------------------------------------------

    private List<Map<String, Object>> enrichRules(List<MerchantRule> rules) {
        Map<String, Map<String, Object>> categoryCache = new HashMap<>();
        List<Map<String, Object>> result = new ArrayList<>();

        for (MerchantRule rule : rules) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id", rule.getId());
            r.put("userId", rule.getUserId());
            r.put("merchantPattern", rule.getMerchantPattern());
            r.put("matchType", rule.getMatchType());
            r.put("categoryId", rule.getCategoryId());
            r.put("source", rule.getSource());
            r.put("isSystem", rule.getUserId() == null);
            r.put("createdAt", rule.getCreatedAt());

            if (rule.getCategoryId() != null) {
                Map<String, Object> catInfo = categoryCache.computeIfAbsent(rule.getCategoryId(), cid -> {
                    Map<String, Object> ci = new HashMap<>();
                    try {
                        categoryRepository.findById(UUID.fromString(cid)).ifPresent(cat -> {
                            ci.put("categoryName", cat.getName());
                            ci.put("categoryIcon", cat.getIcon());
                            ci.put("categoryColor", cat.getColor());
                            ci.put("categoryType", cat.getType());
                        });
                    } catch (Exception ignored) {
                    }
                    return ci;
                });
                r.putAll(catInfo);
            }

            result.add(r);
        }
        return result;
    }
}
