package com.budgetsetu.controller;

import com.budgetsetu.model.sql.Category;
import com.budgetsetu.repository.sql.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
/**
 * REST Controller for transaction categories.
 * Manages the taxonomy of categories (e.g., Food, Transport, Bills) used to classify transactions.
 */
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getCategories(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(categoryRepository.findAllForUser(userId));
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Category categoryRequest) {
        Category category = Category.builder()
                .userId(userId)
                .name(categoryRequest.getName())
                .icon(categoryRequest.getIcon())
                .color(categoryRequest.getColor())
                .type(categoryRequest.getType() != null ? categoryRequest.getType() : "EXPENSE")
                .isDefault(false)
                .build();
        Category saved = categoryRepository.save(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
