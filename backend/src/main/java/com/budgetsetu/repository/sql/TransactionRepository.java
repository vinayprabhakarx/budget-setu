package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>,
              JpaSpecificationExecutor<Transaction> {

       Optional<Transaction> findByIdAndUserIdAndIsDeletedFalse(UUID id, UUID userId);

       Page<Transaction> findByUserIdAndIsDeletedFalse(UUID userId, Pageable pageable);

       List<Transaction> findAllByUserIdAndIsDeletedFalse(UUID userId);

       boolean existsByUserIdAndFingerprint(UUID userId, String fingerprint);

       List<Transaction> findByUserId(UUID userId);

       List<Transaction> findByUserIdAndFingerprintIn(UUID userId, List<String> fingerprints);

       @org.springframework.data.jpa.repository.Modifying
       @org.springframework.data.jpa.repository.Query("DELETE FROM Transaction t WHERE t.userId = :userId AND t.fingerprint IN :fingerprints")
       void deleteAllByUserIdAndFingerprintIn(@org.springframework.data.repository.query.Param("userId") UUID userId,
                     @org.springframework.data.repository.query.Param("fingerprints") List<String> fingerprints);

       @Query("SELECT SUM(t.amount) FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.transactionType = :type " +
                     "AND t.transactionDate BETWEEN :start AND :end AND t.isDeleted = false")
       BigDecimal sumAmountByTypeAndDateRange(@Param("userId") UUID userId,
                     @Param("type") String type,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end);

       @Query("SELECT SUM(t.amount) FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.categoryId = :categoryId " +
                     "AND t.transactionDate BETWEEN :start AND :end AND t.isDeleted = false")
       BigDecimal sumAmountByCategoryAndDateRange(@Param("userId") UUID userId,
                     @Param("categoryId") UUID categoryId,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end);

       @Query("SELECT SUM(t.amount) FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.categoryId = :categoryId " +
                     "AND t.transactionType = :type AND t.transactionDate BETWEEN :start AND :end " +
                     "AND t.isDeleted = false")
       BigDecimal sumAmountByCategoryTypeAndDateRange(@Param("userId") UUID userId,
                     @Param("categoryId") UUID categoryId,
                     @Param("type") String type,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end);

       @Query("SELECT t.categoryId, SUM(t.amount) FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.transactionType = :type " +
                     "AND t.transactionDate BETWEEN :start AND :end AND t.isDeleted = false " +
                     "GROUP BY t.categoryId")
       List<Object[]> sumAmountByTypeGroupedByCategory(@Param("userId") UUID userId,
                     @Param("type") String type,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end);

       @Query("SELECT SUM(t.amount) FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.transactionType = :type AND t.isDeleted = false")
       BigDecimal sumAmountByType(@Param("userId") UUID userId,
                     @Param("type") String type);

       @Query("SELECT t.categoryId, SUM(t.amount) FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.transactionType = :type AND t.isDeleted = false " +
                     "GROUP BY t.categoryId")
       List<Object[]> sumAmountByTypeGroupedByCategoryAllTime(@Param("userId") UUID userId,
                     @Param("type") String type);

       List<Transaction> findTop5ByUserIdAndIsDeletedFalseOrderByTransactionDateDescCreatedAtDesc(UUID userId);

       @Query("SELECT t FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.transactionType = 'EXPENSE' " +
                     "AND t.transactionDate BETWEEN :start AND :end AND t.isDeleted = false " +
                     "ORDER BY t.amount DESC")
       List<Transaction> findTopExpensesByDateRange(@Param("userId") UUID userId,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end,
                     Pageable pageable);

       @Query("SELECT t FROM Transaction t " +
                     "WHERE t.userId = :userId AND t.transactionType = 'INCOME' " +
                     "AND t.transactionDate BETWEEN :start AND :end AND t.isDeleted = false " +
                     "ORDER BY t.amount DESC")
       List<Transaction> findTopIncomesByDateRange(@Param("userId") UUID userId,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end,
                     Pageable pageable);

       @org.springframework.data.jpa.repository.Modifying
       @Query("DELETE FROM Transaction t WHERE t.accountId = :accountId AND t.userId = :userId")
       void deleteByAccountIdAndUserId(@Param("accountId") UUID accountId, @Param("userId") UUID userId);

       @org.springframework.data.jpa.repository.Modifying
       @Query("UPDATE Transaction t SET t.accountId = :destAccountId WHERE t.accountId = :sourceAccountId AND t.userId = :userId")
       void updateAccountId(@Param("sourceAccountId") UUID sourceAccountId, @Param("destAccountId") UUID destAccountId,
                     @Param("userId") UUID userId);

       @Query("SELECT SUM(CASE WHEN t.transactionType IN ('EXPENSE', 'TRANSFER') THEN -t.amount ELSE t.amount END) " +
                     "FROM Transaction t WHERE t.accountId = :accountId AND t.userId = :userId AND t.isDeleted = false")
       BigDecimal calculateBalanceByAccountIdAndUserId(@Param("accountId") UUID accountId,
                     @Param("userId") UUID userId);

       @Query("SELECT t.runningBalance FROM Transaction t " +
                     "WHERE t.accountId = :accountId AND t.userId = :userId AND t.isDeleted = false AND t.runningBalance IS NOT NULL "
                     +
                     "ORDER BY t.transactionDate DESC, t.createdAt DESC, t.id DESC")
       List<BigDecimal> findLatestRunningBalance(@Param("accountId") UUID accountId, @Param("userId") UUID userId,
                     org.springframework.data.domain.Pageable pageable);

       @Query("SELECT SUM(CASE WHEN t.transactionType IN ('EXPENSE', 'TRANSFER') THEN -t.amount ELSE t.amount END) " +
                     "FROM Transaction t WHERE t.accountId = :accountId AND t.userId = :userId AND t.isDeleted = false "
                     +
                     "AND t.transactionDate >= :startDate")
       BigDecimal sumTransactionsAfterDate(@Param("accountId") UUID accountId, @Param("userId") UUID userId,
                     @Param("startDate") LocalDate startDate);

       /**
        * Aggregate income/expense totals grouped by truncated date period.
        * Uses PostgreSQL DATE_TRUNC for efficient single-query trend computation.
        * Returns rows of [period (Date), type (String), total (BigDecimal)].
        */
       @Query(value = "SELECT DATE_TRUNC(CAST(:groupBy AS text), t.transaction_date)::date AS period, " +
                     "t.transaction_type AS type, SUM(t.amount) AS total " +
                     "FROM transactions t " +
                     "WHERE t.user_id = :userId AND t.is_deleted = false " +
                     "AND t.transaction_date BETWEEN :start AND :end " +
                     "AND t.transaction_type IN ('INCOME', 'EXPENSE') " +
                     "GROUP BY period, type ORDER BY period", nativeQuery = true)
       List<Object[]> aggregateByPeriodAndType(@Param("userId") UUID userId,
                     @Param("start") LocalDate start,
                     @Param("end") LocalDate end,
                     @Param("groupBy") String groupBy);
}
