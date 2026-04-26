package com.tng.ekyc.kyc.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.rekognition.RekognitionClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.textract.TextractClient;

import java.net.URI;

@Configuration
public class AwsConfig {

    @Value("${aws.region:ap-southeast-1}")
    private String region;

    @Value("${aws.access-key-id}")
    private String accessKeyId;

    @Value("${aws.secret-access-key}")
    private String secretAccessKey;

    @Value("${aws.session-token:}")
    private String sessionToken;

    @Value("${aws.dynamodb.endpoint:}")
    private String dynamoEndpoint;

    private AwsCredentialsProvider credentials() {
        if (sessionToken != null && !sessionToken.isBlank()) {
            return StaticCredentialsProvider.create(
                AwsSessionCredentials.create(accessKeyId, secretAccessKey, sessionToken)
            );
        }
        return StaticCredentialsProvider.create(
            AwsBasicCredentials.create(accessKeyId, secretAccessKey)
        );
    }

    @Bean
    public DynamoDbClient dynamoDbClient() {
        var builder = DynamoDbClient.builder()
            .region(Region.of(region))
            .credentialsProvider(credentials());
        if (dynamoEndpoint != null && !dynamoEndpoint.isBlank()) {
            builder.endpointOverride(URI.create(dynamoEndpoint));
        }
        return builder.build();
    }

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(credentials())
            .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        return S3Presigner.builder()
            .region(Region.of(region))
            .credentialsProvider(credentials())
            .build();
    }

    @Bean
    public RekognitionClient rekognitionClient() {
        return RekognitionClient.builder()
            .region(Region.of(region))
            .credentialsProvider(credentials())
            .build();
    }

    @Bean
    public TextractClient textractClient() {
        return TextractClient.builder()
            .region(Region.of(region))
            .credentialsProvider(credentials())
            .build();
    }
}
