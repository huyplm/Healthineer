package com.hospital.pharmacy.application.dto.auth;

import com.hospital.pharmacy.domain.model.Role;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String username,
        String fullName,
        Role role
) {
}
