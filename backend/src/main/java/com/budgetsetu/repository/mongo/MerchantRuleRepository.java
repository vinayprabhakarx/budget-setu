package com.budgetsetu.repository.mongo;

import com.budgetsetu.model.mongo.MerchantRule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MerchantRuleRepository extends MongoRepository<MerchantRule, String> {

    /** System-wide rules (userId is null) + user-specific rules */
    List<MerchantRule> findByUserIdIsNullOrUserId(String userId);

    /** Only system-wide (admin-managed) rules */
    List<MerchantRule> findByUserIdIsNull();

    /** User-specific personal rules */
    List<MerchantRule> findByUserId(String userId);

    /** Check for duplicate system-wide keyword during seeding/creation */
    Optional<MerchantRule> findByMerchantPatternIgnoreCaseAndUserIdIsNull(String merchantPattern);

    /** Check for duplicate user-specific keyword */
    Optional<MerchantRule> findByMerchantPatternIgnoreCaseAndUserId(String merchantPattern, String userId);

    long countByUserIdIsNull();

    void deleteAllByUserId(String userId);
}
