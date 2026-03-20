package com.hospital.pharmacy.presentation;

import com.hospital.pharmacy.application.dto.ai.AiAdrRiskResponse;
import com.hospital.pharmacy.application.dto.ai.AiInteractionResponse;
import com.hospital.pharmacy.application.dto.ai.AiInteractionRequest;
import com.hospital.pharmacy.application.dto.ai.AiPatientSummaryResponse;
import com.hospital.pharmacy.application.dto.ai.AiSuggestedMedicationResponse;
import com.hospital.pharmacy.application.dto.ai.AiSuggestRequest;
import com.hospital.pharmacy.domain.service.AiMockService;
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

    private final AiMockService aiMockService;

    public AiController(AiMockService aiMockService) {
        this.aiMockService = aiMockService;
    }

    @PostMapping("/prescriptions/suggest")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public List<AiSuggestedMedicationResponse> suggest(@Valid @RequestBody AiSuggestRequest request) {
        return aiMockService.suggest(request);
    }

    @PostMapping("/prescriptions/interactions")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public List<AiInteractionResponse> interactions(@Valid @RequestBody AiInteractionRequest request) {
        return aiMockService.interactions(request);
    }

    @GetMapping("/patients/{id}/adr-risk")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public AiAdrRiskResponse adrRisk(@PathVariable Long id) {
        return aiMockService.adrRisk(id);
    }

    @GetMapping("/patients/{id}/summary")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public AiPatientSummaryResponse summary(@PathVariable Long id) {
        return aiMockService.summary(id);
    }
}
