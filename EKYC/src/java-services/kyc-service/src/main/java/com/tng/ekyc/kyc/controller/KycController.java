package com.tng.ekyc.kyc.controller;

import com.tng.ekyc.kyc.dto.CreateApplicationRequest;
import com.tng.ekyc.kyc.model.KycApplication;
import com.tng.ekyc.kyc.service.KycService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/kyc")
public class KycController {

    private final KycService kycService;

    public KycController(KycService kycService) {
        this.kycService = kycService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "service", "kyc",
            "status", "ok",
            "timestamp", Instant.now().toString()
        ));
    }

    @PostMapping("/application")
    public ResponseEntity<Map<String, Object>> createApplication(
            @Valid @RequestBody CreateApplicationRequest req) throws Exception {
        KycApplication app = kycService.createApplication(req.phoneNumber());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("success", true, "applicationId", app.getApplicationId()));
    }

    @PostMapping(value = "/application/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable String id,
            @RequestPart("document") MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document image is required");
        }
        validateImageType(file);
        var result = kycService.processIdDocument(id, file.getBytes(), file.getContentType());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "extractedFields", result.get("fields"),
            "faceDetected", result.get("faceDetected")
        ));
    }

    @PostMapping(value = "/application/{id}/selfie", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadSelfie(
            @PathVariable String id,
            @RequestPart("selfie") MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selfie image is required");
        }
        validateImageType(file);
        var result = kycService.processSelfie(id, file.getBytes(), file.getContentType());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "passed", result.get("passed"),
            "similarity", result.get("similarity")
        ));
    }

    @PostMapping(value = "/application/{id}/poa-validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> validatePoa(
            @PathVariable String id,
            @RequestPart("document") MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document is required");
        }
        if ("application/pdf".equals(file.getContentType())) {
            return ResponseEntity.ok(Map.of("valid", true));
        }
        validateImageType(file);
        boolean valid = kycService.validatePoaContent(file.getBytes());
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    @PostMapping("/application/{id}/finalize")
    public ResponseEntity<Map<String, Object>> finalizeApplication(@PathVariable String id) {
        KycApplication app = kycService.getApplication(id);
        if (app == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
        kycService.finalizeApplication(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/application/{id}/liveness-session")
    public ResponseEntity<Map<String, Object>> createLivenessSession(@PathVariable String id) throws Exception {
        String sessionId = kycService.createLivenessSession(id);
        return ResponseEntity.ok(Map.of("success", true, "sessionId", sessionId));
    }

    @GetMapping("/application/{id}/liveness-result/{sessionId}")
    public ResponseEntity<Map<String, Object>> getLivenessResult(
            @PathVariable String id,
            @PathVariable String sessionId) throws Exception {
        var result = kycService.verifyLiveness(id, sessionId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.putAll(result);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/application/{id}")
    public ResponseEntity<Map<String, Object>> getApplication(@PathVariable String id) {
        KycApplication app = kycService.getApplication(id);
        if (app == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
        Map<String, Object> safe = new LinkedHashMap<>();
        safe.put("applicationId", app.getApplicationId());
        safe.put("status", app.getStatus());
        safe.put("extractedFields", app.getExtractedFields());
        safe.put("faceVerificationPassed", app.getFaceVerificationPassed());
        safe.put("completedAt", app.getCompletedAt());
        safe.put("createdAt", app.getCreatedAt());
        return ResponseEntity.ok(Map.of("success", true, "application", safe));
    }

    private void validateImageType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.matches("image/(jpeg|jpg|png|webp)")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG/PNG/WebP images allowed");
        }
    }
}
