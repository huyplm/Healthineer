package com.hospital.pharmacy.application.dto.ai;

public record AiInventoryForecastItemResponse(
        String medicationId,
        String medicationName,
        Integer daysUntilStockout,
        String expiryRisk,
        String recommendedAction
) {
}
