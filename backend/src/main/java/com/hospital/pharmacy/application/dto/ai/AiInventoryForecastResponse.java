package com.hospital.pharmacy.application.dto.ai;

import java.util.List;

public record AiInventoryForecastResponse(
        List<AiInventoryForecastItemResponse> items,
        AiInventoryForecastSummaryResponse summary
) {
}
