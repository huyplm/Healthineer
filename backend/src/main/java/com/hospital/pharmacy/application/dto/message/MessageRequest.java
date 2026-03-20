package com.hospital.pharmacy.application.dto.message;

import jakarta.validation.constraints.NotBlank;

public record MessageRequest(
        @NotBlank String content,
        @NotBlank String messageType
) {
}
