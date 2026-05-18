package com.budgetsetu.repository.mongo;

import com.budgetsetu.model.mongo.AuditEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditEventRepository extends MongoRepository<AuditEvent, String> {

    List<AuditEvent> findByUserIdOrderByTimestampDesc(String userId);

    List<AuditEvent> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);

    void deleteAllByUserId(String userId);
}
