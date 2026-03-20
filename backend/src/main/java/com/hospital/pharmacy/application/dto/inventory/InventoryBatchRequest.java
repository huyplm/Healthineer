package com.hospital.pharmacy.application.dto.inventory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record InventoryBatchRequest(
        @NotNull Long medicationId,
        @NotBlank String location,
        @NotBlank String batchNumber,
        @NotNull LocalDate expiryDate,
        @NotNull LocalDate manufactureDate,
        @NotNull Integer quantity,
        Integer unitCost
) {
}
