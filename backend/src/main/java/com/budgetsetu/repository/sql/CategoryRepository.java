package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    /** System defaults (user_id IS NULL) + user's custom categories */
    @Query("SELECT c FROM Category c WHERE c.userId IS NULL OR c.userId = :userId")
    List<Category> findAllForUser(@Param("userId") UUID userId);

    List<Category> findByUserIdIsNullAndIsDefaultTrue();

    List<Category> findByUserId(UUID userId);

    Optional<Category> findFirstByUserIdIsNullAndNameIgnoreCase(String name);
}
