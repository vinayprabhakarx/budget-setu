package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    List<Account> findByUserIdAndIsActiveTrue(UUID userId);

    List<Account> findByUserId(UUID userId);

    Optional<Account> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndName(UUID userId, String name);

    Optional<Account> findByUserIdAndName(UUID userId, String name);

    Optional<Account> findByUserIdAndBankNameAndAccountNumberAndAccountType(
            UUID userId, String bankName, String accountNumber, String accountType);
}
