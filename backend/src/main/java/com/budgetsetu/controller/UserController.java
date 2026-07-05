package com.budgetsetu.controller;

import com.budgetsetu.dto.request.PasswordUpdateRequest;
import com.budgetsetu.dto.request.ProfileUpdateRequest;
import com.budgetsetu.dto.request.DeleteAccountRequest;
import com.budgetsetu.dto.response.UserProfileResponse;
import com.budgetsetu.model.sql.User;
import com.budgetsetu.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
/**
 * REST Controller for user management.
 * Provides endpoints for retrieving user profiles, updating settings, and
 * managing account preferences.
 */
public class UserController {

        private final UserService userService;

        @PutMapping("/profile")
        public ResponseEntity<UserProfileResponse> updateProfile(
                        @AuthenticationPrincipal UUID userId,
                        @Valid @RequestBody ProfileUpdateRequest request) {

                User updatedUser = userService.updateProfile(
                                userId,
                                request.getFullName(),
                                request.getEmail());

                UserProfileResponse response = UserProfileResponse.builder()
                                .userId(updatedUser.getId().toString())
                                .email(updatedUser.getEmail())
                                .fullName(updatedUser.getFullName())
                                .createdAt(updatedUser.getCreatedAt())
                                .emailVerified(updatedUser.getEmailVerified())
                                .role(updatedUser.getRole())
                                .build();

                return ResponseEntity.ok(response);
        }

        @PutMapping("/password")
        public ResponseEntity<Void> updatePassword(
                        @AuthenticationPrincipal UUID userId,
                        @Valid @RequestBody PasswordUpdateRequest request) {

                userService.updatePassword(
                                userId,
                                request.getCurrentPassword(),
                                request.getNewPassword());

                return ResponseEntity.noContent().build();
        }

        @DeleteMapping("/me")
        public ResponseEntity<Void> deleteAccount(
                        @AuthenticationPrincipal UUID userId,
                        @Valid @RequestBody DeleteAccountRequest request) {
                userService.deleteUserAccount(userId, request.getPassword());
                return ResponseEntity.noContent().build();
        }

        @GetMapping("/me")
        public ResponseEntity<UserProfileResponse> getProfile(@AuthenticationPrincipal UUID userId) {
                User user = userService.getUserById(userId);
                UserProfileResponse response = UserProfileResponse.builder()
                                .userId(user.getId().toString())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .createdAt(user.getCreatedAt())
                                .emailVerified(user.getEmailVerified())
                                .role(user.getRole())
                                .build();
                return ResponseEntity.ok(response);
        }
}
