package com.budgetsetu.service;

import com.budgetsetu.dto.response.DashboardResponse;
import com.budgetsetu.dto.response.TransactionResponse;
import com.budgetsetu.model.sql.BudgetAllocation;
import com.budgetsetu.model.sql.BudgetPlan;
import com.budgetsetu.model.sql.Category;
import com.budgetsetu.model.sql.Transaction;
import com.budgetsetu.repository.sql.BudgetPlanRepository;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

        private final TransactionRepository transactionRepository;
        private final CategoryRepository categoryRepository;
        private final AccountService accountService;
        private final BudgetPlanRepository budgetPlanRepository;
        private final StringRedisTemplate redisTemplate;
        private final ObjectMapper objectMapper;

        private static final long CACHE_TTL_MINUTES = 5;
        private static final String CACHE_PREFIX = "dashboard:";

        @org.springframework.transaction.annotation.Transactional(readOnly = true)
        public DashboardResponse getSummary(UUID userId, Integer month, Integer year) {
                String hashKey = CACHE_PREFIX + userId;
                String fieldKey = year + ":" + month;

                try {
                        Object cached = redisTemplate.opsForHash().get(hashKey, fieldKey);
                        if (cached != null) {
                                return objectMapper.readValue((String) cached, DashboardResponse.class);
                        }
                } catch (Exception e) {
                        log.warn("Failed to read dashboard cache for key {}: {}", hashKey, e.getMessage());
                }

                DashboardResponse response = computeSummary(userId, month, year);

                try {
                        String json = objectMapper.writeValueAsString(response);
                        redisTemplate.opsForHash().put(hashKey, fieldKey, json);
                        redisTemplate.expire(hashKey, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
                } catch (Exception e) {
                        log.warn("Failed to write dashboard cache for key {}: {}", hashKey, e.getMessage());
                }

                return response;
        }

        private DashboardResponse computeSummary(UUID userId, Integer month, Integer year) {
                YearMonth period = YearMonth.of(year, month);
                LocalDate start = period.atDay(1);
                LocalDate end = period.atEndOfMonth();

                BigDecimal totalIncome = nullToZero(transactionRepository.sumAmountByTypeAndDateRange(
                                userId, "INCOME", start, end));
                BigDecimal totalExpense = nullToZero(transactionRepository.sumAmountByTypeAndDateRange(
                                userId, "EXPENSE", start, end));
                BigDecimal netSavings = totalIncome.subtract(totalExpense);
                BigDecimal netWorth = accountService.getActiveAccounts(userId).stream()
                                .map(a -> a.getBalance())
                                .map(this::nullToZero)
                                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

                Map<UUID, Category> categories = categoryRepository.findAllForUser(userId).stream()
                                .collect(Collectors.toMap(c -> c.getId(), c -> c, (left, right) -> left));

                List<Object[]> expenseRowsThisMonth = transactionRepository.sumAmountByTypeGroupedByCategory(userId,
                                "EXPENSE",
                                start, end);
                Map<UUID, BigDecimal> expenseByCategoryThisMonth = new HashMap<>();
                for (Object[] row : expenseRowsThisMonth) {
                        expenseByCategoryThisMonth.put((UUID) row[0], nullToZero((BigDecimal) row[1]));
                }

                List<DashboardResponse.CategoryBreakdown> categoryBreakdown = expenseRowsThisMonth.stream()
                                .map(row -> toCategoryBreakdown(row, categories, totalExpense))
                                .sorted(Comparator.comparing((DashboardResponse.CategoryBreakdown cb) -> cb.getAmount())
                                                .reversed())
                                .toList();

                List<DashboardResponse.MonthlyTrend> monthlyTrend = buildMonthlyTrend(userId, period);
                List<DashboardResponse.BudgetStatus> budgetStatus = buildBudgetStatus(userId, period, categories,
                                expenseByCategoryThisMonth);
                List<TransactionResponse> recentTransactions = transactionRepository
                                .findTop5ByUserIdAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(userId)
                                .stream()
                                .map(transaction -> toTransactionResponse(transaction, categories))
                                .toList();

                return DashboardResponse.builder()
                                .summary(DashboardResponse.Summary.builder()
                                                .totalIncome(totalIncome)
                                                .totalExpense(totalExpense)
                                                .netSavings(netSavings)
                                                .netWorth(netWorth)
                                                .build())
                                .categoryBreakdown(categoryBreakdown)
                                .monthlyTrend(monthlyTrend)
                                .budgetStatus(budgetStatus)
                                .recentTransactions(recentTransactions)
                                .build();
        }

        public void evictDashboardCache(UUID userId) {
                try {
                        String hashKey = CACHE_PREFIX + userId;
                        Boolean deleted = redisTemplate.delete(hashKey);
                        if (Boolean.TRUE.equals(deleted)) {
                                log.debug("Evicted dashboard cache hash for user {}", userId);
                        }
                } catch (Exception e) {
                        log.warn("Failed to evict dashboard cache for user {}: {}", userId, e.getMessage());
                }
        }

        private List<DashboardResponse.MonthlyTrend> buildMonthlyTrend(UUID userId, YearMonth selectedPeriod) {
                LocalDate trendStart = selectedPeriod.minusMonths(5).atDay(1);
                LocalDate trendEnd = selectedPeriod.atEndOfMonth();
                List<Object[]> rows = transactionRepository.aggregateByPeriodAndType(userId, trendStart, trendEnd,
                                "month");

                Map<YearMonth, DashboardResponse.MonthlyTrend.MonthlyTrendBuilder> map = new java.util.LinkedHashMap<>();
                for (int i = 5; i >= 0; i--) {
                        YearMonth ym = selectedPeriod.minusMonths(i);
                        map.put(ym, DashboardResponse.MonthlyTrend.builder()
                                        .month(ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                                        .income(BigDecimal.ZERO)
                                        .expense(BigDecimal.ZERO));
                }

                for (Object[] row : rows) {
                        Object periodObj = row[0];
                        LocalDate periodDate;
                        if (periodObj instanceof java.sql.Date sqlDate) {
                                periodDate = sqlDate.toLocalDate();
                        } else if (periodObj instanceof java.time.LocalDate localDate) {
                                periodDate = localDate;
                        } else if (periodObj instanceof java.sql.Timestamp timestamp) {
                                periodDate = timestamp.toLocalDateTime().toLocalDate();
                        } else {
                                periodDate = LocalDate.parse(periodObj.toString());
                        }
                        YearMonth ym = YearMonth.from(periodDate);

                        String type = (String) row[1];
                        BigDecimal total = nullToZero((BigDecimal) row[2]);

                        if (map.containsKey(ym)) {
                                if ("INCOME".equals(type)) {
                                        map.get(ym).income(total);
                                } else if ("EXPENSE".equals(type)) {
                                        map.get(ym).expense(total);
                                }
                        }
                }

                return map.values().stream().map(b -> b.build()).toList();
        }

        private List<DashboardResponse.BudgetStatus> buildBudgetStatus(UUID userId,
                        YearMonth period,
                        Map<UUID, Category> categories,
                        Map<UUID, BigDecimal> expenseByCategory) {
                LocalDate start = period.atDay(1);
                LocalDate end = period.atEndOfMonth();

                List<BudgetPlan> activePlans = budgetPlanRepository.findByUserId(userId).stream()
                                .filter(plan -> !plan.getStartDate().isAfter(end) && !plan.getEndDate().isBefore(start))
                                .toList();

                Map<UUID, BigDecimal> categoryBudgets = new HashMap<>();

                for (BudgetPlan plan : activePlans) {
                        for (BudgetAllocation alloc : plan.getAllocations()) {
                                categoryBudgets.put(alloc.getCategoryId(),
                                                categoryBudgets.getOrDefault(alloc.getCategoryId(), BigDecimal.ZERO)
                                                                .add(alloc.getAmount()));
                        }
                }

                return categoryBudgets.entrySet().stream()
                                .map(entry -> toBudgetStatus(userId, entry.getKey(), entry.getValue(),
                                                categories.get(entry.getKey()), expenseByCategory))
                                .toList();
        }

        private DashboardResponse.BudgetStatus toBudgetStatus(UUID userId,
                        UUID categoryId,
                        BigDecimal budgetAmount,
                        Category category,
                        Map<UUID, BigDecimal> expenseByCategory) {
                BigDecimal spent = expenseByCategory.getOrDefault(categoryId, BigDecimal.ZERO);
                double percentage = budgetAmount.compareTo(BigDecimal.ZERO) == 0
                                ? 0
                                : spent.multiply(BigDecimal.valueOf(100))
                                                .divide(budgetAmount, 2, RoundingMode.HALF_UP)
                                                .doubleValue();

                return DashboardResponse.BudgetStatus.builder()
                                .categoryName(category != null ? category.getName() : "Unknown")
                                .budgetAmount(budgetAmount)
                                .spentAmount(spent)
                                .percentage(percentage)
                                .build();
        }

        private DashboardResponse.CategoryBreakdown toCategoryBreakdown(Object[] row,
                        Map<UUID, Category> categories,
                        BigDecimal totalExpense) {
                UUID categoryId = (UUID) row[0];
                BigDecimal amount = nullToZero((BigDecimal) row[1]);
                Category category = categoryId != null ? categories.get(categoryId) : null;
                double percentage = totalExpense.compareTo(BigDecimal.ZERO) == 0
                                ? 0
                                : amount.multiply(BigDecimal.valueOf(100))
                                                .divide(totalExpense, 2, RoundingMode.HALF_UP)
                                                .doubleValue();

                return DashboardResponse.CategoryBreakdown.builder()
                                .categoryId(categoryId != null ? categoryId.toString() : "uncategorized")
                                .name(category != null ? category.getName() : "Uncategorized")
                                .color(category != null && category.getColor() != null ? category.getColor() : "#10B981")
                                .amount(amount)
                                .percentage(percentage)
                                .build();
        }

        private TransactionResponse toTransactionResponse(Transaction transaction, Map<UUID, Category> categories) {
                Category category = transaction.getCategoryId() != null ? categories.get(transaction.getCategoryId())
                                : null;
                return TransactionResponse.builder()
                                .id(transaction.getId().toString())
                                .payee(transaction.getPayee())
                                .amount(transaction.getAmount())
                                .transactionType(transaction.getTransactionType())
                                .transactionDate(transaction.getTransactionDate())
                                .category(category == null ? null
                                                : TransactionResponse.CategoryInfo.builder()
                                                                .id(category.getId().toString())
                                                                .name(category.getName())
                                                                .color(category.getColor())
                                                                .build())
                                .paymentMode(transaction.getPaymentMode())
                                .description(transaction.getDescription())
                                .tags(transaction.getTags() == null ? List.of() : Arrays.asList(transaction.getTags()))
                                .source(transaction.getSource())
                                .accountId(transaction.getAccountId().toString())
                                .build();
        }

        private BigDecimal nullToZero(BigDecimal value) {
                return value != null ? value : BigDecimal.ZERO;
        }
}
