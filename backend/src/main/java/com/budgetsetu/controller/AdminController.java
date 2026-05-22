package com.budgetsetu.controller;

import com.budgetsetu.dto.response.AdminMetricsResponse;
import com.budgetsetu.dto.response.AdminUserDto;
import com.budgetsetu.model.mongo.AdminAuditLog;
import com.budgetsetu.service.AdminService;
import com.budgetsetu.service.LogFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final LogFileService logFileService;

    @GetMapping("/metrics")
    public ResponseEntity<AdminMetricsResponse> getMetrics() {
        return ResponseEntity.ok(adminService.getPlatformMetrics());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AdminUserDto>> getUsers(Pageable pageable) {
        return ResponseEntity.ok(adminService.getUsers(pageable));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> request,
            Principal principal) {
        String newRole = request.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // principal.getName() usually returns the subject (userId) in our JWT setup.
        // Wait, JwtAuthFilter sets principal to userId. But we need adminEmail for auditing.
        // Actually, we can just pass the userId as the admin identifier for now.
        String adminIdStr = principal.getName();
        adminService.updateUserRole(userId, newRole.toUpperCase(), adminIdStr);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{userId}/toggle-suspend")
    public ResponseEntity<Void> toggleSuspend(
            @PathVariable UUID userId,
            Principal principal) {
        String adminIdStr = principal.getName();
        adminService.toggleUserSuspend(userId, adminIdStr);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID userId,
            Principal principal) {
        String adminIdStr = principal.getName();
        adminService.deleteUser(userId, adminIdStr);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/logs")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(adminService.getAuditLogs(pageable));
    }

    @GetMapping("/logs/application")
    public ResponseEntity<List<String>> getApplicationLogs(@RequestParam(defaultValue = "100") int lines) {
        return ResponseEntity.ok(logFileService.getApplicationLogs(lines));
    }

    @GetMapping("/logs/error")
    public ResponseEntity<List<String>> getErrorLogs(@RequestParam(defaultValue = "100") int lines) {
        return ResponseEntity.ok(logFileService.getErrorLogs(lines));
    }

    @GetMapping("/logs/database")
    public ResponseEntity<List<Map<String, Object>>> getDatabaseLogs() {
        return ResponseEntity.ok(logFileService.getDatabaseActivity());
    }
}
