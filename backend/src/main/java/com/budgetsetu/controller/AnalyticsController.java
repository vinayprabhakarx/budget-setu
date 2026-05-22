package com.budgetsetu.controller;

import com.budgetsetu.dto.response.AnalyticsResponse;
import com.budgetsetu.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
/**
 * REST Controller for handling financial analytics and reporting.
 * Exposes endpoints to retrieve aggregated spending trends, category breakdowns, and income vs expense comparisons.
 */
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/analytics/summary?from={date}&to={date}&groupBy={month|week|day}
     *
     * Returns summary cards, income/expense trend, and category breakdown
     * for the authenticated user within the specified date range.
     */
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsResponse> getSummary(
            @AuthenticationPrincipal UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "month") String groupBy) {
        return ResponseEntity.ok(analyticsService.getAnalytics(userId, from, to, groupBy));
    }
}
