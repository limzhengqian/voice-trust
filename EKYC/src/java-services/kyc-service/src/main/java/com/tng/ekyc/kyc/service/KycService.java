package com.tng.ekyc.kyc.service;

import com.tng.ekyc.kyc.model.KycApplication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.time.Instant;
import java.util.*;

@Service
public class KycService {

    private static final Logger log = LoggerFactory.getLogger(KycService.class);
    private static final float FACE_SIMILARITY_THRESHOLD = 80f;

    private final DynamoDbClient dynamo;
    private final S3Service s3Service;
    private final RekognitionService rekognitionService;
    private final TextractService textractService;

    @Value("${aws.dynamodb.table:ekyc-applications}")
    private String table;

    public KycService(DynamoDbClient dynamo, S3Service s3Service,
                      RekognitionService rekognitionService, TextractService textractService) {
        this.dynamo = dynamo;
        this.s3Service = s3Service;
        this.rekognitionService = rekognitionService;
        this.textractService = textractService;
    }

    public KycApplication createApplication(String phoneNumber) {
        String applicationId = UUID.randomUUID().toString();
        String now = Instant.now().toString();

        dynamo.putItem(PutItemRequest.builder()
            .tableName(table)
            .item(Map.of(
                "applicationId", AttributeValue.fromS(applicationId),
                "phoneNumber", AttributeValue.fromS(phoneNumber),
                "status", AttributeValue.fromS(KycApplication.Status.PENDING.name()),
                "createdAt", AttributeValue.fromS(now),
                "updatedAt", AttributeValue.fromS(now)
            ))
            .build());

        KycApplication app = new KycApplication();
        app.setApplicationId(applicationId);
        app.setPhoneNumber(phoneNumber);
        app.setStatus(KycApplication.Status.PENDING.name());
        app.setCreatedAt(now);
        return app;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> processIdDocument(String applicationId, byte[] docBytes, String contentType) throws Exception {
        String s3Key = s3Service.uploadDocument(docBytes, contentType, "documents");
        log.info("Document uploaded: {} for application {}", s3Key, applicationId);

        var ocrResult = textractService.analyzeIdDocument(docBytes);
        var faceQuality = rekognitionService.detectFaceQuality(docBytes);

        if (!Boolean.TRUE.equals(faceQuality.get("detected"))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "No face detected in the ID document. Please retake the photo.");
        }

        Map<String, String> fields = (Map<String, String>) ocrResult.get("fields");
        Map<String, AttributeValue> docUpdate = new HashMap<>();
        docUpdate.put("documentS3Key", AttributeValue.fromS(s3Key));
        docUpdate.put("status", AttributeValue.fromS(KycApplication.Status.DOCUMENT_UPLOADED.name()));
        docUpdate.put("updatedAt", AttributeValue.fromS(Instant.now().toString()));
        docUpdate.put("documentFaceDetected", AttributeValue.fromBool(true));
        if (fields != null && !fields.isEmpty()) {
            Map<String, AttributeValue> fieldsAttr = new HashMap<>();
            fields.forEach((k, v) -> fieldsAttr.put(k, AttributeValue.fromS(v)));
            docUpdate.put("extractedFields", AttributeValue.fromM(fieldsAttr));
        }
        updateApplication(applicationId, docUpdate);

        return Map.of("fields", fields, "faceDetected", true);
    }

    public Map<String, Object> processSelfie(String applicationId, byte[] selfieBytes, String contentType) throws Exception {
        KycApplication app = getApplication(applicationId);
        if (app == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        if (!KycApplication.Status.DOCUMENT_UPLOADED.name().equals(app.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Please complete document upload before selfie verification");
        }

        var selfieQuality = rekognitionService.detectFaceQuality(selfieBytes);
        if (!Boolean.TRUE.equals(selfieQuality.get("detected"))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "No face detected in selfie. Please retake the photo.");
        }
        if (!Boolean.TRUE.equals(selfieQuality.get("isAcceptable"))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Selfie quality too low. Please ensure good lighting and look directly at camera.");
        }
        if (!Boolean.TRUE.equals(selfieQuality.get("eyesOpen"))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "Please keep your eyes open and look at the camera.");
        }

        String selfieS3Key = s3Service.uploadDocument(selfieBytes, contentType, "selfies");
        byte[] docBytes = s3Service.downloadDocument(app.getDocumentS3Key());
        var comparison = rekognitionService.compareFaces(selfieBytes, docBytes, FACE_SIMILARITY_THRESHOLD);

        boolean passed = Boolean.TRUE.equals(comparison.get("matched"));
        float similarity = ((Number) comparison.get("similarity")).floatValue();
        String newStatus = passed ? KycApplication.Status.FACE_VERIFIED.name() : KycApplication.Status.REJECTED.name();

        Map<String, AttributeValue> updates = new HashMap<>(Map.of(
            "selfieS3Key", AttributeValue.fromS(selfieS3Key),
            "faceVerificationPassed", AttributeValue.fromBool(passed),
            "status", AttributeValue.fromS(newStatus),
            "updatedAt", AttributeValue.fromS(Instant.now().toString())
        ));
        if (!passed) {
            updates.put("rejectionReason", AttributeValue.fromS(
                String.format("Face similarity %.1f%% below threshold", similarity)));
        }
        updateApplication(applicationId, updates);

        if (passed) finalizeApplication(applicationId);

        return Map.of("passed", passed, "similarity", similarity);
    }

