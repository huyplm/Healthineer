package com.hospital.pharmacy.domain.repository;

import com.hospital.pharmacy.domain.model.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AllergyRepository extends JpaRepository<Allergy, Long> {
    List<Allergy> findByPatient_Id(Long patientId);
}
