package com.tng.ekyc.kyc.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
public class S3Service {

    private static final Logger log = LoggerFactory.getLogger(S3Service.class);

    private final S3Client s3;
    private final S3Presigner presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    public S3Service(S3Client s3, S3Presigner presigner) {
        this.s3 = s3;
        this.presigner = presigner;
    }

    public String uploadDocument(byte[] data, String contentType, String folder) {
        String key = folder + "/" + UUID.randomUUID() + "-" + System.currentTimeMillis();
        s3.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .serverSideEncryption(ServerSideEncryption.AES256)
                .build(),
            RequestBody.fromBytes(data)
        );
        log.info("Uploaded {} to s3://{}/{}", folder, bucket, key);
        return key;
    }

    public byte[] downloadDocument(String key) throws IOException {
        var response = s3.getObjectAsBytes(
            GetObjectRequest.builder().bucket(bucket).key(key).build()
        );
        return response.asByteArray();
    }

    public String getPresignedUrl(String key, Duration expiry) {
        var presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(expiry)
            .getObjectRequest(r -> r.bucket(bucket).key(key))
            .build();
        return presigner.presignGetObject(presignRequest).url().toString();
    }
}
