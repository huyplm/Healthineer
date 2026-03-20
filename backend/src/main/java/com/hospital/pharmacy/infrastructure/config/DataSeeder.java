package com.hospital.pharmacy.infrastructure.config;

import com.hospital.pharmacy.domain.model.*;
import com.hospital.pharmacy.domain.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner seed(
            UserRepository userRepository,
            PatientRepository patientRepository,
            MedicationRepository medicationRepository,
            InventoryBatchRepository inventoryBatchRepository,
            ConditionRepository conditionRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (userRepository.count() == 0) {
                seedUsers(userRepository, passwordEncoder);
            }
            if (patientRepository.count() == 0) {
                seedPatients(patientRepository, conditionRepository);
            }
            if (medicationRepository.count() == 0) {
                seedMedications(medicationRepository);
            }
            if (inventoryBatchRepository.count() == 0) {
                seedInventory(inventoryBatchRepository, medicationRepository);
            }
            log.info("Seed completed");
        };
    }

    private void seedUsers(UserRepository userRepository, PasswordEncoder encoder) {
        userRepository.saveAll(List.of(
                buildUser("doctor1", "Doctor One", Role.DOCTOR, "Internal Medicine", encoder),
                buildUser("doctor2", "Doctor Two", Role.DOCTOR, "Surgery", encoder),
                buildUser("pharm1", "Pharmacist One", Role.PHARMACIST, "Central Pharmacy", encoder),
                buildUser("pharm2", "Pharmacist Two", Role.PHARMACIST, "Ward Pharmacy", encoder),
                buildUser("admin", "System Admin", Role.ADMIN, "Administration", encoder)
        ));
    }

    private User buildUser(String username, String fullName, Role role, String dept, PasswordEncoder encoder) {
        User u = new User();
        u.setUsername(username);
        u.setFullName(fullName);
        u.setRole(role);
        u.setDepartment(dept);
        u.setPasswordHash(encoder.encode("password"));
        u.setActive(true);
        return u;
    }

    private void seedPatients(PatientRepository patientRepository, ConditionRepository conditionRepository) {
        for (int i = 1; i <= 10; i++) {
            Patient p = new Patient();
            p.setPatientId("PAT-" + String.format("%03d", i));
            p.setFullName("Patient " + i);
            p.setDateOfBirth(LocalDate.now().minusYears(20 + i));
            p.setGender(i % 2 == 0 ? "F" : "M");
            p.setPhoneNumber("09000000" + i);
            p.setInsuranceId("INS-" + String.format("%05d", i));
            patientRepository.save(p);

            Condition c = new Condition();
            c.setPatient(p);
            c.setConditionName(i % 2 == 0 ? "Diabetes" : "Hypertension");
            c.setSeverity("moderate");
            conditionRepository.save(c);
        }
    }

    private void seedMedications(MedicationRepository medicationRepository) {
        for (int i = 1; i <= 50; i++) {
            Medication m = new Medication();
            m.setMedicationId("MED-" + String.format("%03d", i));
            m.setTradeName(i == 1 ? "Paracetamol" : i == 2 ? "Amoxicillin" : i == 3 ? "Metformin" : "Medication " + i);
            m.setActiveIngredient(i == 1 ? "Paracetamol" : i == 2 ? "Amoxicillin" : i == 3 ? "Metformin" : "Ingredient " + i);
            m.setDosageForm("tablet");
            m.setStrength("500mg");
            m.setAdministrationRoute("oral");
            m.setAtcCode("ATC-" + i);
            m.setDrugGroup("General");
            m.setContraindications("N/A");
            m.setActive(true);
            medicationRepository.save(m);
        }
    }

    private void seedInventory(InventoryBatchRepository inventoryBatchRepository, MedicationRepository medicationRepository) {
        medicationRepository.findAll().forEach(m -> {
            InventoryBatch b = new InventoryBatch();
            b.setMedication(m);
            b.setLocation("Central Pharmacy");
            b.setBatchNumber("BATCH-" + m.getMedicationId());
            b.setManufactureDate(LocalDate.now().minusMonths(3));
            b.setExpiryDate(LocalDate.now().plusMonths(12));
            b.setQuantity(500);
            b.setUnitCost(2000);
            inventoryBatchRepository.save(b);
        });
    }
}
