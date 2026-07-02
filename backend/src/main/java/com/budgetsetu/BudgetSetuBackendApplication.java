package com.budgetsetu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BudgetSetuBackendApplication {

	static {
		loadEnv();
	}

	public static void main(String[] args) {
		System.out.println("DEBUG main: MONGODB_URI system property = " + System.getProperty("MONGODB_URI"));
		System.out.println("DEBUG main: MONGODB_URI env var = " + System.getenv("MONGODB_URI"));
		SpringApplication.run(BudgetSetuBackendApplication.class, args);
	}

	public static void loadEnv() {
		try {
			String profile = System.getenv("SPRING_PROFILES_ACTIVE");
			if (profile == null)
				profile = System.getProperty("spring.profiles.active");

			String envFileName = (profile != null && profile.contains("prod")) ? ".env.production" : ".env";
			java.nio.file.Path envPath = Paths.get(envFileName).toAbsolutePath();
			System.out.println("BudgetSetu Env Loader: Looking for " + envFileName + " file at: " + envPath);
			if (Files.exists(envPath)) {
				System.out.println("BudgetSetu Env Loader: Found " + envFileName + " file, loading properties...");
				List<String> lines = Files.readAllLines(envPath);
				for (String line : lines) {
					line = line.trim();
					if (line.isEmpty() || line.startsWith("#")) {
						continue;
					}
					int eqIdx = line.indexOf('=');
					if (eqIdx > 0) {
						String key = line.substring(0, eqIdx).trim();
						String value = line.substring(eqIdx + 1).trim();
						// Strip quotes if present
						if (value.startsWith("\"") && value.endsWith("\"")) {
							value = value.substring(1, value.length() - 1);
						} else if (value.startsWith("'") && value.endsWith("'")) {
							value = value.substring(1, value.length() - 1);
						}
						System.setProperty(key, value);
						// Map to Spring Boot standard keys
						if ("POSTGRES_URL".equals(key))
							System.setProperty("spring.datasource.url", value);
						if ("POSTGRES_USER".equals(key))
							System.setProperty("spring.datasource.username", value);
						if ("POSTGRES_PASSWORD".equals(key))
							System.setProperty("spring.datasource.password", value);
						if ("MONGODB_URI".equals(key)) {
							System.setProperty("spring.data.mongodb.uri", value);
							System.setProperty("spring.mongodb.uri", value);
						}
						if ("MONGODB_DATABASE".equals(key)) {
							System.setProperty("spring.data.mongodb.database", value);
							System.setProperty("spring.mongodb.database", value);
						}
						if ("REDIS_HOST".equals(key)) {
							System.setProperty("spring.data.redis.host", value);
							System.setProperty("spring.redis.host", value);
						}
						if ("REDIS_URL".equals(key)) {
							System.setProperty("spring.data.redis.url", value);
							System.setProperty("spring.redis.url", value);
						}
						if ("REDIS_PORT".equals(key)) {
							System.setProperty("spring.data.redis.port", value);
							System.setProperty("spring.redis.port", value);
						}
						if ("REDIS_USERNAME".equals(key)) {
							System.setProperty("spring.data.redis.username", value);
							System.setProperty("spring.redis.username", value);
						}
						if ("REDIS_PASSWORD".equals(key)) {
							System.setProperty("spring.data.redis.password", value);
							System.setProperty("spring.redis.password", value);
						}
						if ("MAIL_HOST".equals(key))
							System.setProperty("spring.mail.host", value);
						if ("MAIL_PORT".equals(key))
							System.setProperty("spring.mail.port", value);
						if ("MAIL_USERNAME".equals(key))
							System.setProperty("spring.mail.username", value);
						if ("MAIL_PASSWORD".equals(key))
							System.setProperty("spring.mail.password", value);
						System.out.println("BudgetSetu Env Loader: Set property: " + key);
					}
				}
			} else {
				System.out.println("BudgetSetu Env Loader: WARNING: .env file NOT found at: " + envPath);
			}
		} catch (IOException e) {
			System.err.println("BudgetSetu Env Loader: Could not load .env file: " + e.getMessage());
		}
	}
}
