package com.budgetsetu.controller;

import com.budgetsetu.dto.response.ImportSummaryResponse;
import com.budgetsetu.dto.response.ImportUploadResponse;
import com.budgetsetu.parser.BankDetector;
import com.budgetsetu.service.ImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
/**
 * REST Controller for statement imports.
 * Handles the uploading, parsing, and processing of bank statements (CSV/PDF)
 * and tracks import job statuses.
 */
public class ImportController {

    private final ImportService importService;
    private final BankDetector bankDetector;

    @PostMapping("/upload")
    public ResponseEntity<ImportUploadResponse> upload(@AuthenticationPrincipal UUID userId,
            @RequestParam(value = "accountId", required = false) UUID accountId,
            @RequestParam("sourceName") String sourceName,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "bankKey", required = false) String bankKey,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(importService.uploadStatement(userId, accountId, sourceName, password, bankKey, file));
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<ImportSummaryResponse>> getHistory(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(importService.getImportHistory(userId));
    }

    @GetMapping("/{importId}/details")
    public ResponseEntity<com.budgetsetu.dto.response.ImportDetailsResponse> getDetails(
            @AuthenticationPrincipal UUID userId, @PathVariable UUID importId) {
        return ResponseEntity.ok(importService.getImportDetails(userId, importId));
    }

    @GetMapping("/{importId}/status")
    public ResponseEntity<ImportSummaryResponse> status(@AuthenticationPrincipal UUID userId,
            @PathVariable UUID importId) {
        return ResponseEntity.ok(importService.getStatus(userId, importId));
    }

    @GetMapping("/{importId}/stream")
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamStatus(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID importId) {
        return importService.streamStatus(userId, importId);
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{importId}")
    public ResponseEntity<Void> deleteImport(@AuthenticationPrincipal UUID userId,
            @PathVariable UUID importId) {
        importService.deleteStatementImport(userId, importId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/banks")
    public ResponseEntity<java.util.List<java.util.Map<String, String>>> getAvailableBanks() {
        return ResponseEntity.ok(bankDetector.getAvailableBanks());
    }
}
