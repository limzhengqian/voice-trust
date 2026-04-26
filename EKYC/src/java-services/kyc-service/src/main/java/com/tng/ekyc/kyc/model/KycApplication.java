package com.tng.ekyc.kyc.model;

import java.util.Map;

public class KycApplication {

    public enum Status {
        PENDING, DOCUMENT_UPLOADED, FACE_VERIFIED, COMPLETED, REJECTED
    }

    private String applicationId;
    private String phoneNumber;
    private String status;
    private String createdAt;
    private String updatedAt;
    private String completedAt;
    private String documentS3Key;
    private String selfieS3Key;
    private Map<String, String> extractedFields;
    private Boolean faceVerificationPassed;
    private String rejectionReason;
    private String livenessSessionId;

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
    public String getDocumentS3Key() { return documentS3Key; }
    public void setDocumentS3Key(String documentS3Key) { this.documentS3Key = documentS3Key; }
    public String getSelfieS3Key() { return selfieS3Key; }
    public void setSelfieS3Key(String selfieS3Key) { this.selfieS3Key = selfieS3Key; }
    public Map<String, String> getExtractedFields() { return extractedFields; }
    public void setExtractedFields(Map<String, String> extractedFields) { this.extractedFields = extractedFields; }
    public Boolean getFaceVerificationPassed() { return faceVerificationPassed; }
    public void setFaceVerificationPassed(Boolean faceVerificationPassed) { this.faceVerificationPassed = faceVerificationPassed; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getLivenessSessionId() { return livenessSessionId; }
    public void setLivenessSessionId(String livenessSessionId) { this.livenessSessionId = livenessSessionId; }
}
