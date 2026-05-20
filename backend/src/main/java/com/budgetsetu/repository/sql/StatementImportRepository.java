package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.StatementImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StatementImportRepository extends JpaRepository<StatementImport, UUID> {

    List<StatementImport> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<StatementImport> findByIdAndUserId(UUID id, UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM StatementImport s WHERE s.accountId = :accountId AND s.userId = :userId")
    void deleteByAccountIdAndUserId(@org.springframework.data.repository.query.Param("accountId") UUID accountId, @org.springframework.data.repository.query.Param("userId") UUID userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE StatementImport s SET s.accountId = :destAccountId WHERE s.accountId = :sourceAccountId AND s.userId = :userId")
    void updateAccountId(@org.springframework.data.repository.query.Param("sourceAccountId") UUID sourceAccountId, @org.springframework.data.repository.query.Param("destAccountId") UUID destAccountId, @org.springframework.data.repository.query.Param("userId") UUID userId);
}
