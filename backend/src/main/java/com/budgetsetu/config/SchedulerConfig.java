package com.budgetsetu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableAsync
@EnableScheduling
public class SchedulerConfig {
    // Enables async import jobs and scheduled jobs for alerts/reports.
}
