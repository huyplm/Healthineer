package com.hospital.pharmacy.presentation;

import com.hospital.pharmacy.application.dto.medication.MedicationRequest;
import com.hospital.pharmacy.application.dto.medication.MedicationResponse;
import com.hospital.pharmacy.application.mapper.ResponseMapper;
import com.hospital.pharmacy.domain.service.MedicationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medications")
@Validated
@Tag(name = "Medications")
public class MedicationController {

    private final MedicationService medicationService;

    public MedicationController(MedicationService medicationService) {
        this.medicationService = medicationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public Page<MedicationResponse> search(@RequestParam(required = false) String q, Pageable pageable) {
        return medicationService.search(q, pageable).map(ResponseMapper::toMedicationResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public MedicationResponse get(@PathVariable Long id) {
        return ResponseMapper.toMedicationResponse(medicationService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public MedicationResponse create(@Valid @RequestBody MedicationRequest request) {
        return ResponseMapper.toMedicationResponse(medicationService.create(request));
    }
}
