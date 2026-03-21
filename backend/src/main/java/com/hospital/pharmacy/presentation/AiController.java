package com.hospital.pharmacy.presentation;

import com.hospital.pharmacy.application.dto.ai.*;
import com.hospital.pharmacy.domain.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@Validated
@Tag(name = "AI")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/prescriptions/suggest")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    @Operation(summary = "Get AI-powered medication suggestions for a diagnosis")
    public List<AiSuggestedMedicationResponse> suggest(@Valid @RequestBody AiSuggestRequest request) {
        return aiService.suggest(request);
    }

    @PostMapping("/prescriptions/interactions")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    @Operation(summary = "Check drug-drug interactions using openFDA + LLM")
    public List<AiInteractionResponse> interactions(@Valid @RequestBody AiInteractionRequest request) {
        return aiService.interactions(request);
    }

    @GetMapping("/patients/{id}/adr-risk")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    @Operation(summary = "Assess adverse drug reaction risk for a patient")
    public AiAdrRiskResponse adrRisk(@PathVariable Long id) {
        return aiService.adrRisk(id);
    }

    @GetMapping("/patients/{id}/summary")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    @Operation(summary = "Generate AI patient summary from clinical data")
    public AiPatientSummaryResponse summary(@PathVariable Long id) {
        return aiService.summary(id);
    }

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    @Operation(summary = "AI chat assistant for prescription-related questions")
    public AiChatResponse chat(@Valid @RequestBody AiChatRequest request) {
        return aiService.chat(request);
    }

    @GetMapping("/inventory/forecast")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    @Operation(summary = "AI-powered inventory stockout and expiry forecast")
    public AiInventoryForecastResponse inventoryForecast(@RequestParam(defaultValue = "Pharmacy Main") String locationId) {
        return aiService.inventoryForecast(locationId);
    }
}
