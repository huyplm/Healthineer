package com.hospital.pharmacy.application.dto.prescription;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PrescriptionCreateRequest(
        @NotNull Long patientId,
        @NotBlank String department,
        @NotBlank String diagnosis,
        String clinicalNote,
        @Valid List<PrescriptionItemRequest> items
) {
}
