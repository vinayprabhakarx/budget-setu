package com.budgetsetu.repository.sql;

import com.budgetsetu.model.sql.InfrastructureMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface InfrastructureMetricRepository extends JpaRepository<InfrastructureMetric, UUID> {

    // Group by day for the last 30 days
    @Query(value = "SELECT " +
            "DATE(recorded_at) as date, " +
            "AVG(cpu_usage_percent) as avgCpu, " +
            "AVG(memory_used_mb) as avgMem, " +
            "AVG(pg_active_connections) as avgPg, " +
            "AVG(redis_connected_clients) as avgRedis, " +
            "AVG(mongo_active_connections) as avgMongo " +
            "FROM infrastructure_metrics " +
            "WHERE recorded_at >= :since " +
            "GROUP BY DATE(recorded_at) " +
            "ORDER BY DATE(recorded_at) ASC", nativeQuery = true)
    List<Object[]> getDailyAveragesSince(LocalDateTime since);
}