    public boolean validatePoaContent(byte[] docBytes) {
        try {
            var result = textractService.analyzeIdDocument(docBytes);
            String rawText = (String) result.get("rawText");
            return rawText != null && rawText.trim().length() > 30;
        } catch (Exception e) {
            log.warn("POA content validation error, assuming valid: {}", e.getMessage());
            return true;
        }
    }

    public String createLivenessSession(String applicationId) {
        String sessionId = rekognitionService.createLivenessSession();
        updateApplication(applicationId, Map.of(
            "livenessSessionId", AttributeValue.fromS(sessionId)
        ));
        return sessionId;
    }

    public Map<String, Object> verifyLiveness(String applicationId, String sessionId) {
        var result = rekognitionService.getLivenessResult(sessionId);
        updateApplication(applicationId, Map.of(
            "livenessStatus", AttributeValue.fromS(result.get("status").toString()),
            "updatedAt", AttributeValue.fromS(Instant.now().toString())
        ));
        return result;
    }

    public KycApplication getApplication(String applicationId) {
        var result = dynamo.getItem(GetItemRequest.builder()
            .tableName(table)
            .key(Map.of("applicationId", AttributeValue.fromS(applicationId)))
            .build());

        if (!result.hasItem()) return null;

        Map<String, AttributeValue> item = result.item();
        KycApplication app = new KycApplication();
        app.setApplicationId(getString(item, "applicationId"));
        app.setPhoneNumber(getString(item, "phoneNumber"));
        app.setStatus(getString(item, "status"));
        app.setCreatedAt(getString(item, "createdAt"));
        app.setUpdatedAt(getString(item, "updatedAt"));
        app.setCompletedAt(getString(item, "completedAt"));
        app.setDocumentS3Key(getString(item, "documentS3Key"));
        app.setSelfieS3Key(getString(item, "selfieS3Key"));
        if (item.containsKey("faceVerificationPassed")) {
            app.setFaceVerificationPassed(item.get("faceVerificationPassed").bool());
        }
        if (item.containsKey("extractedFields")) {
            Map<String, AttributeValue> fieldMap = item.get("extractedFields").m();
            Map<String, String> extracted = new LinkedHashMap<>();
            fieldMap.forEach((k, v) -> extracted.put(k, v.s()));
            app.setExtractedFields(extracted);
        }
        return app;
    }

    public void finalizeApplication(String applicationId) {
        updateApplication(applicationId, Map.of(
            "status", AttributeValue.fromS(KycApplication.Status.COMPLETED.name()),
            "completedAt", AttributeValue.fromS(Instant.now().toString()),
            "updatedAt", AttributeValue.fromS(Instant.now().toString())
        ));
        log.info("Application {} completed successfully", applicationId);
    }

    private void updateApplication(String applicationId, Map<String, AttributeValue> fields) {
        List<String> expressions = new ArrayList<>();
        Map<String, String> names = new HashMap<>();
        Map<String, AttributeValue> values = new HashMap<>();
        int i = 0;
        for (Map.Entry<String, AttributeValue> entry : fields.entrySet()) {
            expressions.add("#f" + i + " = :v" + i);
            names.put("#f" + i, entry.getKey());
            values.put(":v" + i, entry.getValue());
            i++;
        }
        dynamo.updateItem(UpdateItemRequest.builder()
            .tableName(table)
            .key(Map.of("applicationId", AttributeValue.fromS(applicationId)))
            .updateExpression("SET " + String.join(", ", expressions))
            .expressionAttributeNames(names)
            .expressionAttributeValues(values)
            .build());
    }

    private String getString(Map<String, AttributeValue> item, String key) {
        AttributeValue val = item.get(key);
        return val != null && val.s() != null ? val.s() : null;
    }
}
