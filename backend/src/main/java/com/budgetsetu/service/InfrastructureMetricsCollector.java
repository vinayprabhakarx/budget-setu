package com.budgetsetu.service;

import com.budgetsetu.model.sql.InfrastructureMetric;
import com.budgetsetu.repository.sql.InfrastructureMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class InfrastructureMetricsCollector {

    private final InfrastructureMetricRepository metricRepository;
    private final StringRedisTemplate redisTemplate;
    private final JdbcTemplate jdbcTemplate;
    private final MongoTemplate mongoTemplate;

    @Scheduled(cron = "0 0 * * * *") // Run at the top of every hour
    @Transactional
    public void collectMetrics() {
        log.info("Collecting hourly infrastructure metrics...");

        // 1. CPU & Memory
        double cpuLoad = 0.0;
        try {
            com.sun.management.OperatingSystemMXBean osBean = ManagementFactory
                    .getPlatformMXBean(com.sun.management.OperatingSystemMXBean.class);
            cpuLoad = osBean.getProcessCpuLoad() * 100;
            if (cpuLoad < 0)
                cpuLoad = 0;
        } catch (Exception e) {
            log.warn("Could not read CPU load", e);
        }

        Runtime runtime = Runtime.getRuntime();
        double usedMemMb = (runtime.totalMemory() - runtime.freeMemory()) / (1024.0 * 1024.0);

        // 2. Postgres
        int pgConnections = 0;
        try {
            Map<String, Object> pgStats = jdbcTemplate
                    .queryForMap("SELECT sum(numbackends) as connections FROM pg_stat_database");
            if (pgStats.get("connections") != null) {
                pgConnections = ((Number) pgStats.get("connections")).intValue();
            }
        } catch (Exception e) {
            log.warn("Could not read Postgres stats", e);
        }

        // 3. Redis
        int redisClients = 0;
        try {
            java.util.Properties info = redisTemplate.getConnectionFactory().getConnection().serverCommands().info();
            if (info != null) {
                redisClients = Integer.parseInt(info.getProperty("connected_clients", "0"));
            }
        } catch (Exception e) {
            log.warn("Could not read Redis stats", e);
        }

        // 4. MongoDB
        int mongoConnections = 0;
        try {
            org.bson.Document serverStatus = mongoTemplate.executeCommand("{ serverStatus: 1 }");
            org.bson.Document connections = (org.bson.Document) serverStatus.get("connections");
            if (connections != null) {
                mongoConnections = connections.getInteger("current", 0);
            }
        } catch (Exception e) {
            log.warn("Could not read Mongo stats", e);
        }

        InfrastructureMetric metric = InfrastructureMetric.builder()
                .recordedAt(LocalDateTime.now())
                .cpuUsagePercent(cpuLoad)
                .memoryUsedMb(usedMemMb)
                .pgActiveConnections(pgConnections)
                .redisConnectedClients(redisClients)
                .mongoActiveConnections(mongoConnections)
                .build();

        metricRepository.save(metric);
        log.info("Saved infrastructure metric snapshot.");
    }
}
