package com.hospital.pharmacy.domain.repository;

import com.hospital.pharmacy.domain.model.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Long> {
    List<PrescriptionItem> findByPrescription_Id(Long prescriptionId);
}
