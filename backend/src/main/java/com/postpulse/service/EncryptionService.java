package com.postpulse.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM Authenticated Encryption Utility for Social Platform OAuth Credentials.
 * Uses a 96-bit (12-byte) initialization vector (IV) and 128-bit authentication tag.
 */
@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public EncryptionService(@Value("${app.security.aes-secret-key}") String rawKey) {
        byte[] keyBytes = rawKey.getBytes(StandardCharsets.UTF_8);
        byte[] validKey = new byte[32]; // 256 bits
        System.arraycopy(keyBytes, 0, validKey, 0, Math.min(keyBytes.length, 32));
        this.secretKey = new SecretKeySpec(validKey, "AES");
    }

    public String encrypt(String plainText) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Format: Base64(IV):Base64(CipherTextWithTag)
            String encodedIv = Base64.getEncoder().encodeToString(iv);
            String encodedCipher = Base64.getEncoder().encodeToString(cipherText);

            return encodedIv + ":" + encodedCipher;
        } catch (Exception e) {
            throw new RuntimeException("AES-GCM encryption failed: " + e.getMessage(), e);
        }
    }

    public String decrypt(String encryptedBlob) {
        try {
            String[] parts = encryptedBlob.split(":");
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid encrypted credential blob format");
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] cipherText = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("AES-GCM decryption failed: " + e.getMessage(), e);
        }
    }
}
