package com.hospital.pharmacy.application.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AiChatRequest(
        @NotNull Long prescriptionId,
        @NotBlank String message
) {
}
