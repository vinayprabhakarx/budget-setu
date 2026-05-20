package com.budgetsetu.service;

import com.budgetsetu.dto.request.LoginRequest;
import com.budgetsetu.dto.request.RegisterRequest;
import com.budgetsetu.dto.response.AuthResponse;
import com.budgetsetu.model.sql.RefreshToken;
import com.budgetsetu.model.sql.User;
import com.budgetsetu.exception.ResourceNotFoundException;
import com.budgetsetu.model.sql.EmailVerification;
import com.budgetsetu.model.sql.PasswordReset;
import com.budgetsetu.repository.sql.EmailVerificationRepository;
import com.budgetsetu.repository.sql.PasswordResetRepository;
import com.budgetsetu.repository.sql.RefreshTokenRepository;
import com.budgetsetu.repository.sql.UserRepository;
import com.budgetsetu.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Value("${app.email-verification.required}")
    private boolean emailVerificationRequired;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered.");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role("USER")
                .emailVerified(!emailVerificationRequired)
                .build();

        user = userRepository.save(user);

        if (emailVerificationRequired) {
            // Generate verification code and token
            emailVerificationRepository.deleteByEmail(user.getEmail());
            emailVerificationRepository.flush();

            String code = String.format("%06d", new java.util.Random().nextInt(1000000));
            String token = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

            EmailVerification verification = EmailVerification.builder()
                    .email(user.getEmail())
                    .token(token)
                    .code(code)
                    .tokenExpiresAt(expiresAt)
                    .codeExpiresAt(expiresAt)
                    .build();
            emailVerificationRepository.save(verification);

            emailService.sendVerificationEmail(user.getEmail(), token);

            return AuthResponse.builder()
                    .userId(user.getId().toString())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .createdAt(user.getCreatedAt())
                    .build();
        } else {
            String accessToken = tokenProvider.generateAccessToken(
                    user.getId(), user.getEmail(), user.getRole());
            return AuthResponse.builder()
                    .userId(user.getId().toString())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .createdAt(user.getCreatedAt())
                    .accessToken(accessToken)
                    .role(user.getRole())
                    .build();
        }
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.getIsActive()) {
            throw new BadCredentialsException("Account is deactivated.");
        }

        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Email is not verified. Please verify your email before logging in.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String accessToken = tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .userId(user.getId().toString())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .createdAt(user.getCreatedAt())
                .accessToken(accessToken)
                .role(user.getRole())
                .build();
    }

    @Transactional
    public String createRefreshToken(UUID userId) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .userId(userId)
                .token(token)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);
        return token;
    }

    @Transactional
    public void revokeAllUserTokens(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    @Transactional
    public String refreshAccessToken(String tokenVal) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(tokenVal)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Refresh token is expired");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        if (!user.getIsActive()) {
            throw new BadCredentialsException("User account is inactive");
        }

        return tokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole());
    }

    @Transactional
    public void revokeToken(String tokenVal) {
        refreshTokenRepository.findByTokenAndRevokedFalse(tokenVal).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional(readOnly = true)
    public String getMagicLinkCode(String token) {
        EmailVerification verification = emailVerificationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unknown verification token."));
        if (verification.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("TOKEN_EXPIRED");
        }
        return verification.getCode();
    }

    @Transactional(readOnly = true)
    public String getEmailForToken(String token) {
        EmailVerification verification = emailVerificationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unknown verification token."));
        return verification.getEmail();
    }

    @Transactional
    public void verifyEmail(String email, String code) {
        EmailVerification verification = emailVerificationRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code."));

        if (verification.getCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }

        if (!verification.getCode().equals(code.trim())) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }

        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        user.setEmailVerified(true);
        userRepository.save(user);

        emailVerificationRepository.delete(verification);

        try {
            redisTemplate.delete("rate-limit:resend-verification:" + email.toLowerCase().trim());
        } catch (Exception e) {
            log.warn("Redis connection failed. Failed to delete rate limit key on verify.", e);
        }
    }

    @Transactional
    public void resendVerification(String email) {
        String normalizedEmail = email.toLowerCase().trim();

        // Rate limiting check: max 3 resends in 24 hours
        try {
            String key = "rate-limit:resend-verification:" + normalizedEmail;
            String currentCountStr = redisTemplate.opsForValue().get(key);
            if (currentCountStr != null) {
                int currentCount = Integer.parseInt(currentCountStr);
                if (currentCount >= 3) {
                    throw new IllegalArgumentException(
                            "Too many verification attempts. You can only request resending the verification email 3 times per day.");
                }
                redisTemplate.opsForValue().increment(key);
            } else {
                redisTemplate.opsForValue().set(key, "1", 24, java.util.concurrent.TimeUnit.HOURS);
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis connection failed. Skipping rate-limiting check.", e);
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Email is already verified.");
        }

        // Delete old verification if exists
        emailVerificationRepository.deleteByEmail(user.getEmail());
        emailVerificationRepository.flush();

        String code = String.format("%06d", new java.util.Random().nextInt(1000000));
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        EmailVerification verification = EmailVerification.builder()
                .email(user.getEmail())
                .token(token)
                .code(code)
                .tokenExpiresAt(expiresAt)
                .codeExpiresAt(expiresAt)
                .build();
        emailVerificationRepository.save(verification);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        String normalizedEmail = email.toLowerCase().trim();

        // Check if user exists. If not, throw an exception so the user gets clear
        // feedback
        if (!userRepository.existsByEmail(normalizedEmail)) {
            log.info("Password reset requested for unregistered email: {}", normalizedEmail);
            throw new IllegalArgumentException("Email address is not registered.");
        }

        // Rate limiting check: max 3 requests in 24 hours per email
        try {
            String key = "rate-limit:forgot-password:" + normalizedEmail;
            String currentCountStr = redisTemplate.opsForValue().get(key);
            if (currentCountStr != null) {
                int currentCount = Integer.parseInt(currentCountStr);
                if (currentCount >= 3) {
                    throw new IllegalArgumentException("Too many password reset attempts.");
                }
                redisTemplate.opsForValue().increment(key);
            } else {
                redisTemplate.opsForValue().set(key, "1", 24, java.util.concurrent.TimeUnit.HOURS);
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis connection failed. Skipping rate-limiting check.", e);
        }

        // Delete old password reset record for this email and flush
        passwordResetRepository.deleteByEmail(normalizedEmail);
        passwordResetRepository.flush();

        String code = String.format("%06d", new java.util.Random().nextInt(1000000));
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10); // Password reset token valid for 10 minutes

        PasswordReset reset = PasswordReset.builder()
                .email(normalizedEmail)
                .token(token)
                .code(code)
                .tokenExpiresAt(expiresAt)
                .codeExpiresAt(expiresAt)
                .build();
        passwordResetRepository.save(reset);

        emailService.sendPasswordResetEmail(normalizedEmail, token);
    }

    @Transactional(readOnly = true)
    public String getPasswordResetCode(String token) {
        PasswordReset reset = passwordResetRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unknown password reset token."));
        if (reset.getTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("TOKEN_EXPIRED");
        }
        return reset.getCode();
    }

    @Transactional(readOnly = true)
    public String getEmailForResetToken(String token) {
        PasswordReset reset = passwordResetRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unknown password reset token."));
        return reset.getEmail();
    }

    @Transactional(readOnly = true)
    public void verifyPasswordResetCode(String email, String code) {
        String normalizedEmail = email.toLowerCase().trim();
        PasswordReset reset = passwordResetRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code."));

        if (reset.getCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }

        if (!reset.getCode().equals(code.trim())) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        String normalizedEmail = email.toLowerCase().trim();
        PasswordReset reset = passwordResetRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification code."));

        if (reset.getCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }

        if (!reset.getCode().equals(code.trim())) {
            throw new IllegalArgumentException("Invalid or expired verification code.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Delete the password reset record
        passwordResetRepository.delete(reset);

        // Reset the rate limit counter upon successful password change
        try {
            redisTemplate.delete("rate-limit:forgot-password:" + normalizedEmail);
        } catch (Exception e) {
            log.warn("Redis connection failed. Failed to delete rate limit key on password reset.", e);
        }
    }
}
