package com.hospital.pharmacy.application.dto.patient;

import java.time.LocalDate;

public record PatientResponse(
        Long id,
        String patientId,
        String fullName,
        LocalDate dateOfBirth,
        String gender,
        String phoneNumber,
        String insuranceId
) {
}
