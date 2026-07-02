# Multi-stage build for Spring Boot backend

# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-25 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:25-jre-noble

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=prod \
    PORT=8080 \
    JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC"

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Run the application (shell form to expand JAVA_OPTS)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
