package com.budgetsetu.service;

import com.budgetsetu.dto.request.RecurringExpenseRequest;
import com.budgetsetu.dto.response.RecurringExpenseResponse;
import com.budgetsetu.model.sql.Category;
import com.budgetsetu.model.sql.RecurringExpense;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.repository.sql.RecurringExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public RecurringExpenseResponse createRecurringExpense(UUID userId, RecurringExpenseRequest request) {
        RecurringExpense expense = new RecurringExpense();
        expense.setUserId(userId);
        expense.setCategoryId(request.getCategoryId());
        expense.setName(request.getName());
        expense.setAmount(request.getAmount());
        expense.setFrequency(request.getFrequency());
        expense.setStartDate(request.getStartDate());
        expense.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");
        expense.setPausedUntil(request.getPausedUntil());

        RecurringExpense saved = recurringExpenseRepository.save(expense);
        return toResponse(saved, getCategoryMap(userId));
    }

    @Transactional
    public RecurringExpenseResponse updateRecurringExpense(UUID userId, UUID expenseId,
            RecurringExpenseRequest request) {
        RecurringExpense expense = recurringExpenseRepository.findById(expenseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));

        expense.setCategoryId(request.getCategoryId());
        expense.setName(request.getName());
        expense.setAmount(request.getAmount());
        expense.setFrequency(request.getFrequency());
        expense.setStartDate(request.getStartDate());
        expense.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");
        expense.setPausedUntil(request.getPausedUntil());

        RecurringExpense saved = recurringExpenseRepository.save(expense);
        return toResponse(saved, getCategoryMap(userId));
    }

    public List<RecurringExpenseResponse> getRecurringExpenses(UUID userId) {
        Map<UUID, Category> categoryMap = getCategoryMap(userId);
        return recurringExpenseRepository.findByUserId(userId).stream()
                .map(e -> toResponse(e, categoryMap))
                .toList();
    }

    @Transactional
    public void deleteRecurringExpense(UUID userId, UUID expenseId) {
        RecurringExpense expense = recurringExpenseRepository.findById(expenseId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Recurring expense not found"));
        recurringExpenseRepository.delete(expense);
    }

    private Map<UUID, Category> getCategoryMap(UUID userId) {
        return categoryRepository.findAllForUser(userId).stream()
                .collect(Collectors.toMap(c -> c.getId(), c -> c, (left, right) -> left));
    }

    private RecurringExpenseResponse toResponse(RecurringExpense expense, Map<UUID, Category> categoryMap) {
        Category cat = expense.getCategoryId() != null ? categoryMap.get(expense.getCategoryId()) : null;
        return RecurringExpenseResponse.builder()
                .id(expense.getId().toString())
                .categoryId(expense.getCategoryId() != null ? expense.getCategoryId().toString() : null)
                .categoryName(cat != null ? cat.getName() : "Unknown")
                .categoryColor(cat != null ? cat.getColor() : null)
                .name(expense.getName())
                .amount(expense.getAmount())
                .frequency(expense.getFrequency())
                .startDate(expense.getStartDate())
                .status(expense.getStatus())
                .pausedUntil(expense.getPausedUntil())
                .nextDueDate(calculateNextDueDate(expense))
                .build();
    }

    private LocalDate calculateNextDueDate(RecurringExpense expense) {
        LocalDate now = LocalDate.now();
        LocalDate candidate = expense.getStartDate();
        if (candidate == null)
            return now;

        while (candidate.isBefore(now)) {
            if ("MONTHLY".equals(expense.getFrequency())) {
                candidate = clampToValidDate(candidate.plusMonths(1).getYear(), candidate.plusMonths(1).getMonthValue(),
                        expense.getStartDate().getDayOfMonth());
            } else if ("YEARLY".equals(expense.getFrequency())) {
                candidate = clampToValidDate(candidate.plusYears(1).getYear(), candidate.plusYears(1).getMonthValue(),
                        expense.getStartDate().getDayOfMonth());
            } else if ("QUARTERLY".equals(expense.getFrequency())) {
                candidate = clampToValidDate(candidate.plusMonths(3).getYear(), candidate.plusMonths(3).getMonthValue(),
                        expense.getStartDate().getDayOfMonth());
            } else {
                candidate = candidate.plusDays(7); // Default to weekly if missing
            }
        }
        return candidate;
    }

    private LocalDate clampToValidDate(int year, int month, int day) {
        int maxDays = YearMonth.of(year, month).lengthOfMonth();
        return LocalDate.of(year, month, Math.min(day, maxDays));
    }
}
