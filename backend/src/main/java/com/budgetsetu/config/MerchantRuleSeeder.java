package com.budgetsetu.config;

import com.budgetsetu.model.mongo.MerchantRule;
import com.budgetsetu.repository.mongo.MerchantRuleRepository;
import com.budgetsetu.repository.sql.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Seeds the merchant_rules MongoDB collection from merchant-rules.csv on
 * startup.
 * Only runs if no system-wide rules exist yet.
 * No merchant names are hardcoded in Java — all data comes from the CSV
 * resource.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MerchantRuleSeeder implements ApplicationRunner {

    private final MerchantRuleRepository merchantRuleRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        long existing = merchantRuleRepository.countByUserIdIsNull();
        if (existing > 0) {
            log.info("MerchantRuleSeeder: {} system rules already present, skipping seed.", existing);
            return;
        }

        ClassPathResource resource = new ClassPathResource("merchant-rules.csv");
        if (!resource.exists()) {
            log.warn("MerchantRuleSeeder: merchant-rules.csv not found in classpath, skipping.");
            return;
        }

        int seeded = 0;
        int skipped = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

            String header = reader.readLine(); // skip header line
            if (header == null)
                return;

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty())
                    continue;

                String[] parts = line.split(",", 2);
                if (parts.length < 2)
                    continue;

                String keyword = parts[0].trim().toLowerCase();
                String categoryName = parts[1].trim();

                if (keyword.isEmpty() || categoryName.isEmpty())
                    continue;

                // Resolve category by name (case-insensitive, system defaults only)
                var categoryOpt = categoryRepository.findFirstByUserIdIsNullAndNameIgnoreCase(categoryName);
                if (categoryOpt.isEmpty()) {
                    log.debug("MerchantRuleSeeder: Category '{}' not found for keyword '{}', skipping.", categoryName,
                            keyword);
                    skipped++;
                    continue;
                }

                String categoryId = categoryOpt.get().getId().toString();

                MerchantRule rule = MerchantRule.builder()
                        .userId(null) // system-wide
                        .merchantPattern(keyword)
                        .matchType("CONTAINS")
                        .categoryId(categoryId)
                        .source("SYSTEM")
                        .build();

                merchantRuleRepository.save(rule);
                seeded++;
            }
        }

        log.info("MerchantRuleSeeder: Seeded {} system merchant rules ({} skipped due to missing category).", seeded,
                skipped);
    }
}
