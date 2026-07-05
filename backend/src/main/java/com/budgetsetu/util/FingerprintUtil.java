package com.budgetsetu.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Generates a SHA-256 fingerprint for duplicate detection.
 * Fingerprint = hash(Date + Amount + Reference + Description + AccountId)
 */
public final class FingerprintUtil {

    private FingerprintUtil() {
    }

    public static String generate(String date, String amount, String reference,
            String description, String accountId) {
        String raw = normalize(date) + "|" +
                normalize(amount) + "|" +
                normalize(reference) + "|" +
                normalize(description) + "|" +
                normalize(accountId);
        return sha256(raw);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
