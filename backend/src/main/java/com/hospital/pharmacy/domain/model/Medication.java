package com.hospital.pharmacy.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "medications")
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String medicationId;

    @Column(nullable = false, length = 160)
    private String tradeName;

    @Column(nullable = false, length = 160)
    private String activeIngredient;

    @Column(length = 80)
    private String dosageForm;

    @Column(length = 80)
    private String strength;

    @Column(length = 80)
    private String administrationRoute;

    @Column(length = 60)
    private String atcCode;

    @Column(length = 120)
    private String drugGroup;

    @Column(columnDefinition = "TEXT")
    private String contraindications;

    @Column(nullable = false)
    private boolean active = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMedicationId() { return medicationId; }
    public void setMedicationId(String medicationId) { this.medicationId = medicationId; }
    public String getTradeName() { return tradeName; }
    public void setTradeName(String tradeName) { this.tradeName = tradeName; }
    public String getActiveIngredient() { return activeIngredient; }
    public void setActiveIngredient(String activeIngredient) { this.activeIngredient = activeIngredient; }
    public String getDosageForm() { return dosageForm; }
    public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }
    public String getStrength() { return strength; }
    public void setStrength(String strength) { this.strength = strength; }
    public String getAdministrationRoute() { return administrationRoute; }
    public void setAdministrationRoute(String administrationRoute) { this.administrationRoute = administrationRoute; }
    public String getAtcCode() { return atcCode; }
    public void setAtcCode(String atcCode) { this.atcCode = atcCode; }
    public String getDrugGroup() { return drugGroup; }
    public void setDrugGroup(String drugGroup) { this.drugGroup = drugGroup; }
    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) { this.contraindications = contraindications; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
