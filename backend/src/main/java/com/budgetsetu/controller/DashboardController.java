package com.budgetsetu.controller;

import com.budgetsetu.dto.response.DashboardResponse;
import com.budgetsetu.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
/**
 * REST Controller for dashboard summaries.
 * Aggregates high-level metrics such as net worth, recent transactions, and
 * overall financial health for the user's landing page.
 */
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardResponse> getSummary(
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        YearMonth period = YearMonth.now();
        return ResponseEntity.ok(dashboardService.getSummary(
                userId,
                month != null ? month : period.getMonthValue(),
                year != null ? year : period.getYear()));
    }
}
