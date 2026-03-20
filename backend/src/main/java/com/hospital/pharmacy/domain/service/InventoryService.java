package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.application.dto.inventory.InventoryBatchRequest;
import com.hospital.pharmacy.domain.model.InventoryBatch;
import com.hospital.pharmacy.domain.model.Medication;
import com.hospital.pharmacy.domain.repository.InventoryBatchRepository;
import com.hospital.pharmacy.domain.repository.MedicationRepository;
import com.hospital.pharmacy.presentation.exception.BusinessRuleViolationException;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class InventoryService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final MedicationRepository medicationRepository;

    public InventoryService(InventoryBatchRepository inventoryBatchRepository, MedicationRepository medicationRepository) {
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.medicationRepository = medicationRepository;
    }

    public List<InventoryBatch> byLocation(String location) {
        return inventoryBatchRepository.findByLocation(location);
    }

    public List<InventoryBatch> byMedication(Long medicationId) {
        return inventoryBatchRepository.findByMedication_IdOrderByExpiryDateAsc(medicationId);
    }

    @Transactional
    public InventoryBatch createBatch(InventoryBatchRequest request) {
        Medication med = medicationRepository.findById(request.medicationId())
                .orElseThrow(() -> new NotFoundException("Medication not found"));
        InventoryBatch batch = new InventoryBatch();
        batch.setMedication(med);
        batch.setLocation(request.location());
        batch.setBatchNumber(request.batchNumber());
        batch.setExpiryDate(request.expiryDate());
        batch.setManufactureDate(request.manufactureDate());
        batch.setQuantity(request.quantity());
        batch.setUnitCost(request.unitCost());
        return inventoryBatchRepository.save(batch);
    }

    @Transactional
    public InventoryBatch adjustBatch(Long id, Integer amountDelta) {
        InventoryBatch batch = inventoryBatchRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Batch not found"));
        int updated = batch.getQuantity() + amountDelta;
        if (updated < 0) {
            throw new BusinessRuleViolationException("Insufficient stock");
        }
        batch.setQuantity(updated);
        return inventoryBatchRepository.save(batch);
    }

    @Transactional
    public void deductStock(Long medicationId, int requiredQty) {
        if (requiredQty <= 0) {
            return;
        }
        List<InventoryBatch> candidates = getAvailableBatches(medicationId, requiredQty);
        int remaining = requiredQty;
        for (InventoryBatch batch : candidates) {
            int use = Math.min(batch.getQuantity(), remaining);
            batch.setQuantity(batch.getQuantity() - use);
            remaining -= use;
            inventoryBatchRepository.save(batch);
            if (remaining == 0) {
                break;
            }
        }
        if (remaining > 0) {
            throw new BusinessRuleViolationException("Insufficient stock");
        }
    }

    public List<InventoryBatch> getAvailableBatches(Long medicationId, Integer requiredQty) {
        List<InventoryBatch> batches = inventoryBatchRepository.findByMedication_IdOrderByExpiryDateAsc(medicationId);
        List<InventoryBatch> available = new ArrayList<>();
        int total = 0;
        for (InventoryBatch b : batches) {
            if (b.getExpiryDate() != null && b.getExpiryDate().isBefore(LocalDate.now())) {
                continue;
            }
            available.add(b);
            total += b.getQuantity();
            if (total >= requiredQty) {
                return available;
            }
        }
        throw new BusinessRuleViolationException("Insufficient stock");
    }

    public List<InventoryBatch> checkExpiryRisk(LocalDate thresholdDate) {
        return inventoryBatchRepository.findByExpiryDateBefore(thresholdDate);
    }
}
