package com.budgetsetu.service;

import com.budgetsetu.dto.response.AnalyticsResponse;
import com.budgetsetu.model.sql.Category;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Analytics service — computes summary cards, income/expense trend,
 * and category breakdown for arbitrary date ranges.
 * <p>
 * Results are cached in Redis with a 5-minute TTL.
 * Cache is invalidated when transactions are created, updated, or deleted.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final long CACHE_TTL_MINUTES = 5;
    private static final String CACHE_PREFIX = "analytics:";
    private static final DateTimeFormatter PERIOD_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Returns the full analytics response for the given user and date range.
     */
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(UUID userId, LocalDate from, LocalDate to, String groupBy) {
        String hashKey = CACHE_PREFIX + userId;
        String fieldKey = from.format(PERIOD_FORMAT) + ":" + to.format(PERIOD_FORMAT) + ":" + groupBy;

        // Try cache first
        try {
            Object cached = redisTemplate.opsForHash().get(hashKey, fieldKey);
            if (cached != null) {
                return objectMapper.readValue((String) cached, AnalyticsResponse.class);
            }
        } catch (Exception e) {
            log.warn("Failed to read analytics cache for key {}: {}", hashKey, e.getMessage());
        }

        // Compute fresh analytics
        AnalyticsResponse response = computeAnalytics(userId, from, to, groupBy);

        // Store in cache
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForHash().put(hashKey, fieldKey, json);
            redisTemplate.expire(hashKey, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to write analytics cache for key {}: {}", hashKey, e.getMessage());
        }

        return response;
    }

    /**
     * Evicts all cached analytics for a given user.
     * Called when transactions are created, updated, or deleted.
     */
    public void evictAnalyticsCache(UUID userId) {
        try {
            String hashKey = CACHE_PREFIX + userId;
            Boolean deleted = redisTemplate.delete(hashKey);
            if (Boolean.TRUE.equals(deleted)) {
                log.debug("Evicted analytics cache hash for user {}", userId);
            }
        } catch (Exception e) {
            log.warn("Failed to evict analytics cache for user {}: {}", userId, e.getMessage());
        }
    }

    private AnalyticsResponse computeAnalytics(UUID userId, LocalDate from, LocalDate to, String groupBy) {
        // 1. Current Summary cards
        BigDecimal totalIncome = nullToZero(
                transactionRepository.sumAmountByTypeAndDateRange(userId, "INCOME", from, to));
        BigDecimal totalExpense = nullToZero(
                transactionRepository.sumAmountByTypeAndDateRange(userId, "EXPENSE", from, to));
        BigDecimal net = totalIncome.subtract(totalExpense);
        BigDecimal savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? net.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        AnalyticsResponse.SummaryCards summaryCards = AnalyticsResponse.SummaryCards.builder()
                .income(totalIncome)
                .expense(totalExpense)
                .net(net)
                .savingsRate(savingsRate)
                .build();

        // 2. Previous Period Summary cards
        long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate prevFrom = from.minusDays(days);
        LocalDate prevTo = to.minusDays(days);
        
        BigDecimal prevIncome = nullToZero(
                transactionRepository.sumAmountByTypeAndDateRange(userId, "INCOME", prevFrom, prevTo));
        BigDecimal prevExpense = nullToZero(
                transactionRepository.sumAmountByTypeAndDateRange(userId, "EXPENSE", prevFrom, prevTo));
        BigDecimal prevNet = prevIncome.subtract(prevExpense);
        BigDecimal prevSavingsRate = prevIncome.compareTo(BigDecimal.ZERO) > 0
                ? prevNet.multiply(BigDecimal.valueOf(100)).divide(prevIncome, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        AnalyticsResponse.SummaryCards previousPeriodSummary = AnalyticsResponse.SummaryCards.builder()
                .income(prevIncome)
                .expense(prevExpense)
                .net(prevNet)
                .savingsRate(prevSavingsRate)
                .build();

        // 3. Trend — single SQL query with DATE_TRUNC
        List<AnalyticsResponse.TrendPoint> trend = buildTrend(userId, from, to, groupBy);

        // 4. Category breakdowns
        Map<UUID, Category> categories = categoryRepository.findAllForUser(userId).stream()
                .collect(Collectors.toMap(
                        c -> c.getId(),
                        c -> c,
                        (left, right) -> left));

        List<AnalyticsResponse.CategoryBreakdownItem> categoryBreakdown =
                transactionRepository.sumAmountByTypeGroupedByCategory(userId, "EXPENSE", from, to).stream()
                        .map(row -> toCategoryBreakdownItem(row, categories, totalExpense))
                        .sorted(Comparator.comparing(
                                (AnalyticsResponse.CategoryBreakdownItem cb) -> cb.getAmount()).reversed())
                        .toList();
                        
        List<AnalyticsResponse.CategoryBreakdownItem> incomeCategoryBreakdown =
                transactionRepository.sumAmountByTypeGroupedByCategory(userId, "INCOME", from, to).stream()
                        .map(row -> toCategoryBreakdownItem(row, categories, totalIncome))
                        .sorted(Comparator.comparing(
                                (AnalyticsResponse.CategoryBreakdownItem cb) -> cb.getAmount()).reversed())
                        .toList();

        // 5. Top Expenses & Top Incomes
        List<AnalyticsResponse.TopExpenseItem> topExpenses = transactionRepository
                .findTopExpensesByDateRange(userId, from, to, org.springframework.data.domain.PageRequest.of(0, 5))
                .stream()
                .map(t -> {
                    Category cat = t.getCategoryId() != null ? categories.get(t.getCategoryId()) : null;
                    String payeeVal = (t.getPayee() != null && !t.getPayee().isBlank()) ? t.getPayee() : t.getDescription();
                    return AnalyticsResponse.TopExpenseItem.builder()
                            .transactionId(t.getId().toString())
                            .description(t.getDescription())
                            .payee(payeeVal)
                            .date(t.getTransactionDate().toString())
                            .amount(t.getAmount())
                            .categoryName(cat != null ? cat.getName() : "Unknown")
                            .categoryColor(cat != null ? cat.getColor() : "#7A7470")
                            .build();
                })
                .toList();

        List<AnalyticsResponse.TopExpenseItem> topIncomes = transactionRepository
                .findTopIncomesByDateRange(userId, from, to, org.springframework.data.domain.PageRequest.of(0, 5))
                .stream()
                .map(t -> {
                    Category cat = t.getCategoryId() != null ? categories.get(t.getCategoryId()) : null;
                    String payeeVal = (t.getPayee() != null && !t.getPayee().isBlank()) ? t.getPayee() : t.getDescription();
                    return AnalyticsResponse.TopExpenseItem.builder()
                            .transactionId(t.getId().toString())
                            .description(t.getDescription())
                            .payee(payeeVal)
                            .date(t.getTransactionDate().toString())
                            .amount(t.getAmount())
                            .categoryName(cat != null ? cat.getName() : "Unknown")
                            .categoryColor(cat != null ? cat.getColor() : "#10B981")
                            .build();
                })
                .toList();

        return AnalyticsResponse.builder()
                .summaryCards(summaryCards)
                .previousPeriodSummary(previousPeriodSummary)
                .trend(trend)
                .categoryBreakdown(categoryBreakdown)
                .incomeCategoryBreakdown(incomeCategoryBreakdown)
                .topExpenses(topExpenses)
                .topIncomes(topIncomes)
                .build();
    }

    private List<AnalyticsResponse.TrendPoint> buildTrend(UUID userId, LocalDate from, LocalDate to, String groupBy) {
        List<Object[]> rows = transactionRepository.aggregateByPeriodAndType(userId, from, to, groupBy);

        // Pivot: group by period, then collect income/expense per period
        Map<String, BigDecimal[]> periodMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            // row[0] = period (date/timestamp/string), row[1] = type (String), row[2] = total (BigDecimal)
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
            
            String periodLabel = formatPeriodLabel(periodDate, groupBy);
            String type = (String) row[1];
            BigDecimal total = nullToZero((BigDecimal) row[2]);

            periodMap.computeIfAbsent(periodLabel, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal[] totals = periodMap.get(periodLabel);
            if ("INCOME".equals(type)) {
                totals[0] = totals[0].add(total);
            } else {
                totals[1] = totals[1].add(total);
            }
        }

        return periodMap.entrySet().stream()
                .map(entry -> AnalyticsResponse.TrendPoint.builder()
                        .period(entry.getKey())
                        .income(entry.getValue()[0])
                        .expense(entry.getValue()[1])
                        .build())
                .toList();
    }

    private String formatPeriodLabel(LocalDate date, String groupBy) {
        return switch (groupBy) {
            case "day" -> date.format(DateTimeFormatter.ofPattern("dd MMM"));
            case "week" -> "W" + date.format(DateTimeFormatter.ofPattern("ww, MMM yy"));
            default -> date.format(DateTimeFormatter.ofPattern("MMM yyyy"));
        };
    }

    private AnalyticsResponse.CategoryBreakdownItem toCategoryBreakdownItem(
            Object[] row, Map<UUID, Category> categories, BigDecimal totalForType) {
        UUID categoryId = (UUID) row[0];
        BigDecimal amount = nullToZero((BigDecimal) row[1]);
        Category category = categoryId != null ? categories.get(categoryId) : null;

        double percent = totalForType.compareTo(BigDecimal.ZERO) == 0
                ? 0
                : amount.multiply(BigDecimal.valueOf(100))
                        .divide(totalForType, 2, RoundingMode.HALF_UP)
                        .doubleValue();

        return AnalyticsResponse.CategoryBreakdownItem.builder()
                .categoryId(categoryId != null ? categoryId.toString() : "uncategorized")
                .name(category != null ? category.getName() : "Uncategorized")
                .color(category != null && category.getColor() != null ? category.getColor() : "#10B981")
                .amount(amount)
                .percent(percent)
                .build();
    }



    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
