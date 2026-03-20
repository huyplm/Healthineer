package com.hospital.pharmacy.application.dto.inventory;

import java.time.LocalDate;

public record InventoryBatchResponse(
        Long id,
        Long medicationId,
        String medicationName,
        String location,
        String batchNumber,
        LocalDate expiryDate,
        LocalDate manufactureDate,
        Integer quantity,
        Integer unitCost
) {
}
