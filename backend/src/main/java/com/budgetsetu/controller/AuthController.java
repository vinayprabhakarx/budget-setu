package com.budgetsetu.controller;

import com.budgetsetu.dto.request.LoginRequest;
import com.budgetsetu.dto.request.RegisterRequest;
import com.budgetsetu.dto.response.AuthResponse;
import com.budgetsetu.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
/**
 * REST Controller for user authentication.
 * Handles registration, login, logout, and token refresh workflows, issuing
 * stateless JWTs.
 */
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setRefreshTokenCookie(response, UUID.fromString(authResponse.getUserId()));
        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("/magic-link")
    public ResponseEntity<?> getMagicLinkCode(@RequestParam("token") String token) {
        try {
            String code = authService.getMagicLinkCode(token);
            return ResponseEntity.ok(Map.of("code", code));
        } catch (IllegalArgumentException e) {
            if ("TOKEN_EXPIRED".equals(e.getMessage())) {
                String email = null;
                try {
                    email = authService.getEmailForToken(token);
                } catch (Exception ex) {
                    // Ignore if token verification entry was not found or already deleted
                }
                if (email != null) {
                    return ResponseEntity.status(HttpStatus.GONE) // 410 GONE
                            .body(Map.of(
                                    "code", "TOKEN_EXPIRED",
                                    "message", "This verification token has expired.",
                                    "email", email));
                }
                return ResponseEntity.status(HttpStatus.GONE) // 410 GONE
                        .body(Map.of("code", "TOKEN_EXPIRED", "message", "This verification token has expired."));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and code are required."));
        }
        authService.verifyEmail(email, code);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        authService.resendVerification(email);
        return ResponseEntity.ok(Map.of("message", "Verification email sent."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        try {
            authService.requestPasswordReset(email);
            return ResponseEntity.ok(Map.of("message", "Password reset email sent."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/reset-password/magic-link")
    public ResponseEntity<?> getResetPasswordMagicLinkCode(@RequestParam("token") String token) {
        try {
            String code = authService.getPasswordResetCode(token);
            String email = authService.getEmailForResetToken(token);
            return ResponseEntity.ok(Map.of("code", code, "email", email));
        } catch (IllegalArgumentException e) {
            if ("TOKEN_EXPIRED".equals(e.getMessage())) {
                String email = null;
                try {
                    email = authService.getEmailForResetToken(token);
                } catch (Exception ex) {
                    // Ignore if token reset entry was not found or already deleted
                }
                if (email != null) {
                    return ResponseEntity.status(HttpStatus.GONE) // 410 GONE
                            .body(Map.of(
                                    "code", "TOKEN_EXPIRED",
                                    "message", "This password reset token has expired.",
                                    "email", email));
                }
                return ResponseEntity.status(HttpStatus.GONE) // 410 GONE
                        .body(Map.of("code", "TOKEN_EXPIRED", "message", "This password reset token has expired."));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password/verify-code")
    public ResponseEntity<Map<String, String>> verifyPasswordResetCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and code are required."));
        }
        try {
            authService.verifyPasswordResetCode(email, code);
            return ResponseEntity.ok(Map.of("message", "Code verified successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String password = request.get("password");
        if (email == null || code == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email, code, and password are required."));
        }
        try {
            authService.resetPassword(email, code, password);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshTokenVal) {
        if (refreshTokenVal == null || refreshTokenVal.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "REFRESH_TOKEN_INVALID", "message", "No refresh token provided"));
        }

        try {
            String newAccessToken = authService.refreshAccessToken(refreshTokenVal);
            return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "REFRESH_TOKEN_INVALID", "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "REFRESH_TOKEN_EXPIRED", "message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshTokenVal,
            HttpServletResponse response) {
        if (refreshTokenVal != null && !refreshTokenVal.trim().isEmpty()) {
            authService.revokeToken(refreshTokenVal);
        }

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.noContent().build();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, UUID userId) {
        String refreshToken = authService.createRefreshToken(userId);
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // False for local HTTP development
                .path("/")
                .maxAge(authService.getRefreshTokenExpirationMs() / 1000)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
