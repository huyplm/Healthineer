package com.hospital.pharmacy.presentation;

import com.hospital.pharmacy.application.dto.prescription.PrescriptionCreateRequest;
import com.hospital.pharmacy.application.dto.prescription.PrescriptionItemRequest;
import com.hospital.pharmacy.application.dto.prescription.PrescriptionResponse;
import com.hospital.pharmacy.application.mapper.ResponseMapper;
import com.hospital.pharmacy.domain.service.CurrentUserService;
import com.hospital.pharmacy.domain.service.PrescriptionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@Validated
@Tag(name = "Prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final CurrentUserService currentUserService;

    public PrescriptionController(PrescriptionService prescriptionService, CurrentUserService currentUserService) {
        this.prescriptionService = prescriptionService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('DOCTOR')")
    public Page<PrescriptionResponse> my(Pageable pageable) {
        return prescriptionService.myPrescriptions(currentUserService.currentUser().getId(), pageable)
                .map(ResponseMapper::toPrescriptionResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")
    public PrescriptionResponse get(@PathVariable Long id) {
        return ResponseMapper.toPrescriptionResponse(prescriptionService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public PrescriptionResponse createDraft(@Valid @RequestBody PrescriptionCreateRequest request) {
        return ResponseMapper.toPrescriptionResponse(
                prescriptionService.createDraft(currentUserService.currentUser().getId(), request)
        );
    }

    @PutMapping("/{id}/submit")
    @PreAuthorize("hasRole('DOCTOR')")
    public PrescriptionResponse submit(@PathVariable Long id) {
        return ResponseMapper.toPrescriptionResponse(
                prescriptionService.submitForReview(id, currentUserService.currentUser().getId())
        );
    }

    @PutMapping("/{id}/items")
    @PreAuthorize("hasRole('DOCTOR')")
    public PrescriptionResponse updateItems(@PathVariable Long id, @Valid @RequestBody List<PrescriptionItemRequest> items) {
        return ResponseMapper.toPrescriptionResponse(
                prescriptionService.updateItems(id, items, currentUserService.currentUser().getId())
        );
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public Page<PrescriptionResponse> queue(Pageable pageable) {
        return prescriptionService.queue(pageable).map(ResponseMapper::toPrescriptionResponse);
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public PrescriptionResponse review(@PathVariable Long id) {
        return ResponseMapper.toPrescriptionResponse(prescriptionService.review(id));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public PrescriptionResponse approve(@PathVariable Long id) {
        return ResponseMapper.toPrescriptionResponse(prescriptionService.approve(id));
    }

    @PutMapping("/{id}/dispense")
    @PreAuthorize("hasAnyRole('PHARMACIST','ADMIN')")
    public PrescriptionResponse dispense(@PathVariable Long id) {
        return ResponseMapper.toPrescriptionResponse(prescriptionService.dispense(id));
    }
}
