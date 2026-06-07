package com.budgetsetu.security;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Aspect to dynamically set the app.current_user_id session variable in PostgreSQL.
 * This session variable is checked by Row-Level Security (RLS) policies.
 */
@Aspect
@Component
@Slf4j
public class RowLevelSecurityAspect {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Before("execution(* com.budgetsetu.repository.sql..*.*(..))")
    public void setPostgresUserContext() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentSetting = "";

        if (auth != null && auth.isAuthenticated()) {
            Object principal = auth.getPrincipal();
            if (principal instanceof UUID) {
                currentSetting = principal.toString();
            } else if (principal instanceof String) {
                currentSetting = (String) principal;
            }
        }

        try {
            // Execute set_config with parameterization to prevent SQL injection
            jdbcTemplate.queryForObject(
                    "SELECT set_config('app.current_user_id', ?, true)",
                    String.class,
                    currentSetting
            );
        } catch (Exception e) {
            log.warn("Failed to set PostgreSQL app.current_user_id session context: {}", e.getMessage());
        }
    }
}
