package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.RecurringExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RecurringExpenseRepository extends JpaRepository<RecurringExpense, UUID> {
    List<RecurringExpense> findByUserId(UUID userId);
}
