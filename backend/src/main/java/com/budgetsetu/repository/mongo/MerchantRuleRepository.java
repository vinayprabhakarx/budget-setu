package com.budgetsetu.repository.mongo;

import com.budgetsetu.model.mongo.MerchantRule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MerchantRuleRepository extends MongoRepository<MerchantRule, String> {

    /** System-wide rules (userId is null) + user-specific rules */
    List<MerchantRule> findByUserIdIsNullOrUserId(String userId);

    List<MerchantRule> findByUserId(String userId);

    void deleteAllByUserId(String userId);
}
