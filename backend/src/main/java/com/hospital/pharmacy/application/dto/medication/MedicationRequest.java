package com.hospital.pharmacy.application.dto.medication;

import jakarta.validation.constraints.NotBlank;

public record MedicationRequest(
        @NotBlank String medicationId,
        @NotBlank String tradeName,
        @NotBlank String activeIngredient,
        String dosageForm,
        String strength,
        String administrationRoute,
        String atcCode,
        String drugGroup,
        String contraindications,
        boolean active
) {
}
