package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, UUID> {

    Optional<EmailVerification> findByEmail(String email);

    Optional<EmailVerification> findByToken(String token);

    void deleteByEmail(String email);
}
