package com.hospital.pharmacy.presentation;

import com.hospital.pharmacy.application.dto.inventory.InventoryBatchRequest;
import com.hospital.pharmacy.application.dto.inventory.InventoryBatchResponse;
import com.hospital.pharmacy.application.mapper.ResponseMapper;
import com.hospital.pharmacy.domain.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@Validated
@Tag(name = "Inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/{location}")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public List<InventoryBatchResponse> byLocation(@PathVariable String location) {
        return inventoryService.byLocation(location).stream().map(ResponseMapper::toInventoryBatchResponse).toList();
    }

    @GetMapping("/medication/{medicationId}")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public List<InventoryBatchResponse> byMedication(@PathVariable Long medicationId) {
        return inventoryService.byMedication(medicationId).stream().map(ResponseMapper::toInventoryBatchResponse).toList();
    }

    @PostMapping("/batches")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public InventoryBatchResponse addBatch(@Valid @RequestBody InventoryBatchRequest request) {
        return ResponseMapper.toInventoryBatchResponse(inventoryService.createBatch(request));
    }

    @PutMapping("/batches/{id}/adjust")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public InventoryBatchResponse adjust(@PathVariable Long id, @RequestParam Integer delta) {
        return ResponseMapper.toInventoryBatchResponse(inventoryService.adjustBatch(id, delta));
    }

    @GetMapping("/expiry-risk")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public List<InventoryBatchResponse> expiryRisk(@RequestParam String thresholdDate) {
        return inventoryService.checkExpiryRisk(java.time.LocalDate.parse(thresholdDate))
                .stream()
                .map(ResponseMapper::toInventoryBatchResponse)
                .toList();
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok");
    }
}
