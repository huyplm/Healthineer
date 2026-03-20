package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.application.dto.prescription.PrescriptionCreateRequest;
import com.hospital.pharmacy.application.dto.prescription.PrescriptionItemRequest;
import com.hospital.pharmacy.domain.model.*;
import com.hospital.pharmacy.domain.repository.MedicationRepository;
import com.hospital.pharmacy.domain.repository.PatientRepository;
import com.hospital.pharmacy.domain.repository.PrescriptionRepository;
import com.hospital.pharmacy.domain.repository.UserRepository;
import com.hospital.pharmacy.presentation.exception.BusinessRuleViolationException;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import com.hospital.pharmacy.presentation.exception.ValidationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final MedicationRepository medicationRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    public PrescriptionService(
            PrescriptionRepository prescriptionRepository,
            PatientRepository patientRepository,
            MedicationRepository medicationRepository,
            UserRepository userRepository,
            InventoryService inventoryService
    ) {
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.medicationRepository = medicationRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
    }

    public Page<Prescription> myPrescriptions(Long doctorId, Pageable pageable) {
        return prescriptionRepository.findByDoctor_Id(doctorId, pageable);
    }

    public Prescription get(Long id) {
        return prescriptionRepository.findById(id).orElseThrow(() -> new NotFoundException("Prescription not found"));
    }

    @Transactional
    public Prescription createDraft(Long doctorId, PrescriptionCreateRequest request) {
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new NotFoundException("Doctor not found"));
        Patient patient = patientRepository.findById(request.patientId()).orElseThrow(() -> new NotFoundException("Patient not found"));
        Prescription p = new Prescription();
        p.setPrescriptionId("RX-" + System.currentTimeMillis());
        p.setPatient(patient);
        p.setDoctor(doctor);
        p.setDepartment(request.department());
        p.setDiagnosis(request.diagnosis());
        p.setClinicalNote(request.clinicalNote());
        p.setStatus(PrescriptionStatus.DRAFT);
        p.setItems(new ArrayList<>());
        updateItemsInternal(p, request.items());
        return prescriptionRepository.save(p);
    }

    @Transactional
    public Prescription updateItems(Long prescriptionId, List<PrescriptionItemRequest> items, Long actorId) {
        Prescription p = get(prescriptionId);
        ensureDoctorOwnsDraft(p, actorId);
        updateItemsInternal(p, items);
        return prescriptionRepository.save(p);
    }

    @Transactional
    public Prescription submitForReview(Long id, Long doctorId) {
        Prescription p = get(id);
        ensureDoctorOwnsDraft(p, doctorId);
        if (p.getItems().isEmpty()) {
            throw new ValidationException("Cannot submit prescription without items");
        }
        for (PrescriptionItem item : p.getItems()) {
            if (item.getDose() == null || item.getDose().isBlank()
                    || item.getFrequency() == null || item.getFrequency().isBlank()) {
                throw new ValidationException("Dose/frequency is required for all items");
            }
        }
        p.setStatus(PrescriptionStatus.SUBMITTED);
        return prescriptionRepository.save(p);
    }

    public Page<Prescription> queue(Pageable pageable) {
        return prescriptionRepository.findByStatusIn(List.of(PrescriptionStatus.SUBMITTED, PrescriptionStatus.REVIEWED), pageable);
    }

    @Transactional
    public Prescription review(Long id) {
        Prescription p = get(id);
        if (p.getStatus() != PrescriptionStatus.SUBMITTED) {
            throw new BusinessRuleViolationException("Only SUBMITTED prescriptions can be reviewed");
        }
        p.setStatus(PrescriptionStatus.REVIEWED);
        return prescriptionRepository.save(p);
    }

    @Transactional
    public Prescription approve(Long id) {
        Prescription p = get(id);
        if (p.getStatus() != PrescriptionStatus.REVIEWED) {
            throw new BusinessRuleViolationException("Only REVIEWED prescriptions can be approved");
        }
        p.setStatus(PrescriptionStatus.APPROVED);
        return prescriptionRepository.save(p);
    }

    @Transactional
    public Prescription dispense(Long id) {
        Prescription p = get(id);
        if (p.getStatus() != PrescriptionStatus.APPROVED) {
            throw new BusinessRuleViolationException("Only APPROVED prescriptions can be dispensed");
        }
        for (PrescriptionItem item : p.getItems()) {
            int qty = Math.max(item.getDurationDays(), 1);
            inventoryService.deductStock(item.getMedication().getId(), qty);
        }
        p.setStatus(PrescriptionStatus.DISPENSED);
        return prescriptionRepository.save(p);
    }

    private void ensureDoctorOwnsDraft(Prescription p, Long doctorId) {
        if (!p.getDoctor().getId().equals(doctorId)) {
            throw new BusinessRuleViolationException("Doctor can only modify own prescriptions");
        }
        if (p.getStatus() != PrescriptionStatus.DRAFT) {
            throw new BusinessRuleViolationException("Only DRAFT prescriptions can be modified");
        }
    }

    private void updateItemsInternal(Prescription p, List<PrescriptionItemRequest> items) {
        p.getItems().clear();
        if (items == null) {
            return;
        }
        for (PrescriptionItemRequest req : items) {
            Medication medication = medicationRepository.findById(req.medicationId())
                    .orElseThrow(() -> new NotFoundException("Medication not found: " + req.medicationId()));
            PrescriptionItem pi = new PrescriptionItem();
            pi.setPrescription(p);
            pi.setMedication(medication);
            pi.setDose(req.dose());
            pi.setFrequency(req.frequency());
            pi.setDurationDays(req.durationDays());
            pi.setRoute(req.route());
            pi.setInstructions(req.instructions());
            p.getItems().add(pi);
        }
    }
}
