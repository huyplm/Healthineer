package com.hospital.pharmacy.domain.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "inventory_batches")
public class InventoryBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medication_fk", nullable = false)
    private Medication medication;

    @Column(nullable = false, length = 120)
    private String location;

    @Column(nullable = false, length = 80)
    private String batchNumber;

    private LocalDate expiryDate;

    private LocalDate manufactureDate;

    @Column(nullable = false)
    private Integer quantity;

    private Integer unitCost;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Medication getMedication() { return medication; }
    public void setMedication(Medication medication) { this.medication = medication; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    public LocalDate getManufactureDate() { return manufactureDate; }
    public void setManufactureDate(LocalDate manufactureDate) { this.manufactureDate = manufactureDate; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getUnitCost() { return unitCost; }
    public void setUnitCost(Integer unitCost) { this.unitCost = unitCost; }
}
