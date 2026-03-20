package com.hospital.pharmacy.presentation;

import com.hospital.pharmacy.application.dto.patient.AllergyRequest;
import com.hospital.pharmacy.application.dto.patient.AllergyResponse;
import com.hospital.pharmacy.application.dto.patient.ConditionResponse;
import com.hospital.pharmacy.application.dto.patient.PatientRequest;
import com.hospital.pharmacy.application.dto.patient.PatientResponse;
import com.hospital.pharmacy.application.mapper.ResponseMapper;
import com.hospital.pharmacy.domain.model.Patient;
import com.hospital.pharmacy.domain.service.PatientService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@Validated
@Tag(name = "Patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public Page<PatientResponse> findAll(Pageable pageable) {
        return patientService.findAll(pageable).map(ResponseMapper::toPatientResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public PatientResponse get(@PathVariable Long id) {
        return ResponseMapper.toPatientResponse(patientService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public PatientResponse create(@Valid @RequestBody PatientRequest request) {
        return ResponseMapper.toPatientResponse(patientService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public PatientResponse update(@PathVariable Long id, @Valid @RequestBody PatientRequest request) {
        return ResponseMapper.toPatientResponse(patientService.update(id, request));
    }

    @GetMapping("/{id}/allergies")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public List<AllergyResponse> allergies(@PathVariable Long id) {
        return patientService.allergies(id).stream().map(ResponseMapper::toAllergyResponse).toList();
    }

    @PostMapping("/{id}/allergies")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    public AllergyResponse addAllergy(@PathVariable Long id, @Valid @RequestBody AllergyRequest request) {
        return ResponseMapper.toAllergyResponse(patientService.addAllergy(id, request));
    }

    @GetMapping("/{id}/conditions")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public Map<String, Object> conditionsStub(@PathVariable Long id) {
        Patient patient = patientService.findById(id);
        List<ConditionResponse> conditions = patientService.conditions(id).stream()
                .map(ResponseMapper::toConditionResponse)
                .toList();
        return Map.of("patientId", patient.getId(), "conditions", conditions);
    }
}
