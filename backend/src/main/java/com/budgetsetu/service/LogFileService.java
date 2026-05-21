package com.budgetsetu.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.RandomAccessFile;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;

@Service
@Slf4j
@RequiredArgsConstructor
public class LogFileService {

    private final JdbcTemplate jdbcTemplate;

    // We assume backend runs from its root dir, so logs are in ./logs/
    private final Path logsDirectory = Paths.get("logs");

    /**
     * Reads the last N lines from a specified log file.
     * Prevents loading multi-megabyte files entirely into memory.
     */
    public List<String> readLastLines(String filename, int maxLines) {
        File file = logsDirectory.resolve(filename).toFile();
        if (!file.exists() || !file.isFile()) {
            return Collections.singletonList("Log file not found: " + filename);
        }

        List<String> lines = new ArrayList<>();
        try (RandomAccessFile randomAccessFile = new RandomAccessFile(file, "r")) {
            long fileLength = randomAccessFile.length();
            long filePointer = fileLength - 1;
            StringBuilder sb = new StringBuilder();

            int readLines = 0;
            while (filePointer != -1 && readLines < maxLines) {
                randomAccessFile.seek(filePointer);
                int readByte = randomAccessFile.readByte();

                if (readByte == 0xA) { // New Line (\n)
                    if (filePointer < fileLength - 1) { // Skip the very last newline
                        lines.add(sb.reverse().toString());
                        sb = new StringBuilder();
                        readLines++;
                    }
                } else if (readByte == 0xD) { // Carriage Return (\r)
                    if (filePointer < fileLength - 1) {
                        randomAccessFile.seek(filePointer + 1);
                        if (randomAccessFile.readByte() != 0xA) { // If not followed by \n
                            lines.add(sb.reverse().toString());
                            sb = new StringBuilder();
                            readLines++;
                        }
                    }
                } else {
                    sb.append((char) readByte);
                }
                filePointer--;
            }
            if (sb.length() > 0) {
                lines.add(sb.reverse().toString());
            }

            Collections.reverse(lines); // Order them from oldest to newest
            return lines;
        } catch (Exception e) {
            log.error("Failed to read log file {}: {}", filename, e.getMessage());
            return Collections.singletonList("Error reading log file: " + e.getMessage());
        }
    }

    public List<String> getApplicationLogs(int maxLines) {
        return readLastLines("application.log", maxLines);
    }

    public List<String> getErrorLogs(int maxLines) {
        return readLastLines("error.log", maxLines);
    }

    /**
     * Queries PostgreSQL for currently active database processes.
     */
    public List<Map<String, Object>> getDatabaseActivity() {
        try {
            String sql = "SELECT pid, usename, application_name, client_addr, backend_start, state, query " +
                         "FROM pg_stat_activity " +
                         "WHERE state IS NOT NULL AND query NOT LIKE '%pg_stat_activity%' " +
                         "ORDER BY backend_start DESC LIMIT 100";
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.error("Failed to query database activity", e);
            Map<String, Object> errorRow = new HashMap<>();
            errorRow.put("error", "Could not fetch database logs: " + e.getMessage());
            return Collections.singletonList(errorRow);
        }
    }
}
