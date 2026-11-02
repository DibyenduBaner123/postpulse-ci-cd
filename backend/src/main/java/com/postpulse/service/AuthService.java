package com.postpulse.service;

import com.postpulse.dto.AuthResponse;
import com.postpulse.dto.LoginRequest;
import com.postpulse.dto.RegisterRequest;
import com.postpulse.dto.UserResponse;
import com.postpulse.entity.RefreshToken;
import com.postpulse.entity.User;
import com.postpulse.repository.RefreshTokenRepository;
import com.postpulse.repository.UserRepository;
import com.postpulse.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(AuthService::invalidCredentials);
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is inactive");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email address is already registered");
        }
        User user = User.builder().id("usr_" + UUID.randomUUID()).name(request.getName().trim())
                .email(email).passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.EDITOR).department(request.getDepartment() == null || request.getDepartment().isBlank()
                        ? "General" : request.getDepartment().trim())
                .isActive(true).build();
        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(String rawToken) {
        RefreshToken existing = refreshTokenRepository.findByToken(rawToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (!existing.getExpiresAt().isAfter(Instant.now())) {
            refreshTokenRepository.delete(existing);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }
        User user = existing.getUser();
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            refreshTokenRepository.delete(existing);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is inactive");
        }
        refreshTokenRepository.delete(existing);
        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokenRepository.deleteByToken(rawToken);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is inactive");
        }
        return UserResponse.from(user);
    }

    private AuthResponse issueTokens(User user) {
        byte[] bytes = new byte[48];
        SECURE_RANDOM.nextBytes(bytes);
        String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokenRepository.save(RefreshToken.builder().token(refreshToken).user(user)
                .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs)).build());
        return new AuthResponse(jwtTokenProvider.generateToken(user), refreshToken, UserResponse.from(user));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}
