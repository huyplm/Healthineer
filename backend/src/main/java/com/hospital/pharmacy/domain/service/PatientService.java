package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.application.dto.patient.AllergyRequest;
import com.hospital.pharmacy.application.dto.patient.PatientRequest;
import com.hospital.pharmacy.domain.model.Allergy;
import com.hospital.pharmacy.domain.model.Condition;
import com.hospital.pharmacy.domain.model.Patient;
import com.hospital.pharmacy.domain.repository.AllergyRepository;
import com.hospital.pharmacy.domain.repository.ConditionRepository;
import com.hospital.pharmacy.domain.repository.PatientRepository;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final AllergyRepository allergyRepository;
    private final ConditionRepository conditionRepository;

    public PatientService(PatientRepository patientRepository, AllergyRepository allergyRepository, ConditionRepository conditionRepository) {
        this.patientRepository = patientRepository;
        this.allergyRepository = allergyRepository;
        this.conditionRepository = conditionRepository;
    }

    public Page<Patient> findAll(Pageable pageable) {
        return patientRepository.findAll(pageable);
    }

    public Patient findById(Long id) {
        return patientRepository.findById(id).orElseThrow(() -> new NotFoundException("Patient not found"));
    }

    @Transactional
    public Patient create(PatientRequest request) {
        Patient p = new Patient();
        apply(p, request);
        return patientRepository.save(p);
    }

    @Transactional
    public Patient update(Long id, PatientRequest request) {
        Patient p = findById(id);
        apply(p, request);
        return patientRepository.save(p);
    }

    public List<Allergy> allergies(Long patientId) {
        return allergyRepository.findByPatient_Id(patientId);
    }

    public List<Condition> conditions(Long patientId) {
        return conditionRepository.findByPatient_Id(patientId);
    }

    @Transactional
    public Allergy addAllergy(Long patientId, AllergyRequest request) {
        Patient patient = findById(patientId);
        Allergy allergy = new Allergy();
        allergy.setPatient(patient);
        allergy.setAllergenName(request.allergenName());
        allergy.setReaction(request.reaction());
        allergy.setFirstOccurred(request.firstOccurred());
        return allergyRepository.save(allergy);
    }

    private void apply(Patient p, PatientRequest r) {
        p.setPatientId(r.patientId());
        p.setFullName(r.fullName());
        p.setDateOfBirth(r.dateOfBirth());
        p.setGender(r.gender());
        p.setPhoneNumber(r.phoneNumber());
        p.setInsuranceId(r.insuranceId());
    }
}
