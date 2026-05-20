package com.budgetsetu.service;

import com.budgetsetu.dto.response.AdminMetricsResponse;
import com.budgetsetu.dto.response.AdminUserDto;
import com.budgetsetu.model.mongo.AdminAuditLog;
import com.budgetsetu.model.sql.User;
import com.budgetsetu.repository.mongo.AdminAuditLogRepository;
import com.budgetsetu.repository.sql.AccountRepository;
import com.budgetsetu.repository.sql.TransactionRepository;
import com.budgetsetu.repository.sql.UserRepository;
import com.budgetsetu.repository.sql.InfrastructureMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.budgetsetu.exception.ResourceNotFoundException;

import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.mongodb.core.MongoTemplate;
import java.lang.management.ManagementFactory;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final UserService userService; // for deletion
    private final StringRedisTemplate redisTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final MongoTemplate mongoTemplate;
    private final InfrastructureMetricRepository infraMetricRepository;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    private static final String METRICS_CACHE_KEY = "admin:metrics";

    public AdminMetricsResponse getPlatformMetrics() {
        // Try to get from Redis cache
        try {
            String cachedMetrics = redisTemplate.opsForValue().get(METRICS_CACHE_KEY + "_full");
            if (cachedMetrics != null) {
                return objectMapper.readValue(cachedMetrics, AdminMetricsResponse.class);
            }
        } catch (Exception e) {
            log.info("Metrics cache miss or Redis unavailable. Computing metrics...");
        }

        // Compute if cache miss
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActive(true);
        long totalTransactions = transactionRepository.count();
        long totalAccounts = accountRepository.count();

        // Monthly Signups (Last 6 months)
        String signupsSql = "SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month, COUNT(*) as count " +
                            "FROM users " +
                            "WHERE created_at >= NOW() - INTERVAL '6 months' " +
                            "GROUP BY DATE_TRUNC('month', created_at) " +
                            "ORDER BY DATE_TRUNC('month', created_at) ASC";
        
        List<AdminMetricsResponse.MonthlyStat> monthlySignups = jdbcTemplate.query(signupsSql, (rs, rowNum) -> 
            AdminMetricsResponse.MonthlyStat.builder()
                .month(rs.getString("month"))
                .count(rs.getLong("count"))
                .build()
        );

        // Monthly Transactions (Last 6 months)
        String txSql = "SELECT TO_CHAR(DATE_TRUNC('month', transaction_date), 'Mon') as month, COUNT(*) as count " +
                       "FROM transactions " +
                       "WHERE transaction_date >= NOW() - INTERVAL '6 months' " +
                       "GROUP BY DATE_TRUNC('month', transaction_date) " +
                       "ORDER BY DATE_TRUNC('month', transaction_date) ASC";
        
        List<AdminMetricsResponse.MonthlyStat> monthlyTransactions = jdbcTemplate.query(txSql, (rs, rowNum) -> 
            AdminMetricsResponse.MonthlyStat.builder()
                .month(rs.getString("month"))
                .count(rs.getLong("count"))
                .build()
        );

        // Historical Infrastructure Metrics (Last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Object[]> dailyInfraAverages = infraMetricRepository.getDailyAveragesSince(thirtyDaysAgo);
        List<AdminMetricsResponse.HistoricalInfraStat> historicalInfraMetrics = new ArrayList<>();
        for (Object[] row : dailyInfraAverages) {
            historicalInfraMetrics.add(AdminMetricsResponse.HistoricalInfraStat.builder()
                .date(String.valueOf(row[0]))
                .avgCpu(Math.round(((Number) row[1]).doubleValue() * 100.0) / 100.0)
                .avgMem(Math.round(((Number) row[2]).doubleValue() * 100.0) / 100.0)
                .avgPgConns(((Number) row[3]).intValue())
                .avgRedisClients(((Number) row[4]).intValue())
                .avgMongoConns(((Number) row[5]).intValue())
                .build());
        }

        // System Health
        Runtime runtime = Runtime.getRuntime();
        double cpuLoad = 0.0;
        try {
            com.sun.management.OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(com.sun.management.OperatingSystemMXBean.class);
            cpuLoad = osBean.getProcessCpuLoad() * 100;
            if (cpuLoad < 0) cpuLoad = 0;
        } catch (Exception e) {
            // ignore
        }
        
        AdminMetricsResponse.SystemHealth systemHealth = AdminMetricsResponse.SystemHealth.builder()
            .cpuUsagePercent(cpuLoad)
            .usedMemoryBytes(runtime.totalMemory() - runtime.freeMemory())
            .totalMemoryBytes(runtime.totalMemory())
            .freeMemoryBytes(runtime.freeMemory())
            .maxMemoryBytes(runtime.maxMemory())
            .build();

        // Postgres Health
        AdminMetricsResponse.DatabaseHealth databaseHealth = null;
        try {
            Map<String, Object> pgStats = jdbcTemplate.queryForMap(
                "SELECT sum(numbackends) as connections, sum(xact_commit) as commits, " +
                "sum(blks_hit)*100.0/NULLIF(sum(blks_hit)+sum(blks_read), 0) as cache_hit_ratio " +
                "FROM pg_stat_database"
            );
            databaseHealth = AdminMetricsResponse.DatabaseHealth.builder()
                .activeConnections(pgStats.get("connections") != null ? ((Number) pgStats.get("connections")).longValue() : 0)
                .totalCommits(pgStats.get("commits") != null ? ((Number) pgStats.get("commits")).longValue() : 0)
                .cacheHitRatio(pgStats.get("cache_hit_ratio") != null ? ((Number) pgStats.get("cache_hit_ratio")).doubleValue() : 0.0)
                .build();
        } catch (Exception e) {
            log.warn("Failed to fetch pg_stat_database", e);
        }

        // Redis Health
        AdminMetricsResponse.RedisHealth redisHealth = null;
        try {
            java.util.Properties info = redisTemplate.getConnectionFactory().getConnection().serverCommands().info();
            if (info != null) {
                redisHealth = AdminMetricsResponse.RedisHealth.builder()
                    .usedMemory(info.getProperty("used_memory_human", "0B"))
                    .connectedClients(Long.parseLong(info.getProperty("connected_clients", "0")))
                    .opsPerSec(Long.parseLong(info.getProperty("instantaneous_ops_per_sec", "0")))
                    .build();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch Redis info", e);
        }

        // Mongo Health
        AdminMetricsResponse.MongoHealth mongoHealth = null;
        try {
            org.bson.Document serverStatus = mongoTemplate.executeCommand("{ serverStatus: 1 }");
            org.bson.Document connections = (org.bson.Document) serverStatus.get("connections");
            org.bson.Document opcounters = (org.bson.Document) serverStatus.get("opcounters");
            long activeMongoConnections = connections != null ? connections.getInteger("current", 0) : 0;
            long queries = opcounters != null ? opcounters.getInteger("query", 0) : 0;
            
            mongoHealth = AdminMetricsResponse.MongoHealth.builder()
                .activeConnections(activeMongoConnections)
                .queriesPerSec(queries)
                .dbName(mongoTemplate.getDb().getName())
                .build();
        } catch (Exception e) {
            log.warn("Failed to fetch Mongo stats", e);
        }

        // Recent Users
        List<AdminUserDto> recentUsers = userRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")))
            .stream().map(user -> AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .build()).toList();

        AdminMetricsResponse response = AdminMetricsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalTransactions(totalTransactions)
                .totalAccounts(totalAccounts)
                .monthlySignups(monthlySignups)
                .monthlyTransactions(monthlyTransactions)
                .historicalInfraMetrics(historicalInfraMetrics)
                .systemHealth(systemHealth)
                .databaseHealth(databaseHealth)
                .redisHealth(redisHealth)
                .mongoHealth(mongoHealth)
                .recentUsers(recentUsers)
                .build();

        // Cache in Redis for 15 minutes
        try {
            redisTemplate.opsForValue().set(METRICS_CACHE_KEY + "_full", objectMapper.writeValueAsString(response), 15, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to cache admin metrics in Redis", e);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserDto> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(user -> AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .build());
    }

    @Transactional
    public void toggleUserSuspend(UUID userId, String adminIdStr) {
        User admin = userRepository.findById(UUID.fromString(adminIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        String adminEmail = admin.getEmail();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Prevent admin from suspending themselves
        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new IllegalArgumentException("Cannot suspend your own account");
        }

        boolean newStatus = !user.getIsActive();
        user.setIsActive(newStatus);
        userRepository.save(user);

        // Invalidate metrics cache
        redisTemplate.delete(METRICS_CACHE_KEY + "_full");

        // Audit Log
        String action = newStatus ? "ACTIVATED_USER" : "SUSPENDED_USER";
        logAdminAction(adminEmail, user.getEmail(), action, "User " + (newStatus ? "activated" : "suspended"));
    }

    @Transactional
    public void updateUserRole(UUID userId, String newRole, String adminIdStr) {
        if (!newRole.equals("ADMIN") && !newRole.equals("USER")) {
            throw new IllegalArgumentException("Invalid role");
        }

        User admin = userRepository.findById(UUID.fromString(adminIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        String adminEmail = admin.getEmail();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new IllegalArgumentException("Cannot change your own role");
        }

        user.setRole(newRole);
        userRepository.save(user);

        // Audit Log
        String action = newRole.equals("ADMIN") ? "PROMOTED_TO_ADMIN" : "REVOKED_ADMIN";
        logAdminAction(adminEmail, user.getEmail(), action, "User role changed to " + newRole);
    }

    @Transactional
    public void deleteUser(UUID userId, String adminIdStr) {
        User admin = userRepository.findById(UUID.fromString(adminIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));
        String adminEmail = admin.getEmail();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new IllegalArgumentException("Cannot delete your own account");
        }

        String targetEmail = user.getEmail();
        userService.forceDeleteUserAccount(userId);

        // Invalidate metrics cache
        redisTemplate.delete(METRICS_CACHE_KEY + "_full");

        logAdminAction(adminEmail, targetEmail, "DELETED_USER", "User account fully deleted");
    }

    public Page<AdminAuditLog> getAuditLogs(Pageable pageable) {
        return adminAuditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    private void logAdminAction(String adminEmail, String targetEmail, String action, String details) {
        AdminAuditLog logEntry = AdminAuditLog.builder()
                .adminEmail(adminEmail)
                .targetUserEmail(targetEmail)
                .action(action)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        adminAuditLogRepository.save(logEntry);
    }
}
