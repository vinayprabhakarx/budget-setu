package com.budgetsetu.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility for AES-256-GCM authenticated encryption at rest.
 * Protects database records so system administrators or raw SQL dumps cannot
 * read sensitive financial data.
 */
@Slf4j
@Component
public class AesUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;
    public static final String PREFIX = "enc:v1:";

    private final SecretKeySpec secretKeySpec;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesUtil(
            @Value("${encryption.secret-key:budgetsetu_default_secret_key_do_not_use_in_prod_32b}") String secretKey) {
        try {
            // Hash the configured secret key using SHA-256 to guarantee an exact 256-bit
            // (32-byte) AES key
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(secretKey.getBytes(StandardCharsets.UTF_8));
            this.secretKeySpec = new SecretKeySpec(keyBytes, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize AES-256 key specification", e);
        }
    }

    /**
     * Encrypts plaintext using AES-256-GCM and returns a Base64 encoded string
     * prefixed with enc:v1:
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        if (plaintext.startsWith(PREFIX)) {
            return plaintext; // Already encrypted
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, parameterSpec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Combine IV and ciphertext: [12 bytes IV][ciphertext]
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            String base64Encoded = Base64.getEncoder().encodeToString(byteBuffer.array());
            return PREFIX + base64Encoded;
        } catch (Exception e) {
            log.error("Error occurred during AES encryption at rest", e);
            throw new RuntimeException("Failed to encrypt database record", e);
        }
    }

    /**
     * Decrypts an enc:v1: prefixed Base64 ciphertext back to plaintext.
     * Returns legacy unencrypted strings unmodified to maintain backward
     * compatibility.
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isEmpty() || !ciphertext.startsWith(PREFIX)) {
            return ciphertext; // Return unencrypted legacy data or nulls as is
        }
        try {
            String base64Content = ciphertext.substring(PREFIX.length());
            byte[] decoded = Base64.getDecoder().decode(base64Content);

            if (decoded.length <= IV_LENGTH_BYTES) {
                log.warn("Corrupted ciphertext length for record, returning raw value");
                return ciphertext;
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH_BYTES];
            byteBuffer.get(iv);

            byte[] actualCiphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(actualCiphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, parameterSpec);

            byte[] plainBytes = cipher.doFinal(actualCiphertext);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Error occurred during AES decryption at rest", e);
            return "[ENCRYPTED_DATA]"; // Fallback if decryption key is wrong/changed
        }
    }
}
