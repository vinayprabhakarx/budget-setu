package com.budgetsetu.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ImportProgressTracker {
    private final Map<UUID, Integer> progressMap = new ConcurrentHashMap<>();
    private final Map<UUID, org.springframework.web.servlet.mvc.method.annotation.SseEmitter> emitters = new ConcurrentHashMap<>();

    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter subscribe(UUID importId) {
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(
                300000L); // 5 minutes timeout
        emitters.put(importId, emitter);

        emitter.onCompletion(() -> emitters.remove(importId));
        emitter.onTimeout(() -> emitters.remove(importId));
        emitter.onError(e -> emitters.remove(importId));

        try {
            int current = progressMap.getOrDefault(importId, 0);
            emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().name("progress")
                    .data(current));
        } catch (java.io.IOException e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    public void updateProgress(UUID importId, int percentage) {
        progressMap.put(importId, percentage);
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = emitters.get(importId);
        if (emitter != null) {
            try {
                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().name("progress")
                        .data(percentage));
            } catch (java.io.IOException e) {
                emitters.remove(importId);
            }
        }
    }

    public void complete(UUID importId, String status) {
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = emitters.get(importId);
        if (emitter != null) {
            try {
                emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event().name("complete")
                        .data(status));
                emitter.complete();
            } catch (java.io.IOException e) {
                // Ignore
            } finally {
                emitters.remove(importId);
            }
        }
    }

    public int getProgress(UUID importId) {
        return progressMap.getOrDefault(importId, 0);
    }

    public void clearProgress(UUID importId) {
        progressMap.remove(importId);
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = emitters.remove(importId);
        if (emitter != null) {
            emitter.complete();
        }
    }
}
