package com.hospital.pharmacy.application.dto.patient;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record PatientRequest(
        @NotBlank String patientId,
        @NotBlank String fullName,
        @NotNull LocalDate dateOfBirth,
        @NotBlank String gender,
        String phoneNumber,
        String insuranceId
) {
}
