package com.hospital.pharmacy.application.dto.prescription;

public record PrescriptionItemResponse(
        Long id,
        Long medicationId,
        String medicationName,
        String dose,
        String frequency,
        Integer durationDays,
        String route,
        String instructions
) {
}
