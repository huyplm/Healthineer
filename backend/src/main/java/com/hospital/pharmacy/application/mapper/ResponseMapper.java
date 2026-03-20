package com.hospital.pharmacy.application.mapper;

import com.hospital.pharmacy.application.dto.inventory.InventoryBatchResponse;
import com.hospital.pharmacy.application.dto.medication.MedicationResponse;
import com.hospital.pharmacy.application.dto.message.MessageResponse;
import com.hospital.pharmacy.application.dto.patient.AllergyResponse;
import com.hospital.pharmacy.application.dto.patient.ConditionResponse;
import com.hospital.pharmacy.application.dto.patient.PatientResponse;
import com.hospital.pharmacy.application.dto.prescription.PrescriptionItemResponse;
import com.hospital.pharmacy.application.dto.prescription.PrescriptionResponse;
import com.hospital.pharmacy.domain.model.*;

import java.util.List;

public final class ResponseMapper {

    private ResponseMapper() {
    }

    public static PatientResponse toPatientResponse(Patient p) {
        return new PatientResponse(
                p.getId(),
                p.getPatientId(),
                p.getFullName(),
                p.getDateOfBirth(),
                p.getGender(),
                p.getPhoneNumber(),
                p.getInsuranceId()
        );
    }

    public static AllergyResponse toAllergyResponse(Allergy a) {
        return new AllergyResponse(
                a.getId(),
                a.getAllergenName(),
                a.getReaction(),
                a.getFirstOccurred()
        );
    }

    public static ConditionResponse toConditionResponse(Condition c) {
        return new ConditionResponse(
                c.getId(),
                c.getConditionName(),
                c.getSeverity()
        );
    }

    public static MedicationResponse toMedicationResponse(Medication m) {
        return new MedicationResponse(
                m.getId(),
                m.getMedicationId(),
                m.getTradeName(),
                m.getActiveIngredient(),
                m.getDosageForm(),
                m.getStrength(),
                m.getAdministrationRoute(),
                m.getAtcCode(),
                m.getDrugGroup(),
                m.getContraindications(),
                m.isActive()
        );
    }

    public static PrescriptionItemResponse toPrescriptionItemResponse(PrescriptionItem i) {
        return new PrescriptionItemResponse(
                i.getId(),
                i.getMedication().getId(),
                i.getMedication().getTradeName(),
                i.getDose(),
                i.getFrequency(),
                i.getDurationDays(),
                i.getRoute(),
                i.getInstructions()
        );
    }

    public static PrescriptionResponse toPrescriptionResponse(Prescription p) {
        List<PrescriptionItemResponse> items = p.getItems() == null ? List.of() : p.getItems().stream()
                .map(ResponseMapper::toPrescriptionItemResponse)
                .toList();
        return new PrescriptionResponse(
                p.getId(),
                p.getPrescriptionId(),
                p.getPatient().getId(),
                p.getPatient().getFullName(),
                p.getDoctor().getId(),
                p.getDoctor().getFullName(),
                p.getDepartment(),
                p.getDiagnosis(),
                p.getClinicalNote(),
                p.getStatus(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                items
        );
    }

    public static InventoryBatchResponse toInventoryBatchResponse(InventoryBatch b) {
        return new InventoryBatchResponse(
                b.getId(),
                b.getMedication().getId(),
                b.getMedication().getTradeName(),
                b.getLocation(),
                b.getBatchNumber(),
                b.getExpiryDate(),
                b.getManufactureDate(),
                b.getQuantity(),
                b.getUnitCost()
        );
    }

    public static MessageResponse toMessageResponse(Message m) {
        return new MessageResponse(
                m.getId(),
                m.getPrescription().getId(),
                m.getSender().getId(),
                m.getSender().getFullName(),
                m.getContent(),
                m.getTimestamp(),
                m.getMessageType()
        );
    }
}
