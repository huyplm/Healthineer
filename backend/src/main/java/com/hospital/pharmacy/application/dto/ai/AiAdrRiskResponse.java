package com.hospital.pharmacy.application.dto.ai;

import java.util.List;

public record AiAdrRiskResponse(
        String level,
        Integer score,
        List<String> factors
) {
}
