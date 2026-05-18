package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.BudgetAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface BudgetAllocationRepository extends JpaRepository<BudgetAllocation, UUID> {
}
