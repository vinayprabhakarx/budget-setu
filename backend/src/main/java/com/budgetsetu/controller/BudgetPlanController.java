package com.budgetsetu.controller;

import com.budgetsetu.dto.request.BudgetPlanRequest;
import com.budgetsetu.dto.response.BudgetPlanResponse;
import com.budgetsetu.service.BudgetPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budget-plans")
@RequiredArgsConstructor
/**
 * REST Controller for managing active budget plans.
 * Provides endpoints to define, track, and update spending limits across different categories over specific time periods.
 */
public class BudgetPlanController {

    private final BudgetPlanService budgetPlanService;

    @PostMapping
    public ResponseEntity<BudgetPlanResponse> createBudgetPlan(Authentication authentication,
                                                               @Valid @RequestBody BudgetPlanRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(budgetPlanService.createBudgetPlan(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetPlanResponse> updateBudgetPlan(Authentication authentication,
                                                               @PathVariable UUID id,
                                                               @Valid @RequestBody BudgetPlanRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(budgetPlanService.updateBudgetPlan(userId, id, request));
    }

    @GetMapping
    public ResponseEntity<List<BudgetPlanResponse>> getBudgetPlans(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(budgetPlanService.getBudgetPlans(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudgetPlan(Authentication authentication, @PathVariable UUID id) {
        UUID userId = UUID.fromString(authentication.getName());
        budgetPlanService.deleteBudgetPlan(userId, id);
        return ResponseEntity.noContent().build();
    }
}
