package com.budgetsetu.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class FileCleanupScheduler {

    private static final Logger logger = LoggerFactory.getLogger(FileCleanupScheduler.class);
    private static final String IMPORT_DIR = "uploads/imports";

    @Value("${FILE_CLEANUP_THRESHOLD_MINUTES}")
    private int cleanupThresholdMinutes;

    // Run interval managed by env (default 300000ms = 5 mins)
    @Scheduled(fixedRateString = "${FILE_CLEANUP_INTERVAL_MS:300000}")
    public void cleanupOldFiles() {
        Path rootPath = Paths.get(IMPORT_DIR);
        if (!Files.exists(rootPath)) {
            return;
        }

        // Threshold: N minutes ago (default 10)
        Instant threshold = Instant.now().minus(cleanupThresholdMinutes, ChronoUnit.MINUTES);

        try {
            Files.walkFileTree(rootPath, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    if (attrs.lastModifiedTime().toInstant().isBefore(threshold)) {
                        Files.delete(file);
                        logger.info("Deleted old uploaded file to prevent junk buildup: {}", file);
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    if (!dir.equals(rootPath)) {
                        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
                            // If the directory is completely empty, clean it up as well
                            if (!stream.iterator().hasNext()) {
                                Files.delete(dir);
                            }
                        }
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            logger.error("Error during scheduled file cleanup", e);
        }
    }
}
