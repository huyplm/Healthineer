package com.hospital.pharmacy.domain.repository;

import com.hospital.pharmacy.domain.model.Medication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    Optional<Medication> findByMedicationId(String medicationId);

    Page<Medication> findByTradeNameContainingIgnoreCaseOrActiveIngredientContainingIgnoreCase(
            String tradeName,
            String activeIngredient,
            Pageable pageable
    );
}
