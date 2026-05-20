package com.budgetsetu.service;

import com.budgetsetu.dto.request.GoalContributionRequest;
import com.budgetsetu.dto.request.GoalRequest;
import com.budgetsetu.dto.response.GoalResponse;
import com.budgetsetu.exception.ResourceNotFoundException;
import com.budgetsetu.model.sql.Goal;
import com.budgetsetu.repository.sql.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;

    @Transactional
    public GoalResponse createGoal(UUID userId, GoalRequest request) {
        validateTargetDate(request.getTargetDate());

        Goal goal = Goal.builder()
                .userId(userId)
                .name(request.getName().trim())
                .targetAmount(request.getTargetAmount())
                .targetDate(request.getTargetDate())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .description(request.getDescription())
                .savedAmount(BigDecimal.ZERO)
                .status("ACTIVE")
                .build();

        return toResponse(goalRepository.save(goal));
    }

    public List<GoalResponse> getGoals(UUID userId) {
        return goalRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GoalResponse contribute(UUID userId, UUID id, GoalContributionRequest request) {
        Goal goal = getGoalForUser(userId, id);
        BigDecimal savedAmount = nullToZero(goal.getSavedAmount()).add(request.getAmount());
        goal.setSavedAmount(savedAmount);
        if (savedAmount.compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus("COMPLETED");
        }
        return toResponse(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse updateGoal(UUID userId, UUID id, GoalRequest request) {
        validateTargetDate(request.getTargetDate());

        Goal goal = getGoalForUser(userId, id);
        goal.setName(request.getName().trim());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setTargetDate(request.getTargetDate());
        goal.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        goal.setDescription(request.getDescription());
        goal.setStatus(nullToZero(goal.getSavedAmount()).compareTo(request.getTargetAmount()) >= 0
                ? "COMPLETED"
                : "ACTIVE");

        return toResponse(goalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(UUID userId, UUID id) {
        Goal goal = getGoalForUser(userId, id);
        goalRepository.delete(goal);
    }

    private Goal getGoalForUser(UUID userId, UUID id) {
        return goalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("This goal could not be found."));
    }

    private void validateTargetDate(LocalDate targetDate) {
        if (targetDate != null && targetDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Target date must be in the future.");
        }
    }

    private GoalResponse toResponse(Goal goal) {
        BigDecimal savedAmount = nullToZero(goal.getSavedAmount());
        double percentage = goal.getTargetAmount().compareTo(BigDecimal.ZERO) == 0
                ? 0
                : savedAmount.multiply(BigDecimal.valueOf(100))
                .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP)
                .min(BigDecimal.valueOf(100))
                .doubleValue();
        boolean completed = "COMPLETED".equalsIgnoreCase(goal.getStatus())
                || savedAmount.compareTo(goal.getTargetAmount()) >= 0;
        Long daysRemaining = goal.getTargetDate() == null
                ? null
                : ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate());

        return GoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(savedAmount)
                .targetDate(goal.getTargetDate())
                .completed(completed)
                .status(goal.getStatus())
                .percentageComplete(percentage)
                .daysRemaining(daysRemaining)
                .priority(goal.getPriority())
                .description(goal.getDescription())
                .build();
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
