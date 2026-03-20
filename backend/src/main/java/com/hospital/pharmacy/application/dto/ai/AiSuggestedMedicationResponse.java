package com.hospital.pharmacy.application.dto.ai;

public record AiSuggestedMedicationResponse(
        Long medicationId,
        String name,
        String dose,
        String frequency,
        Integer durationDays,
        String route,
        String reasoning,
        Double confidence
) {
}
