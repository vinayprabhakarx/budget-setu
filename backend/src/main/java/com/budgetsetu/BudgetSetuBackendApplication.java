package com.budgetsetu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.TimeZone;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BudgetSetuBackendApplication {

	@PostConstruct
	public void init() {
		// Strictly enforce Indian Standard Time globally across the entire app
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
	}

	static {
		loadEnv();
	}

	public static void main(String[] args) {
		if (args != null) {
			for (String arg : args) {
				if (arg.contains("prod")) {
					System.setProperty("spring.profiles.active", "prod");
					break;
				}
			}
		}
		loadEnv();
		System.out.println("DEBUG main: MONGODB_URI system property = " + System.getProperty("MONGODB_URI"));
		System.out.println("DEBUG main: MONGODB_URI env var = " + System.getenv("MONGODB_URI"));
		SpringApplication.run(BudgetSetuBackendApplication.class, args);
	}

	public static void loadEnv() {
		try {
			String profile = System.getenv("SPRING_PROFILES_ACTIVE");
			if (profile == null)
				profile = System.getProperty("spring.profiles.active");
			if (profile == null)
				profile = System.getProperty("spring-boot.run.profiles");

			boolean isTest = (profile != null && profile.contains("test")) ||
					System.getProperty("java.class.path", "").contains("test-classes") ||
					System.getProperty("sun.java.command", "").contains("surefire") ||
					System.getProperty("sun.java.command", "").contains("junit");

			String envFileName = ".env";
			if (isTest) {
				envFileName = ".env.test";
			} else if (profile != null && profile.contains("prod")) {
				envFileName = ".env.production";
			}
			java.nio.file.Path envPath = Paths.get(envFileName).toAbsolutePath();
			if (!Files.exists(envPath) && Files.exists(Paths.get("..", envFileName))) {
				envPath = Paths.get("..", envFileName).toAbsolutePath();
			}
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
						if ("ENCRYPTION_SECRET_KEY".equals(key)) {
							System.setProperty("encryption.secret-key", value);
						}
						System.out.println("BudgetSetu Env Loader: Set property: " + key);
					}
				}
			} else {
				System.out.println("BudgetSetu Env Loader: WARNING: .env file NOT found at: " + envPath);
			}
			applyUriMappings();
		} catch (IOException e) {
			System.err.println("BudgetSetu Env Loader: Could not load .env file: " + e.getMessage());
			applyUriMappings();
		}
	}

	private static void applyUriMappings() {
		// 1. PostgreSQL / Database URL
		String pgUrl = getEnvOrProp("POSTGRES_URL");
		if (pgUrl == null)
			pgUrl = getEnvOrProp("DATABASE_URL");
		if (pgUrl != null && !pgUrl.isEmpty()) {
			String cleanUrl = pgUrl;
			int protoEnd = cleanUrl.indexOf("://");
			if (protoEnd > 0) {
				int atIdx = cleanUrl.indexOf('@', protoEnd + 3);
				if (atIdx > 0) {
					String userInfo = cleanUrl.substring(protoEnd + 3, atIdx);
					int colonIdx = userInfo.indexOf(':');
					if (colonIdx > 0) {
						String user = userInfo.substring(0, colonIdx);
						String pass = userInfo.substring(colonIdx + 1);
						System.setProperty("spring.datasource.username", user);
						System.setProperty("spring.datasource.password", pass);
					} else {
						System.setProperty("spring.datasource.username", userInfo);
					}
					cleanUrl = cleanUrl.substring(0, protoEnd + 3) + cleanUrl.substring(atIdx + 1);
				}
			}
			if (cleanUrl.contains("?")) {
				String[] parts = cleanUrl.split("\\?", 2);
				if (parts.length > 1) {
					String[] params = parts[1].split("&");
					for (String param : params) {
						if (param.startsWith("user=") || param.startsWith("username=")) {
							System.setProperty("spring.datasource.username", param.substring(param.indexOf('=') + 1));
						} else if (param.startsWith("password=")) {
							System.setProperty("spring.datasource.password", param.substring(param.indexOf('=') + 1));
						}
					}
				}
			}
			if (cleanUrl.startsWith("postgres://")) {
				cleanUrl = "postgresql://" + cleanUrl.substring(11);
			}
			if (!cleanUrl.startsWith("jdbc:")) {
				cleanUrl = "jdbc:" + cleanUrl;
			}
			System.setProperty("spring.datasource.url", cleanUrl);
		}

		// 2. MongoDB URI
		String mongoUri = getEnvOrProp("MONGODB_URI");
		if (mongoUri != null && !mongoUri.isEmpty()) {
			System.setProperty("spring.data.mongodb.uri", mongoUri);
			System.setProperty("spring.mongodb.uri", mongoUri);
		}

		// 3. Redis URL
		String redisUrl = getEnvOrProp("REDIS_URL");
		if (redisUrl != null && !redisUrl.isEmpty()) {
			System.setProperty("spring.data.redis.url", redisUrl);
			System.setProperty("spring.redis.url", redisUrl);
		}
	}

	private static String getEnvOrProp(String key) {
		String val = System.getProperty(key);
		if (val == null || val.isEmpty()) {
			val = System.getenv(key);
		}
		return val;
	}
}
