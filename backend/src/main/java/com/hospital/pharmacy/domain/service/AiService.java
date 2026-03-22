package com.hospital.pharmacy.domain.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.pharmacy.application.dto.ai.*;
import com.hospital.pharmacy.domain.model.*;
import com.hospital.pharmacy.domain.repository.*;
import com.hospital.pharmacy.infrastructure.ai.AiConfigProperties;
import com.hospital.pharmacy.infrastructure.ai.GroqChatClient;
import com.hospital.pharmacy.infrastructure.ai.OpenFdaClient;
import com.hospital.pharmacy.presentation.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final PatientRepository patientRepository;
    private final MedicationRepository medicationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final InventoryBatchRepository inventoryBatchRepository;
    private final GroqChatClient groqClient;
    private final OpenFdaClient openFdaClient;
    private final AiConfigProperties config;
    private final ObjectMapper objectMapper;

    public AiService(PatientRepository patientRepository,
                     MedicationRepository medicationRepository,
                     PrescriptionRepository prescriptionRepository,
                     InventoryBatchRepository inventoryBatchRepository,
                     GroqChatClient groqClient,
                     OpenFdaClient openFdaClient,
                     AiConfigProperties config,
                     ObjectMapper objectMapper) {
        this.patientRepository = patientRepository;
        this.medicationRepository = medicationRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.inventoryBatchRepository = inventoryBatchRepository;
        this.groqClient = groqClient;
        this.openFdaClient = openFdaClient;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    // ─── 1. Smart Prescription Suggestion ───────────────────────────────

    public List<AiSuggestedMedicationResponse> suggest(AiSuggestRequest request) {
        if (groqClient.isAvailable()) {
            try {
                return suggestReal(request);
            } catch (Exception e) {
                log.warn("Real AI suggest failed, falling back to mock: {}", e.getMessage());
                if (!config.isFallbackToMock()) throw e;
            }
        }
        return suggestMock();
    }

    private List<AiSuggestedMedicationResponse> suggestReal(AiSuggestRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new NotFoundException("Patient not found"));

        int age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        String allergies = patient.getAllergies().stream()
                .map(Allergy::getAllergenName).collect(Collectors.joining(", "));
        String conditions = patient.getConditions().stream()
                .map(Condition::getConditionName).collect(Collectors.joining(", "));

        String systemPrompt = """
                You are a clinical pharmacist AI. Given patient info and diagnosis, suggest medications.
                Return ONLY a JSON array (no markdown, no explanation) with objects containing:
                {"medicationId": null, "name": string, "dose": string, "frequency": string, "durationDays": int, "route": string, "reasoning": string, "confidence": double(0-1)}
                Suggest 2-4 medications. Be clinically appropriate.""";

        String userMsg = String.format(
                "Patient: age %d, gender %s, allergies: [%s], conditions: [%s]. Diagnosis: %s",
                age, patient.getGender(), allergies, conditions, request.diagnosis());

        String response = groqClient.chat(systemPrompt, userMsg, 0.3);
        try {
            return objectMapper.readValue(
                    extractJson(response),
                    new TypeReference<List<AiSuggestedMedicationResponse>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse suggest response: {}", response);
            throw new GroqChatClient.GroqApiException("Parse failed", e);
        }
    }

    private List<AiSuggestedMedicationResponse> suggestMock() {
        return List.of(
                new AiSuggestedMedicationResponse(1L, "Paracetamol 500mg", "500mg", "1-1-1", 5, "oral", "Pain and fever reduction", 0.91),
                new AiSuggestedMedicationResponse(2L, "Amoxicillin 500mg", "500mg", "1-1-1", 7, "oral", "Likely bacterial infection", 0.83),
                new AiSuggestedMedicationResponse(3L, "Omeprazole 20mg", "20mg", "1-0-0", 7, "oral", "GI protection", 0.64)
        );
    }

    // ─── 2. Drug Interaction Check ──────────────────────────────────────

    public List<AiInteractionResponse> interactions(AiInteractionRequest request) {
        if (groqClient.isAvailable()) {
            try {
                return interactionsReal(request);
            } catch (Exception e) {
                log.warn("Real AI interactions failed, falling back to mock: {}", e.getMessage());
                if (!config.isFallbackToMock()) throw e;
            }
        }
        return interactionsMock(request);
    }

    private List<AiInteractionResponse> interactionsReal(AiInteractionRequest request) {
        List<String> drugNames = request.medications().stream()
                .map(id -> medicationRepository.findById(id)
                        .map(m -> m.getTradeName() + " (" + m.getActiveIngredient() + ")")
                        .orElse("Unknown drug #" + id))
                .toList();

        List<OpenFdaClient.DrugInteractionResult> fdaResults = openFdaClient.checkInteractions(
                request.medications().stream()
                        .map(id -> medicationRepository.findById(id)
                                .map(Medication::getActiveIngredient)
                                .orElse(""))
                        .filter(s -> !s.isEmpty())
                        .toList()
        );

        if (!fdaResults.isEmpty()) {
            List<AiInteractionResponse> responses = new ArrayList<>();
            for (int i = 0; i < fdaResults.size(); i++) {
                var fda = fdaResults.get(i);
                responses.add(new AiInteractionResponse(
                        "FDA-" + (i + 1),
                        "moderate",
                        fda.description(),
                        List.of(fda.drugA(), fda.drugB()),
                        "Review FDA label for full prescribing information."
                ));
            }
            return responses;
        }

        String systemPrompt = """
                You are a clinical pharmacist AI. Check for drug-drug interactions.
                Return ONLY a JSON array (no markdown) with objects containing:
                {"id": string, "severity": "low"|"moderate"|"high", "message": string, "drugsInvolved": [string], "recommendation": string}
                If no interactions found, return an empty array [].""";

        String userMsg = "Check interactions between: " + String.join(", ", drugNames);

        String response = groqClient.chat(systemPrompt, userMsg, 0.2);
        try {
            return objectMapper.readValue(
                    extractJson(response),
                    new TypeReference<List<AiInteractionResponse>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse interaction response: {}", response);
            throw new GroqChatClient.GroqApiException("Parse failed", e);
        }
    }

    private List<AiInteractionResponse> interactionsMock(AiInteractionRequest request) {
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

    // ─── 3. ADR Risk Score ──────────────────────────────────────────────

    public AiAdrRiskResponse adrRisk(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Patient not found"));

        if (groqClient.isAvailable()) {
            try {
                return adrRiskReal(patient);
            } catch (Exception e) {
                log.warn("Real AI adrRisk failed, falling back to mock: {}", e.getMessage());
                if (!config.isFallbackToMock()) throw e;
            }
        }
        return adrRiskMock(patient);
    }

    private AiAdrRiskResponse adrRiskReal(Patient patient) {
        int age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        String allergies = patient.getAllergies().stream()
                .map(Allergy::getAllergenName).collect(Collectors.joining(", "));
        String conditions = patient.getConditions().stream()
                .map(Condition::getConditionName).collect(Collectors.joining(", "));

        String systemPrompt = """
                You are a clinical pharmacist AI. Assess the Adverse Drug Reaction (ADR) risk for a patient.
                Return ONLY a JSON object (no markdown):
                {"level": "low"|"medium"|"high", "score": int(0-100), "factors": [string]}
                Consider age, polypharmacy, organ function, known allergies, comorbidities.""";

        String userMsg = String.format(
                "Patient: age %d, gender %s, allergies: [%s], conditions: [%s]",
                age, patient.getGender(), allergies, conditions);

        return groqClient.chatAsJson(systemPrompt, userMsg, AiAdrRiskResponse.class);
    }

    private AiAdrRiskResponse adrRiskMock(Patient patient) {
        int age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        int conditionCount = patient.getConditions().size();
        int score = Math.min(100, (age >= 65 ? 50 : 20) + (conditionCount * 10));
        String level = score >= 70 ? "high" : (score >= 40 ? "medium" : "low");
        return new AiAdrRiskResponse(
                level, score,
                List.of(age >= 65 ? "Elderly age" : "Non-elderly", "Condition count: " + conditionCount)
        );
    }

    // ─── 4. Patient Summary ─────────────────────────────────────────────

    public AiPatientSummaryResponse summary(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new NotFoundException("Patient not found"));

        if (groqClient.isAvailable()) {
            try {
                return summaryReal(patient);
            } catch (Exception e) {
                log.warn("Real AI summary failed, falling back to mock: {}", e.getMessage());
                if (!config.isFallbackToMock()) throw e;
            }
        }
        return summaryMock();
    }

    private AiPatientSummaryResponse summaryReal(Patient patient) {
        int age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        String allergies = patient.getAllergies().stream()
                .map(Allergy::getAllergenName).collect(Collectors.joining(", "));
        String conditions = patient.getConditions().stream()
                .map(Condition::getConditionName).collect(Collectors.joining(", "));
        int rxCount = patient.getPrescriptions().size();

        String systemPrompt = """
                You are a clinical AI assistant. Generate a concise patient summary paragraph.
                Return ONLY a JSON object: {"summary": string, "updatedAt": ISO_timestamp, "sources": [string]}
                Keep the summary under 200 words. Be factual and clinically relevant.""";

        String userMsg = String.format(
                "Patient: %s, age %d, gender %s. Allergies: [%s]. Conditions: [%s]. Total prescriptions: %d.",
                patient.getFullName(), age, patient.getGender(), allergies, conditions, rxCount);

        return groqClient.chatAsJson(systemPrompt, userMsg, AiPatientSummaryResponse.class);
    }

    private AiPatientSummaryResponse summaryMock() {
        return new AiPatientSummaryResponse(
                "Patient has chronic conditions and ongoing medications. Recent prescriptions were submitted to pharmacy and are under review. Monitor adherence and adverse effects.",
                Instant.now().toString(),
                List.of("prescriptions", "visits", "notes", "conditions")
        );
    }

    // ─── 5. Chat Assistant ──────────────────────────────────────────────

    public AiChatResponse chat(AiChatRequest request) {
        if (groqClient.isAvailable()) {
            try {
                return chatReal(request);
            } catch (Exception e) {
                log.warn("Real AI chat failed, falling back to mock: {}", e.getMessage());
                if (!config.isFallbackToMock()) throw e;
            }
        }
        return chatMock(request);
    }

    private AiChatResponse chatReal(AiChatRequest request) {
        Prescription rx = prescriptionRepository.findById(request.prescriptionId())
                .orElseThrow(() -> new NotFoundException("Prescription not found"));

        String items = rx.getItems().stream()
                .map(i -> i.getMedication().getTradeName() + " " + i.getDose() + " " + i.getFrequency() + " for " + i.getDurationDays() + " days")
                .collect(Collectors.joining("; "));

        String systemPrompt = String.format("""
                You are a clinical pharmacist AI assistant helping with prescription #%s.
                Diagnosis: %s. Medications: [%s].
                Answer the user's clinical question concisely and helpfully.
                Always respond in plain text (no JSON, no markdown formatting).""",
                rx.getPrescriptionId(), rx.getDiagnosis(), items);

        String content = groqClient.chat(systemPrompt, request.message(), 0.4);

        return new AiChatResponse(
                "ai-" + System.currentTimeMillis(),
                "ai",
                content,
                Instant.now().toString()
        );
    }

    private AiChatResponse chatMock(AiChatRequest request) {
        String q = request.message().toLowerCase();
        String answer;
        if (q.contains("interaction")) {
            answer = "In this prescription, Paracetamol and Ibuprofen should not be taken simultaneously; space at least 4 hours apart. Omeprazole provides GI protection.";
        } else if (q.contains("kidney") || q.contains("renal")) {
            answer = "Adjust dosing for renal-impaired patients. Paracetamol is generally safe; avoid or reduce NSAIDs if eGFR < 30.";
        } else if (q.contains("summary") || q.contains("patient")) {
            answer = "Current prescription includes: (1) Analgesic/antipyretic 3x/day for 5 days. (2) Gastroprotective agent morning dose. Patient should take medications after meals.";
        } else {
            answer = "Based on the current prescription, the medications are appropriate for the diagnosis. The patient should adhere to the prescribed dosage and timing. Review the AI Drug Safety section for any flagged interactions.";
        }
        return new AiChatResponse(
                "ai-" + System.currentTimeMillis(),
                "ai",
                answer,
                Instant.now().toString()
        );
    }

    // ─── 6. Inventory Forecast ──────────────────────────────────────────

    public AiInventoryForecastResponse inventoryForecast(String location) {
        if (groqClient.isAvailable()) {
            try {
                return inventoryForecastReal(location);
            } catch (Exception e) {
                log.warn("Real AI inventory forecast failed, falling back to mock: {}", e.getMessage());
                if (!config.isFallbackToMock()) throw e;
            }
        }
        return inventoryForecastMock();
    }

    private AiInventoryForecastResponse inventoryForecastReal(String location) {
        List<InventoryBatch> batches = inventoryBatchRepository.findByLocation(location);

        StringBuilder inventoryInfo = new StringBuilder();
        for (InventoryBatch b : batches) {
            long daysToExpiry = ChronoUnit.DAYS.between(LocalDate.now(), b.getExpiryDate());
            inventoryInfo.append(String.format("%s | batch %s | qty %d | expires in %d days\n",
                    b.getMedication().getTradeName(), b.getBatchNumber(), b.getQuantity(), daysToExpiry));
        }

        String systemPrompt = """
                You are a pharmacy inventory AI. Analyze stock and forecast risks.
                Return ONLY a JSON object (no markdown):
                {
                  "items": [{"medicationId": string, "medicationName": string, "daysUntilStockout": int|null, "expiryRisk": "none"|"near"|"high", "recommendedAction": string}],
                  "summary": {"atRiskStockout7Days": int, "atRiskStockout30Days": int, "nearExpiryCount": int}
                }""";

        String userMsg = "Analyze this inventory at location '" + location + "':\n" + inventoryInfo;

        return groqClient.chatAsJson(systemPrompt, userMsg, AiInventoryForecastResponse.class);
    }

    private AiInventoryForecastResponse inventoryForecastMock() {
        List<AiInventoryForecastItemResponse> items = List.of(
                new AiInventoryForecastItemResponse("1", "Paracetamol 500mg", 5, "none", "Order 200 units within 48h"),
                new AiInventoryForecastItemResponse("2", "Amoxicillin 500mg", 14, "high", "Check expiring batches, do not dispense from old lots"),
                new AiInventoryForecastItemResponse("3", "Ibuprofen 400mg", 45, "near", "Monitor stock levels"),
                new AiInventoryForecastItemResponse("4", "Omeprazole 20mg", null, "none", "Adequate supply"),
                new AiInventoryForecastItemResponse("5", "Loperamide 2mg", null, "none", "Adequate supply")
        );
        var summary = new AiInventoryForecastSummaryResponse(1, 2, 2);
        return new AiInventoryForecastResponse(items, summary);
    }

    // ─── Utility ────────────────────────────────────────────────────────

    private String extractJson(String text) {
        int start = text.indexOf("```json");
        if (start >= 0) {
            int end = text.indexOf("```", start + 7);
            if (end > start) return text.substring(start + 7, end).trim();
        }
        start = text.indexOf("```");
        if (start >= 0) {
            int end = text.indexOf("```", start + 3);
            if (end > start) return text.substring(start + 3, end).trim();
        }
        int arrStart = text.indexOf('[');
        int objStart = text.indexOf('{');
        if (arrStart >= 0 && (objStart < 0 || arrStart < objStart)) return text.substring(arrStart);
        if (objStart >= 0) return text.substring(objStart);
        return text;
    }
}
