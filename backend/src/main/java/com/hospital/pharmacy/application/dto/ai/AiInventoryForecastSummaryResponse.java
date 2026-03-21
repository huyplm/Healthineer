package com.hospital.pharmacy.application.dto.ai;

public record AiInventoryForecastSummaryResponse(
        int atRiskStockout7Days,
        int atRiskStockout30Days,
        int nearExpiryCount
) {
}
