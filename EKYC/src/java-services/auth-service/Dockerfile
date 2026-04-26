# Build stage — uses official Gradle image (no need for local Gradle install)
FROM --platform=linux/amd64 gradle:8.7-jdk21-alpine AS build
ENV GRADLE_OPTS="-Dorg.gradle.native=false"
WORKDIR /build

# Copy all build files first for dependency cache layer
COPY settings.gradle build.gradle ./
COPY auth-service/build.gradle auth-service/
COPY kyc-service/build.gradle kyc-service/
COPY api-gateway/build.gradle api-gateway/
RUN gradle :auth-service:dependencies --no-daemon -q

# Copy source and build fat jar
COPY auth-service/src auth-service/src
RUN gradle :auth-service:bootJar --no-daemon -q

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /build/auth-service/build/libs/*.jar app.jar

EXPOSE 3001
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
