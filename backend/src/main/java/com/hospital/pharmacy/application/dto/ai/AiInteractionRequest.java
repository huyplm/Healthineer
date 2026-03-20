package com.hospital.pharmacy.application.dto.ai;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AiInteractionRequest(
        @NotNull Long patientId,
        @NotNull List<Long> medications
) {
}
