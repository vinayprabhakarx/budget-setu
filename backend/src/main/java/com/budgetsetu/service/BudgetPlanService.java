package com.budgetsetu.service;

import com.budgetsetu.dto.request.BudgetPlanRequest;
import com.budgetsetu.dto.response.BudgetPlanResponse;
import com.budgetsetu.model.sql.BudgetAllocation;
import com.budgetsetu.model.sql.BudgetPlan;
import com.budgetsetu.model.sql.Category;
import com.budgetsetu.repository.sql.BudgetPlanRepository;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.type.TypeReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.concurrent.TimeUnit;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetPlanService {

    private final BudgetPlanRepository budgetPlanRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final long CACHE_TTL_MINUTES = 5;
    private static final String CACHE_PREFIX = "budgetplan:";

    @Transactional
    public BudgetPlanResponse createBudgetPlan(UUID userId, BudgetPlanRequest request) {
        BudgetPlan plan = new BudgetPlan();
        plan.setUserId(userId);
        plan.setName(request.getName());
        plan.setPeriodType(request.getPeriodType());
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());
        plan.setTotalAmount(request.getTotalAmount());

        if (request.getAllocations() != null) {
            for (BudgetPlanRequest.BudgetAllocationRequest allocReq : request.getAllocations()) {
                BudgetAllocation alloc = new BudgetAllocation();
                alloc.setCategoryId(allocReq.getCategoryId());
                alloc.setAmount(allocReq.getAmount());
                plan.addAllocation(alloc);
            }

            BigDecimal allocationTotal = plan.getAllocations().stream()
                    .map(a -> a.getAmount())
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
            if (allocationTotal.compareTo(plan.getTotalAmount()) > 0) {
                throw new RuntimeException("Allocations exceed total budget amount.");
            }
        }

        BudgetPlan saved = budgetPlanRepository.save(plan);
        evictBudgetCache(userId);
        return toResponse(saved, getCategoryMap(userId));
    }

    @Transactional
    public BudgetPlanResponse updateBudgetPlan(UUID userId, UUID planId, BudgetPlanRequest request) {
        BudgetPlan plan = budgetPlanRepository.findById(planId)
                .filter(p -> p.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Budget plan not found"));

        plan.setName(request.getName());
        plan.setPeriodType(request.getPeriodType());
        plan.setStartDate(request.getStartDate());
        plan.setEndDate(request.getEndDate());
        plan.setTotalAmount(request.getTotalAmount());

        if (request.getAllocations() == null) {
            plan.getAllocations().clear();
        } else {
            List<UUID> requestedCategoryIds = request.getAllocations().stream()
                    .map(req -> req.getCategoryId())
                    .toList();

            plan.getAllocations().removeIf(a -> !requestedCategoryIds.contains(a.getCategoryId()));

            for (BudgetPlanRequest.BudgetAllocationRequest allocReq : request.getAllocations()) {
                BudgetAllocation existingAlloc = plan.getAllocations().stream()
                        .filter(a -> a.getCategoryId().equals(allocReq.getCategoryId()))
                        .findFirst()
                        .orElse(null);

                if (existingAlloc != null) {
                    existingAlloc.setAmount(allocReq.getAmount());
                } else {
                    BudgetAllocation alloc = new BudgetAllocation();
                    alloc.setCategoryId(allocReq.getCategoryId());
                    alloc.setAmount(allocReq.getAmount());
                    plan.addAllocation(alloc);
                }
            }

            BigDecimal allocationTotal = plan.getAllocations().stream()
                    .map(a -> a.getAmount())
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
            if (allocationTotal.compareTo(plan.getTotalAmount()) > 0) {
                throw new RuntimeException("Allocations exceed total budget amount.");
            }
        }

        BudgetPlan saved = budgetPlanRepository.save(plan);
        evictBudgetCache(userId);
        return toResponse(saved, getCategoryMap(userId));
    }

    @Transactional(readOnly = true)
    public List<BudgetPlanResponse> getBudgetPlans(UUID userId) {
        String cacheKey = CACHE_PREFIX + userId;
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return objectMapper.readValue(cached, new TypeReference<List<BudgetPlanResponse>>() {});
            }
        } catch (Exception e) {
            log.warn("Failed to read budget cache for key {}: {}", cacheKey, e.getMessage());
        }

        Map<UUID, Category> categoryMap = getCategoryMap(userId);
        List<BudgetPlanResponse> response = budgetPlanRepository.findByUserId(userId).stream()
                .map(plan -> toResponse(plan, categoryMap))
                .toList();

        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to write budget cache for key {}: {}", cacheKey, e.getMessage());
        }

        return response;
    }

    @Transactional
    public void deleteBudgetPlan(UUID userId, UUID planId) {
        BudgetPlan plan = budgetPlanRepository.findById(planId)
                .filter(p -> p.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Budget plan not found"));
        budgetPlanRepository.delete(plan);
        evictBudgetCache(userId);
    }

    public void evictBudgetCache(UUID userId) {
        try {
            String cacheKey = CACHE_PREFIX + userId;
            Boolean deleted = redisTemplate.delete(cacheKey);
            if (Boolean.TRUE.equals(deleted)) {
                log.debug("Evicted budget cache for user {}", userId);
            }
        } catch (Exception e) {
            log.warn("Failed to evict budget cache for user {}: {}", userId, e.getMessage());
        }
    }

    private Map<UUID, Category> getCategoryMap(UUID userId) {
        return categoryRepository.findAllForUser(userId).stream()
                .collect(Collectors.toMap(c -> c.getId(), c -> c, (left, right) -> left));
    }

    private BudgetPlanResponse toResponse(BudgetPlan plan, Map<UUID, Category> categoryMap) {
        List<BudgetPlanResponse.BudgetAllocationResponse> allocations = plan.getAllocations().stream()
                .map(alloc -> {
                    Category cat = categoryMap.get(alloc.getCategoryId());
                    BigDecimal spent = transactionRepository.sumAmountByCategoryTypeAndDateRange(
                            plan.getUserId(), alloc.getCategoryId(), "EXPENSE", plan.getStartDate(), plan.getEndDate());
                    if (spent == null)
                        spent = BigDecimal.ZERO;

                    return BudgetPlanResponse.BudgetAllocationResponse.builder()
                            .id(alloc.getId().toString())
                            .categoryId(alloc.getCategoryId().toString())
                            .categoryName(cat != null ? cat.getName() : "Unknown")
                            .categoryColor(cat != null ? cat.getColor() : null)
                            .amount(alloc.getAmount())
                            .spent(spent)
                            .build();
                }).toList();

        BigDecimal planTotalSpent = transactionRepository.sumAmountByTypeAndDateRange(
                plan.getUserId(), "EXPENSE", plan.getStartDate(), plan.getEndDate());
        if (planTotalSpent == null)
            planTotalSpent = BigDecimal.ZERO;

        return BudgetPlanResponse.builder()
                .id(plan.getId().toString())
                .name(plan.getName())
                .periodType(plan.getPeriodType())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .totalAmount(plan.getTotalAmount())
                .totalSpent(planTotalSpent)
                .allocations(allocations)
                .build();
    }
}
