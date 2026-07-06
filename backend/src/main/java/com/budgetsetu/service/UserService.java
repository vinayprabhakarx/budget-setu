package com.budgetsetu.service;

import com.budgetsetu.exception.ResourceNotFoundException;
import com.budgetsetu.model.sql.User;
import com.budgetsetu.repository.mongo.AuditEventRepository;
import com.budgetsetu.repository.mongo.ImportLogRepository;
import com.budgetsetu.repository.mongo.MerchantRuleRepository;
import com.budgetsetu.model.sql.EmailVerification;
import com.budgetsetu.repository.sql.EmailVerificationRepository;
import com.budgetsetu.repository.sql.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.LocalDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditEventRepository auditEventRepository;
    private final ImportLogRepository importLogRepository;
    private final MerchantRuleRepository merchantRuleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationRepository emailVerificationRepository;
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;

    @org.springframework.beans.factory.annotation.Value("${app.email-verification.required}")
    private boolean emailVerificationRequired;

    @Transactional
    public User updateProfile(UUID userId, String fullName, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String normalizedEmail = email.toLowerCase().trim();
        boolean emailChanged = false;
        if (!user.getEmail().equalsIgnoreCase(normalizedEmail)) {
            if (userRepository.existsByEmail(normalizedEmail)) {
                throw new IllegalArgumentException("Email is already in use by another account.");
            }
            user.setEmail(normalizedEmail);
            if (emailVerificationRequired) {
                user.setEmailVerified(false);
                emailChanged = true;
            }
        }

        user.setFullName(fullName.trim());
        User savedUser = userRepository.save(user);

        if (emailChanged) {
            emailVerificationRepository.deleteByEmail(savedUser.getEmail());
            emailVerificationRepository.flush();

            String code = String.format("%06d", new java.util.Random().nextInt(1000000));
            String token = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

            EmailVerification verification = EmailVerification.builder()
                    .email(savedUser.getEmail())
                    .token(token)
                    .code(code)
                    .tokenExpiresAt(expiresAt)
                    .codeExpiresAt(expiresAt)
                    .build();
            emailVerificationRepository.save(verification);

            emailService.sendVerificationEmail(savedUser.getEmail(), token);

            try {
                redisTemplate.delete("rate-limit:resend-verification:" + savedUser.getEmail());
            } catch (Exception e) {
                log.warn("Redis connection failed. Failed to delete rate limit key on email change.", e);
            }
        }

        return savedUser;
    }

    @Transactional
    public void updatePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.getHasLocalPassword()) {
            if (currentPassword == null || currentPassword.isEmpty()) {
                throw new IllegalArgumentException("Current password is required.");
            }
            if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                throw new IllegalArgumentException("Incorrect current password.");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setHasLocalPassword(true);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUserAccount(UUID userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect password.");
        }

        executeAccountDeletion(user);
    }

    @Transactional
    public void forceDeleteUserAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        executeAccountDeletion(user);
    }

    private void executeAccountDeletion(User user) {
        String userIdStr = user.getId().toString();

        // 1. Delete user-specific MongoDB data
        auditEventRepository.deleteAllByUserId(userIdStr);
        importLogRepository.deleteAllByUserId(userIdStr);
        merchantRuleRepository.deleteAllByUserId(userIdStr);

        // 2. Clear user-specific Redis cached rate-limits
        try {
            redisTemplate.delete("rate-limit:resend-verification:" + user.getEmail().toLowerCase().trim());
            redisTemplate.delete("rate-limit:forgot-password:" + user.getEmail().toLowerCase().trim());
        } catch (Exception e) {
            log.warn("Failed to delete rate limit keys for deleted user", e);
        }

        // 3. Delete the user from the SQL database (cascade triggers database deletes
        // for transactions, budgets, goals, refresh tokens, etc.)
        userRepository.deleteById(user.getId());
    }

    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }
}
