# Build stage
FROM --platform=linux/amd64 gradle:8.7-jdk21-alpine AS build
ENV GRADLE_OPTS="-Dorg.gradle.native=false"
WORKDIR /build

COPY settings.gradle build.gradle ./
COPY auth-service/build.gradle auth-service/
COPY kyc-service/build.gradle kyc-service/
COPY api-gateway/build.gradle api-gateway/
RUN gradle :kyc-service:dependencies --no-daemon -q

COPY kyc-service/src kyc-service/src
RUN gradle :kyc-service:bootJar --no-daemon -q

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /build/kyc-service/build/libs/*.jar app.jar

EXPOSE 3002
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
