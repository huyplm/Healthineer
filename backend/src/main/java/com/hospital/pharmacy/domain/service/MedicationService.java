package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.application.dto.medication.MedicationRequest;
import com.hospital.pharmacy.domain.model.Medication;
import com.hospital.pharmacy.domain.repository.MedicationRepository;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MedicationService {

    private final MedicationRepository medicationRepository;

    public MedicationService(MedicationRepository medicationRepository) {
        this.medicationRepository = medicationRepository;
    }

    public Page<Medication> search(String q, Pageable pageable) {
        if (q == null || q.isBlank()) {
            return medicationRepository.findAll(pageable);
        }
        return medicationRepository.findByTradeNameContainingIgnoreCaseOrActiveIngredientContainingIgnoreCase(q, q, pageable);
    }

    public Medication findById(Long id) {
        return medicationRepository.findById(id).orElseThrow(() -> new NotFoundException("Medication not found"));
    }

    @Transactional
    public Medication create(MedicationRequest request) {
        Medication m = new Medication();
        apply(m, request);
        return medicationRepository.save(m);
    }

    private void apply(Medication m, MedicationRequest r) {
        m.setMedicationId(r.medicationId());
        m.setTradeName(r.tradeName());
        m.setActiveIngredient(r.activeIngredient());
        m.setDosageForm(r.dosageForm());
        m.setStrength(r.strength());
        m.setAdministrationRoute(r.administrationRoute());
        m.setAtcCode(r.atcCode());
        m.setDrugGroup(r.drugGroup());
        m.setContraindications(r.contraindications());
        m.setActive(r.active());
    }
}
