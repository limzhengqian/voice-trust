package com.tng.ekyc.kyc.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.rekognition.RekognitionClient;
import software.amazon.awssdk.services.rekognition.model.*;

import java.util.Map;

@Service
public class RekognitionService {

    private final RekognitionClient rekognition;

    @Value("${aws.s3.bucket}")
    private String bucket;

    public RekognitionService(RekognitionClient rekognition) {
        this.rekognition = rekognition;
    }

    public Map<String, Object> detectFaceQuality(byte[] imageBytes) {
        var result = rekognition.detectFaces(DetectFacesRequest.builder()
            .image(Image.builder().bytes(SdkBytes.fromByteArray(imageBytes)).build())
            .attributes(Attribute.ALL)
            .build());

        if (result.faceDetails().isEmpty()) {
            return Map.of("detected", false, "isAcceptable", false, "eyesOpen", false);
        }

        FaceDetail face = result.faceDetails().get(0);
        float brightness = face.quality() != null ? face.quality().brightness() : 0f;
        float sharpness = face.quality() != null ? face.quality().sharpness() : 0f;

        return Map.of(
            "detected", true,
            "brightness", brightness,
            "sharpness", sharpness,
            "isAcceptable", brightness > 30 && sharpness > 30,
            "faceCount", result.faceDetails().size(),
            "eyesOpen", face.eyesOpen() != null && Boolean.TRUE.equals(face.eyesOpen().value())
        );
    }

    public Map<String, Object> compareFaces(byte[] sourceBytes, byte[] targetBytes, float threshold) {
        var result = rekognition.compareFaces(CompareFacesRequest.builder()
            .sourceImage(Image.builder().bytes(SdkBytes.fromByteArray(sourceBytes)).build())
            .targetImage(Image.builder().bytes(SdkBytes.fromByteArray(targetBytes)).build())
            .similarityThreshold(threshold)
            .build());

        if (result.faceMatches().isEmpty()) {
            return Map.of("matched", false, "similarity", 0f, "confidence", 0f);
        }

        CompareFacesMatch best = result.faceMatches().stream()
            .max((a, b) -> Float.compare(a.similarity(), b.similarity()))
            .orElseThrow();

        return Map.of(
            "matched", best.similarity() >= threshold,
            "similarity", best.similarity(),
            "confidence", best.face().confidence()
        );
    }

    public String createLivenessSession() {
        var result = rekognition.createFaceLivenessSession(
            CreateFaceLivenessSessionRequest.builder()
                .settings(CreateFaceLivenessSessionRequestSettings.builder()
                    .outputConfig(LivenessOutputConfig.builder().s3Bucket(bucket).build())
                    .build())
                .build()
        );
        return result.sessionId();
    }

    public Map<String, Object> getLivenessResult(String sessionId) {
        var result = rekognition.getFaceLivenessSessionResults(
            GetFaceLivenessSessionResultsRequest.builder().sessionId(sessionId).build()
        );
        boolean passed = "SUCCEEDED".equals(result.statusAsString())
            && result.confidence() != null && result.confidence() >= 75f;
        return Map.of(
            "status", result.statusAsString(),
            "confidence", result.confidence() != null ? result.confidence() : 0f,
            "passed", passed
        );
    }
}
