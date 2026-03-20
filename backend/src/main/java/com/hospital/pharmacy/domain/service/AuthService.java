package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.application.dto.auth.AuthResponse;
import com.hospital.pharmacy.application.dto.auth.LoginRequest;
import com.hospital.pharmacy.domain.model.User;
import com.hospital.pharmacy.domain.repository.UserRepository;
import com.hospital.pharmacy.infrastructure.security.JwtService;
import com.hospital.pharmacy.presentation.exception.BusinessRuleViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameAndActiveTrue(request.username())
                .orElseThrow(() -> new BusinessRuleViolationException("Invalid username or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessRuleViolationException("Invalid username or password");
        }
        String token = jwtService.generate(user);
        return new AuthResponse(token, "Bearer", user.getId(), user.getUsername(), user.getFullName(), user.getRole());
    }
}
