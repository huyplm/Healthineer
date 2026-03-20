package com.hospital.pharmacy.application.dto.prescription;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PrescriptionItemRequest(
        @NotNull Long medicationId,
        @NotBlank String dose,
        @NotBlank String frequency,
        @NotNull Integer durationDays,
        @NotBlank String route,
        String instructions
) {
}
