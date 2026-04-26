package com.tng.ekyc.kyc.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.textract.TextractClient;
import software.amazon.awssdk.services.textract.model.*;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TextractService {

    private static final Logger log = LoggerFactory.getLogger(TextractService.class);

    private final TextractClient textract;

    public TextractService(TextractClient textract) {
        this.textract = textract;
    }

    public Map<String, Object> analyzeIdDocument(byte[] imageBytes) {
        log.info("Calling Textract analyzeDocument, image size: {} bytes", imageBytes.length);
        AnalyzeDocumentResponse result;
        try {
            result = textract.analyzeDocument(AnalyzeDocumentRequest.builder()
                .document(Document.builder().bytes(SdkBytes.fromByteArray(imageBytes)).build())
                .featureTypes(FeatureType.FORMS, FeatureType.TABLES)
                .build());
        } catch (Exception e) {
            log.error("Textract analyzeDocument failed: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            throw e;
        }

        List<Block> blocks = result.blocks();
        String rawText = blocks.stream()
            .filter(b -> b.blockType() == BlockType.LINE)
            .map(Block::text)
            .filter(Objects::nonNull)
            .collect(Collectors.joining("\n"));

        log.info("Textract extracted {} blocks, raw text length: {}", blocks.size(), rawText.length());
        log.debug("Raw text: {}", rawText.replace("\n", " | "));
        Map<String, String> fields = parseMyKadFields(rawText);
        if (fields.isEmpty()) {
            log.warn("No fields parsed from raw text. First 200 chars: [{}]", rawText.substring(0, Math.min(200, rawText.length())));
        } else {
            fields.forEach((key, value) -> log.info("Parsed field [{}] = {}", key, value));
        }
        return Map.of("rawText", rawText, "fields", fields);
    }

    private Map<String, String> parseMyKadFields(String rawText) {
        Map<String, String> fields = new LinkedHashMap<>();
        String[] lines = Arrays.stream(rawText.split("\n"))
            .map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);

        // IC number: try with hyphens first, then without (Textract sometimes omits them)
        var icWithHyphens = java.util.regex.Pattern.compile("\\d{6}-\\d{2}-\\d{4}").matcher(rawText);
        if (icWithHyphens.find()) {
            fields.put("icNumber", icWithHyphens.group());
        } else {
            // Fallback: 12 consecutive digits — format as XXXXXX-XX-XXXX
            var icNoHyphens = java.util.regex.Pattern.compile("\\b(\\d{6})(\\d{2})(\\d{4})\\b").matcher(rawText);
            if (icNoHyphens.find()) {
                fields.put("icNumber", icNoHyphens.group(1) + "-" + icNoHyphens.group(2) + "-" + icNoHyphens.group(3));
            }
        }

        // Full name — line after "Nama" / "Name"
        for (int i = 0; i < lines.length - 1; i++) {
            if (lines[i].toLowerCase().matches(".*\\bnam[ae]\\b.*")) {
                String candidate = lines[i + 1].trim();
                if (candidate.length() > 3 && candidate.matches("[A-Za-z /@'.-]+")) {
                    fields.put("fullName", candidate);
                    break;
                }
            }
        }

        // Date of birth — explicit DD-MM-YYYY pattern in raw text
        var dobMatcher = java.util.regex.Pattern.compile("\\b(\\d{2})[.\\-/](\\d{2})[.\\-/](\\d{4})\\b").matcher(rawText);
        if (dobMatcher.find()) fields.put("dateOfBirth", dobMatcher.group());

        // Address — lines after "Alamat" / "Address" / "ALAMAT"
        for (int i = 0; i < lines.length; i++) {
            String lower = lines[i].toLowerCase();
            if (lower.equals("alamat") || lower.equals("address") || lower.startsWith("alamat ") || lower.startsWith("address ")) {
                List<String> addrLines = new ArrayList<>();
                for (int j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                    String ln = lines[j].trim();
                    if (ln.isEmpty() || ln.toLowerCase().matches("(nama|name|negeri|state|warganegara.*)")) break;
                    addrLines.add(ln);
                }
                if (!addrLines.isEmpty()) fields.put("address", String.join(", ", addrLines));
                break;
            }
        }

        // Derive gender and DOB from IC digits (most reliable source)
        if (fields.containsKey("icNumber")) {
            String digits = fields.get("icNumber").replace("-", "");
            if (digits.length() == 12) {
                String yearPrefix = Integer.parseInt(digits.substring(0, 2)) > 25 ? "19" : "20";
                fields.putIfAbsent("dateOfBirth",
                    digits.substring(4, 6) + "/" + digits.substring(2, 4) + "/" + yearPrefix + digits.substring(0, 2));
                int lastDigit = Character.getNumericValue(digits.charAt(11));
                fields.put("gender", lastDigit % 2 == 0 ? "Female" : "Male");
            }
        }

        return fields;
    }
}
