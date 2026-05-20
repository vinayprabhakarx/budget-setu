package com.budgetsetu.service;

import com.budgetsetu.model.mongo.AuditEvent;
import com.budgetsetu.repository.mongo.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.scheduling.annotation.Async;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    @Async
    public void recordEvent(UUID userId, String entityType, UUID entityId, String fieldChanged, String oldValue, String newValue, String source) {
        AuditEvent event = AuditEvent.builder()
                .userId(userId.toString())
                .entityType(entityType)
                .entityId(entityId.toString())
                .fieldChanged(fieldChanged)
                .oldValue(oldValue)
                .newValue(newValue)
                .source(source)
                .timestamp(Instant.now())
                .build();
        auditEventRepository.save(event);
    }

    public List<AuditEvent> getHistory(String entityType, UUID entityId) {
        return auditEventRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId.toString());
    }
}
