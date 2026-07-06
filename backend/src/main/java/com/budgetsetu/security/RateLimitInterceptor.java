package com.budgetsetu.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.core.env.Environment;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final boolean isTestEnv;

    public RateLimitInterceptor(Environment env) {
        this.isTestEnv = java.util.Arrays.asList(env.getActiveProfiles()).contains("test");
    }

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> importBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> standardBuckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (isTestEnv) return true;

        String path = request.getRequestURI();
        String ip = getClientIP(request);

        Bucket bucket;
        if (path.startsWith("/api/auth/magic-link") && "GET".equalsIgnoreCase(request.getMethod())) {
            // Opening a magic link is just a DB read, allow higher limit so users don't get blocked by refreshing
            bucket = standardBuckets.computeIfAbsent(ip, this::createStandardBucket);
        } else if (path.startsWith("/api/auth/")) {
            bucket = authBuckets.computeIfAbsent(ip, this::createAuthBucket);
        } else if (path.startsWith("/api/imports/")) {
            bucket = importBuckets.computeIfAbsent(ip, this::createImportBucket);
        } else {
            bucket = standardBuckets.computeIfAbsent(ip, this::createStandardBucket);
        }

        if (bucket.tryConsume(1)) {
            return true;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", "60");
        response.setContentType("application/json");
        response.getWriter().write("{\"message\": \"Too many requests. Please try again in 60 seconds.\"}");
        return false;
    }

    private Bucket createAuthBucket(String ip) {
        // 5 requests per minute
        Bandwidth limit = Bandwidth.builder().capacity(5).refillIntervally(5, Duration.ofMinutes(1)).build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createImportBucket(String ip) {
        // 20 requests per hour (parsing is CPU heavy)
        Bandwidth limit = Bandwidth.builder().capacity(20).refillIntervally(20, Duration.ofHours(1)).build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createStandardBucket(String ip) {
        // 100 requests per minute
        Bandwidth limit = Bandwidth.builder().capacity(100).refillIntervally(100, Duration.ofMinutes(1)).build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
