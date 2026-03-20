package com.hospital.pharmacy.application.dto.patient;

public record ConditionResponse(
        Long id,
        String conditionName,
        String severity
) {
}
