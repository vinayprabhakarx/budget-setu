package com.budgetsetu.service;

import com.budgetsetu.model.sql.Category;
import com.budgetsetu.model.sql.User;
import com.budgetsetu.repository.sql.CategoryRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import com.budgetsetu.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonthlyReportJob {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final MailService mailService;

    @Scheduled(cron = "0 0 9 1 * ?") // 1st day of every month at 9 AM
    @Transactional
    public void run() {
        log.info("Starting Monthly Report Generation Job...");
        generateReports();
        log.info("Monthly Report Generation Job completed.");
    }

    @Transactional
    public void generateReports() {
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("system", null, java.util.List.of())
        );
        try {
            LocalDate today = LocalDate.now();
            LocalDate lastMonthDate = today.minusMonths(1);
            int year = lastMonthDate.getYear();

            LocalDate start = lastMonthDate.withDayOfMonth(1);
            LocalDate end = lastMonthDate.withDayOfMonth(lastMonthDate.lengthOfMonth());

            String monthName = lastMonthDate.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            List<User> users = userRepository.findAll();
            for (User user : users) {
                try {
                    BigDecimal income = transactionRepository.sumAmountByTypeAndDateRange(user.getId(), "INCOME", start, end);
                    BigDecimal expense = transactionRepository.sumAmountByTypeAndDateRange(user.getId(), "EXPENSE", start, end);

                    if (income == null) income = BigDecimal.ZERO;
                    if (expense == null) expense = BigDecimal.ZERO;

                    BigDecimal netSavings = income.subtract(expense);

                    StringBuilder categorySummary = new StringBuilder();
                    List<Object[]> groupedExpenses = transactionRepository.sumAmountByTypeGroupedByCategory(user.getId(), "EXPENSE", start, end);
                    if (groupedExpenses != null && !groupedExpenses.isEmpty()) {
                        categorySummary.append("\nTop Spending Categories:\n");
                        for (Object[] row : groupedExpenses) {
                            java.util.UUID categoryId = (java.util.UUID) row[0];
                            BigDecimal amount = (BigDecimal) row[1];
                            Category category = categoryRepository.findById(categoryId).orElse(null);
                            String categoryName = category != null ? category.getName() : "Unknown";
                            categorySummary.append(String.format(" - %s: %s\n", categoryName, amount.setScale(2, RoundingMode.HALF_UP).toString()));
                        }
                    } else {
                        categorySummary.append("\nNo expenses recorded last month.\n");
                    }

                    String subject = String.format("BudgetSetu: Monthly Financial Summary for %s %d", monthName, year);
                    String body = String.format(
                            "Hello,\n\n" +
                            "Here is your financial summary for %s %d:\n\n" +
                            " - Total Income: %s\n" +
                            " - Total Expenses: %s\n" +
                            " - Net Savings: %s\n" +
                            "%s\n" +
                            "Keep tracking your finances to reach your financial goals!\n\n" +
                            "Best regards,\nBudgetSetu Team",
                            monthName,
                            year,
                            income.setScale(2, RoundingMode.HALF_UP).toString(),
                            expense.setScale(2, RoundingMode.HALF_UP).toString(),
                            netSavings.setScale(2, RoundingMode.HALF_UP).toString(),
                            categorySummary.toString()
                    );

                    mailService.sendEmail(user.getEmail(), subject, body);
                } catch (Exception e) {
                    log.error("Failed to generate monthly report for user: {}", user.getEmail(), e);
                }
            }
        } finally {
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        }
    }
}
