package com.hospital.pharmacy.application.dto.ai;

import java.util.List;

public record AiPatientSummaryResponse(
        String summary,
        String updatedAt,
        List<String> sources
) {
}
