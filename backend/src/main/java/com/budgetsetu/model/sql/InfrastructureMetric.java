package com.budgetsetu.model.sql;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "infrastructure_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InfrastructureMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @Column(name = "cpu_usage_percent", nullable = false, columnDefinition = "NUMERIC(5,2)")
    private Double cpuUsagePercent;

    @Column(name = "memory_used_mb", nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double memoryUsedMb;

    @Column(name = "pg_active_connections", nullable = false)
    private Integer pgActiveConnections;

    @Column(name = "redis_connected_clients", nullable = false)
    private Integer redisConnectedClients;

    @Column(name = "mongo_active_connections", nullable = false)
    private Integer mongoActiveConnections;
}
