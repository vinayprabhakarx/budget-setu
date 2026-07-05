package com.budgetsetu.controller;

import com.budgetsetu.dto.response.RestoreSummary;
import com.budgetsetu.security.JwtTokenProvider;
import com.budgetsetu.service.BackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/backup")
/**
 * REST Controller for managing data backups.
 * Allows users to trigger data exports (e.g. JSON/CSV) of their financial
 * records for safe keeping.
 */
public class BackupController {

    @Autowired
    private BackupService backupService;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping(value = "/export", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> exportBackup(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ExportRequest exportRequest) {
        try {
            String token = authHeader.substring(7);
            UUID userId = jwtTokenProvider.getUserIdFromToken(token);

            byte[] zipData = backupService.exportWorkspace(userId, exportRequest.getAccountPassword(),
                    exportRequest.getZipPassword());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf("application/zip"));
            headers.setContentDispositionFormData("attachment", "budgetsetu-backup.zip");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(zipData);
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Invalid account password")) {
                return ResponseEntity.status(401).build();
            }
            throw e;
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/restore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> restoreBackup(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file,
            @RequestParam("accountPassword") String accountPassword,
            @RequestParam(value = "zipPassword", required = false) String zipPassword) {
        try {
            String token = authHeader.substring(7);
            UUID userId = jwtTokenProvider.getUserIdFromToken(token);

            RestoreSummary summary = backupService.restoreWorkspace(userId, file, accountPassword, zipPassword);
            return ResponseEntity.ok(summary);
        } catch (RuntimeException e) {
            if (e.getMessage().equals("Invalid account password")) {
                return ResponseEntity.status(401).body(new ErrorResponse("Invalid account password"));
            }
            if (e.getMessage().equals("ZIP_PASSWORD_REQUIRED")) {
                return ResponseEntity.badRequest().body(new ErrorResponse("ZIP_PASSWORD_REQUIRED"));
            }
            if (e.getMessage().contains("password") || e.getMessage().contains("encrypted")) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Failed to extract backup file. Incorrect zip password?"));
            }
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse("Failed to restore backup"));
        }
    }
}

class ExportRequest {
    private String accountPassword;
    private String zipPassword;

    public String getAccountPassword() {
        return accountPassword;
    }

    public void setAccountPassword(String accountPassword) {
        this.accountPassword = accountPassword;
    }

    public String getZipPassword() {
        return zipPassword;
    }

    public void setZipPassword(String zipPassword) {
        this.zipPassword = zipPassword;
    }
}

class ErrorResponse {
    private String message;

    public ErrorResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
