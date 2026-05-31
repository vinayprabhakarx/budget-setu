package com.budgetsetu.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminMetricsResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalTransactions;
    private long totalAccounts;
    
    private List<MonthlyStat> monthlySignups;
    private List<MonthlyStat> monthlyTransactions;
    private List<HistoricalInfraStat> historicalInfraMetrics;
    private SystemHealth systemHealth;
    private DatabaseHealth databaseHealth;
    private RedisHealth redisHealth;
    private MongoHealth mongoHealth;
    private List<AdminUserDto> recentUsers;

    @Data
    @Builder
    public static class MonthlyStat {
        private String month;
        private long count;
    }

    @Data
    @Builder
    public static class HistoricalInfraStat {
        private String date;
        private double avgCpu;
        private double avgMem;
        private int avgPgConns;
        private int avgRedisClients;
        private int avgMongoConns;
    }

    @Data
    @Builder
    public static class SystemHealth {
        private double cpuUsagePercent;
        private long usedMemoryBytes;
        private long totalMemoryBytes;
        private long freeMemoryBytes;
        private long maxMemoryBytes;
    }

    @Data
    @Builder
    public static class DatabaseHealth {
        private long activeConnections;
        private long totalCommits;
        private double cacheHitRatio;
    }

    @Data
    @Builder
    public static class RedisHealth {
        private String usedMemory;
        private long connectedClients;
        private long opsPerSec;
    }

    @Data
    @Builder
    public static class MongoHealth {
        private long activeConnections;
        private long queriesPerSec;
        private String dbName;
    }
}
