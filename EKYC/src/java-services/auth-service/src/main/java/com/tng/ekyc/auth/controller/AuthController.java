package com.tng.ekyc.auth.controller;

import com.tng.ekyc.auth.dto.SendOtpRequest;
import com.tng.ekyc.auth.dto.VerifyOtpRequest;
import com.tng.ekyc.auth.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final OtpService otpService;

    public AuthController(OtpService otpService) {
        this.otpService = otpService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "service", "auth",
            "status", "ok",
            "timestamp", Instant.now().toString()
        ));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@Valid @RequestBody SendOtpRequest req) {
        String devOtp = otpService.sendOtp(req.phoneNumber());
        Map<String, Object> body = new HashMap<>();
        body.put("success", true);
        body.put("message", "OTP sent to your phone number");
        if (devOtp != null) body.put("devOtp", devOtp);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        otpService.verifyOtp(req.phoneNumber(), req.otp());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Phone number verified"
        ));
    }
}
