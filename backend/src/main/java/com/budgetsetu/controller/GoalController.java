package com.budgetsetu.controller;

import com.budgetsetu.dto.request.GoalContributionRequest;
import com.budgetsetu.dto.request.GoalRequest;
import com.budgetsetu.dto.response.GoalResponse;
import com.budgetsetu.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
/**
 * REST Controller for savings goals.
 * Allows users to create savings targets, track progress, and contribute funds
 * over time.
 */
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getGoals(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(goalService.getGoals(userId));
    }

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(@AuthenticationPrincipal UUID userId,
            @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(goalService.createGoal(userId, request));
    }

    @PostMapping("/{id}/contribute")
    public ResponseEntity<GoalResponse> contribute(@AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody GoalContributionRequest request) {
        return ResponseEntity.ok(goalService.contribute(userId, id, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(@AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        goalService.deleteGoal(userId, id);
        return ResponseEntity.noContent().build();
    }
}
