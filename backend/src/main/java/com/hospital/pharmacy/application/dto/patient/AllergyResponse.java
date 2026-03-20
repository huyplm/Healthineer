package com.hospital.pharmacy.application.dto.patient;

import java.time.LocalDate;

public record AllergyResponse(
        Long id,
        String allergenName,
        String reaction,
        LocalDate firstOccurred
) {
}
