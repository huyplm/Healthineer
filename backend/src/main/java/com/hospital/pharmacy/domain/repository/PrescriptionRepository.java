package com.hospital.pharmacy.domain.repository;

import com.hospital.pharmacy.domain.model.Prescription;
import com.hospital.pharmacy.domain.model.PrescriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long>, JpaSpecificationExecutor<Prescription> {
    List<Prescription> findByPatient_IdAndDoctor_IdAndStatus(Long patientId, Long doctorId, PrescriptionStatus status);

    Page<Prescription> findByStatus(PrescriptionStatus status, Pageable pageable);

    Page<Prescription> findByStatusIn(List<PrescriptionStatus> statuses, Pageable pageable);

    Page<Prescription> findByDoctor_Id(Long doctorId, Pageable pageable);
}
