package com.hospital.pharmacy.application.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AiSuggestRequest(
        @NotNull Long patientId,
        @NotBlank String diagnosis
) {
}
