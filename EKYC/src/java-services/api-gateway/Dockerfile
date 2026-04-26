# Build stage
FROM --platform=linux/amd64 gradle:8.7-jdk21-alpine AS build
ENV GRADLE_OPTS="-Dorg.gradle.native=false"
WORKDIR /build

COPY settings.gradle build.gradle ./
COPY auth-service/build.gradle auth-service/
COPY kyc-service/build.gradle kyc-service/
COPY api-gateway/build.gradle api-gateway/
RUN gradle :api-gateway:dependencies --no-daemon -q

COPY api-gateway/src api-gateway/src
RUN gradle :api-gateway:bootJar --no-daemon -q

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /build/api-gateway/build/libs/*.jar app.jar

EXPOSE 3000
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
