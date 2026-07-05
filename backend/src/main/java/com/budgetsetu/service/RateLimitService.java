package com.budgetsetu.service;

import com.budgetsetu.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class RateLimitService {

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // In-memory fallback if Redis is unavailable or disconnected
    // Key -> [count, expiryTimestampMs]
    private final Map<String, long[]> inMemoryCache = new ConcurrentHashMap<>();

    /**
     * Checks rate limit and increments counter.
     * Throws RateLimitExceededException if limit is reached.
     *
     * @param key           Identifies the rate limit bucket (e.g., IP or email)
     * @param maxRequests   Maximum allowed requests within the window
     * @param windowSeconds Window duration in seconds
     */
    public void checkRateLimit(String key, int maxRequests, long windowSeconds) {
        try {
            if (redisTemplate != null) {
                String countStr = redisTemplate.opsForValue().get(key);
                if (countStr != null) {
                    int count = Integer.parseInt(countStr);
                    if (count >= maxRequests) {
                        throw new RateLimitExceededException("Too many requests. Please try again later.");
                    }
                    redisTemplate.opsForValue().increment(key);
                } else {
                    redisTemplate.opsForValue().set(key, "1", windowSeconds, TimeUnit.SECONDS);
                }
                return;
            }
        } catch (RateLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis rate limit check failed for key: {}. Falling back to in-memory rate limiting.", key, e);
        }

        // In-memory fallback
        long now = System.currentTimeMillis();
        long windowMs = windowSeconds * 1000L;
        inMemoryCache.compute(key, (k, val) -> {
            if (val == null || now > val[1]) {
                return new long[] { 1L, now + windowMs };
            }
            if (val[0] >= maxRequests) {
                throw new RateLimitExceededException("Too many requests. Please try again later.");
            }
            val[0]++;
            return val;
        });

        if (inMemoryCache.size() > 1000) {
            inMemoryCache.entrySet().removeIf(entry -> now > entry.getValue()[1]);
        }
    }
}
