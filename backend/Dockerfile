# Single-stage build and runtime Dockerfile for Spring Boot backend
FROM maven:3.9-eclipse-temurin-25

WORKDIR /app

# Copy pom.xml and download dependencies for caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and compile inside container (no local JAR needed)
COPY src ./src
RUN mvn clean package -DskipTests && \
    cp target/*.jar app.jar && \
    mkdir -p /app/logs

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
