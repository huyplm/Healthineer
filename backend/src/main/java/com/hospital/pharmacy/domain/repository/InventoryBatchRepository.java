package com.hospital.pharmacy.domain.repository;

import com.hospital.pharmacy.domain.model.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    List<InventoryBatch> findByLocation(String location);

    List<InventoryBatch> findByMedication_IdOrderByExpiryDateAsc(Long medicationId);

    List<InventoryBatch> findByExpiryDateBefore(LocalDate thresholdDate);
}
