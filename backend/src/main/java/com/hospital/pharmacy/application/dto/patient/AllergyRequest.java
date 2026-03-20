package com.hospital.pharmacy.application.dto.patient;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record AllergyRequest(
        @NotBlank String allergenName,
        String reaction,
        LocalDate firstOccurred
) {
}
