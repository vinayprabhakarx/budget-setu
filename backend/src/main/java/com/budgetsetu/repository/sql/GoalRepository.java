package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoalRepository extends JpaRepository<Goal, UUID> {

    List<Goal> findByUserId(UUID userId);

    List<Goal> findByUserIdAndStatus(UUID userId, String status);

    Optional<Goal> findByIdAndUserId(UUID id, UUID userId);
}
