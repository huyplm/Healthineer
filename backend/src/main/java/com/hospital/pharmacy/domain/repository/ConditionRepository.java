package com.hospital.pharmacy.domain.repository;

import com.hospital.pharmacy.domain.model.Condition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConditionRepository extends JpaRepository<Condition, Long> {
    List<Condition> findByPatient_Id(Long patientId);
}
