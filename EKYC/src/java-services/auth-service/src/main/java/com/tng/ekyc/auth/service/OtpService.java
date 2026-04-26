package com.tng.ekyc.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_TTL_MS = 5 * 60 * 1000;
    private static final int MAX_ATTEMPTS = 3;

    private final SecureRandom random = new SecureRandom();

    @Value("${spring.profiles.active:production}")
    private String activeProfile;

    private record OtpRecord(String otp, long expiresAt, int attempts) {
        OtpRecord withAttempt() {
            return new OtpRecord(otp, expiresAt, attempts + 1);
        }
    }

    private final Map<String, OtpRecord> store = new ConcurrentHashMap<>();

    public String sendOtp(String phoneNumber) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        store.put(phoneNumber, new OtpRecord(otp, Instant.now().toEpochMilli() + OTP_TTL_MS, 0));

        // Production: replace with AWS SNS or Twilio
        log.info("OTP for {} : {} (dev mode — not sent via SMS)", phoneNumber, otp);

        return "development".equals(activeProfile) ? otp : null;
    }

    public void verifyOtp(String phoneNumber, String otp) {
        OtpRecord record = store.get(phoneNumber);

        if (record == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No OTP requested for this number");
        }
        if (Instant.now().toEpochMilli() > record.expiresAt()) {
            store.remove(phoneNumber);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP expired. Please request a new one.");
        }
        if (record.attempts() >= MAX_ATTEMPTS) {
            store.remove(phoneNumber);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Too many failed attempts. Please request a new OTP.");
        }
        if (!record.otp().equals(otp)) {
            store.put(phoneNumber, record.withAttempt());
            int attemptsLeft = MAX_ATTEMPTS - (record.attempts() + 1);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Invalid OTP. Attempts left: " + attemptsLeft);
        }

        store.remove(phoneNumber);
    }

    @Scheduled(fixedDelay = 60_000)
    void evictExpired() {
        long now = Instant.now().toEpochMilli();
        store.entrySet().removeIf(e -> now > e.getValue().expiresAt());
    }
}
