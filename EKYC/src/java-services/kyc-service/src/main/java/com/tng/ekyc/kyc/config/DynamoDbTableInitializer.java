package com.tng.ekyc.kyc.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

@Configuration
public class DynamoDbTableInitializer {

    private static final Logger log = LoggerFactory.getLogger(DynamoDbTableInitializer.class);

    @Value("${aws.dynamodb.table:ekyc-application}")
    private String tableName;

    @Value("${aws.dynamodb.endpoint:}")
    private String dynamoEndpoint;

    @Bean
    public ApplicationRunner createTableIfNotExists(DynamoDbClient dynamo) {
        return args -> {
            if (dynamoEndpoint == null || dynamoEndpoint.isBlank()) return;
            try {
                dynamo.describeTable(r -> r.tableName(tableName));
                log.info("DynamoDB table '{}' already exists", tableName);
            } catch (ResourceNotFoundException e) {
                dynamo.createTable(CreateTableRequest.builder()
                    .tableName(tableName)
                    .attributeDefinitions(AttributeDefinition.builder()
                        .attributeName("applicationId")
                        .attributeType(ScalarAttributeType.S)
                        .build())
                    .keySchema(KeySchemaElement.builder()
                        .attributeName("applicationId")
                        .keyType(KeyType.HASH)
                        .build())
                    .billingMode(BillingMode.PAY_PER_REQUEST)
                    .build());
                log.info("Created DynamoDB table '{}'", tableName);
            }
        };
    }
}
