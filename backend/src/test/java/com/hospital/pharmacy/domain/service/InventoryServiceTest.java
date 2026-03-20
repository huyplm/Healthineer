package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.domain.model.InventoryBatch;
import com.hospital.pharmacy.domain.model.Medication;
import com.hospital.pharmacy.domain.repository.InventoryBatchRepository;
import com.hospital.pharmacy.domain.repository.MedicationRepository;
import com.hospital.pharmacy.presentation.exception.BusinessRuleViolationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryBatchRepository inventoryBatchRepository;

    @Mock
    private MedicationRepository medicationRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    void shouldThrowWhenInsufficientStock() {
        Medication med = new Medication();
        med.setId(1L);
        InventoryBatch batch = new InventoryBatch();
        batch.setMedication(med);
        batch.setQuantity(1);
        batch.setExpiryDate(LocalDate.now().plusDays(10));
        when(inventoryBatchRepository.findByMedication_IdOrderByExpiryDateAsc(1L)).thenReturn(List.of(batch));

        assertThrows(BusinessRuleViolationException.class, () -> inventoryService.getAvailableBatches(1L, 10));
    }
}
