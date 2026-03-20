package com.hospital.pharmacy.application.dto.medication;

public record MedicationResponse(
        Long id,
        String medicationId,
        String tradeName,
        String activeIngredient,
        String dosageForm,
        String strength,
        String administrationRoute,
        String atcCode,
        String drugGroup,
        String contraindications,
        boolean active
) {
}
