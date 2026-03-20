package com.hospital.pharmacy.application.dto.prescription;

import com.hospital.pharmacy.domain.model.PrescriptionStatus;

import java.time.LocalDateTime;
import java.util.List;

public record PrescriptionResponse(
        Long id,
        String prescriptionId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String department,
        String diagnosis,
        String clinicalNote,
        PrescriptionStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<PrescriptionItemResponse> items
) {
}
