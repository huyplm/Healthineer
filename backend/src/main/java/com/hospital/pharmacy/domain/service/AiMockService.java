package com.hospital.pharmacy.domain.service;

import com.hospital.pharmacy.application.dto.ai.AiAdrRiskResponse;
import com.hospital.pharmacy.application.dto.ai.AiInteractionResponse;
import com.hospital.pharmacy.application.dto.ai.AiPatientSummaryResponse;
import com.hospital.pharmacy.application.dto.ai.AiInteractionRequest;
import com.hospital.pharmacy.application.dto.ai.AiSuggestedMedicationResponse;
import com.hospital.pharmacy.application.dto.ai.AiSuggestRequest;
import com.hospital.pharmacy.domain.model.Patient;
import com.hospital.pharmacy.domain.repository.PatientRepository;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
public class AiMockService {

    private final PatientRepository patientRepository;

    public AiMockService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public List<AiSuggestedMedicationResponse> suggest(AiSuggestRequest request) {
        return List.of(
                new AiSuggestedMedicationResponse(1L, "Paracetamol 500mg", "500mg", "1-1-1", 5, "oral", "Pain and fever reduction", 0.91),
                new AiSuggestedMedicationResponse(2L, "Amoxicillin 500mg", "500mg", "1-1-1", 7, "oral", "Likely bacterial infection", 0.83),
                new AiSuggestedMedicationResponse(3L, "Omeprazole 20mg", "20mg", "1-0-0", 7, "oral", "GI protection", 0.64)
        );
    }

    public List<AiInteractionResponse> interactions(AiInteractionRequest request) {
        if (request.medications().size() <= 2) {
            return List.of();
        }
        return List.of(
                new AiInteractionResponse("INT-001", "high", "Potential bleeding risk with current combination.",
                        List.of("Ibuprofen", "Aspirin"), "Consider switching NSAID and monitor GI symptoms."),
                new AiInteractionResponse("INT-002", "moderate", "Possible renal burden in CKD patients.",
                        List.of("NSAID", "ACE inhibitor"), "Check eGFR and adjust regimen.")
        );
    }

    public AiAdrRiskResponse adrRisk(Long patientId) {
        Patient patient = patientRepository.findById(patientId).orElseThrow(() -> new NotFoundException("Patient not found"));
        int age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        int conditionCount = patient.getConditions().size();
        int score = Math.min(100, (age >= 65 ? 50 : 20) + (conditionCount * 10));
        String level = score >= 70 ? "high" : (score >= 40 ? "medium" : "low");
        return new AiAdrRiskResponse(
                level,
                score,
                List.of(age >= 65 ? "Elderly age" : "Non-elderly", "Condition count: " + conditionCount)
        );
    }

    public AiPatientSummaryResponse summary(Long patientId) {
        patientRepository.findById(patientId).orElseThrow(() -> new NotFoundException("Patient not found"));
        return new AiPatientSummaryResponse(
                "Patient has chronic conditions and ongoing medications. Recent prescriptions were submitted to pharmacy and are under review. Monitor adherence and adverse effects.",
                Instant.now().toString(),
                List.of("prescriptions", "visits", "notes", "conditions")
        );
    }
}
