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
        String[][] meds = {
            {"Paracetamol", "Paracetamol", "500mg", "tablet", "oral", "Analgesics", "N02BE01"},
            {"Amoxicillin", "Amoxicillin", "500mg", "capsule", "oral", "Antibiotics", "J01CA04"},
            {"Metformin", "Metformin", "500mg", "tablet", "oral", "Antidiabetics", "A10BA02"},
            {"Ibuprofen", "Ibuprofen", "400mg", "tablet", "oral", "NSAIDs", "M01AE01"},
            {"Omeprazole", "Omeprazole", "20mg", "capsule", "oral", "PPIs", "A02BC01"},
            {"Amlodipine", "Amlodipine", "5mg", "tablet", "oral", "Antihypertensives", "C08CA01"},
            {"Atorvastatin", "Atorvastatin", "20mg", "tablet", "oral", "Statins", "C10AA05"},
            {"Losartan", "Losartan", "50mg", "tablet", "oral", "ARBs", "C09CA01"},
            {"Cetirizine", "Cetirizine", "10mg", "tablet", "oral", "Antihistamines", "R06AE07"},
            {"Azithromycin", "Azithromycin", "500mg", "tablet", "oral", "Antibiotics", "J01FA10"},
            {"Dexamethasone", "Dexamethasone", "4mg", "tablet", "oral", "Corticosteroids", "H02AB02"},
            {"Prednisolone", "Prednisolone", "5mg", "tablet", "oral", "Corticosteroids", "H02AB06"},
            {"Ciprofloxacin", "Ciprofloxacin", "500mg", "tablet", "oral", "Antibiotics", "J01MA02"},
            {"Lisinopril", "Lisinopril", "10mg", "tablet", "oral", "ACE Inhibitors", "C09AA03"},
            {"Hydrochlorothiazide", "Hydrochlorothiazide", "25mg", "tablet", "oral", "Diuretics", "C03AA03"},
            {"Warfarin", "Warfarin", "5mg", "tablet", "oral", "Anticoagulants", "B01AA03"},
            {"Clopidogrel", "Clopidogrel", "75mg", "tablet", "oral", "Antiplatelets", "B01AC04"},
            {"Aspirin", "Acetylsalicylic acid", "100mg", "tablet", "oral", "Antiplatelets", "B01AC06"},
            {"Salbutamol", "Salbutamol", "100mcg", "inhaler", "inhalation", "Bronchodilators", "R03AC02"},
            {"Insulin Glargine", "Insulin Glargine", "100IU/mL", "injection", "subcutaneous", "Insulins", "A10AE04"},
            {"Diazepam", "Diazepam", "5mg", "tablet", "oral", "Benzodiazepines", "N05BA01"},
            {"Gabapentin", "Gabapentin", "300mg", "capsule", "oral", "Anticonvulsants", "N03AX12"},
            {"Fluoxetine", "Fluoxetine", "20mg", "capsule", "oral", "SSRIs", "N06AB03"},
            {"Ranitidine", "Ranitidine", "150mg", "tablet", "oral", "H2 Blockers", "A02BA02"},
            {"Metoprolol", "Metoprolol", "50mg", "tablet", "oral", "Beta Blockers", "C07AB02"},
            {"Furosemide", "Furosemide", "40mg", "tablet", "oral", "Diuretics", "C03CA01"},
            {"Morphine", "Morphine Sulfate", "10mg", "injection", "iv", "Opioid Analgesics", "N02AA01"},
            {"Tramadol", "Tramadol", "50mg", "capsule", "oral", "Opioid Analgesics", "N02AX02"},
            {"Levofloxacin", "Levofloxacin", "500mg", "tablet", "oral", "Antibiotics", "J01MA12"},
            {"Ceftriaxone", "Ceftriaxone", "1g", "injection", "iv", "Antibiotics", "J01DD04"},
            {"Ivermectin", "Ivermectin", "3mg", "tablet", "oral", "Antiparasitics", "P02CF01"},
            {"Montelukast", "Montelukast", "10mg", "tablet", "oral", "Leukotriene Inhibitors", "R03DC03"},
            {"Pantoprazole", "Pantoprazole", "40mg", "tablet", "oral", "PPIs", "A02BC02"},
            {"Glimepiride", "Glimepiride", "2mg", "tablet", "oral", "Antidiabetics", "A10BB12"},
            {"Sitagliptin", "Sitagliptin", "100mg", "tablet", "oral", "DPP-4 Inhibitors", "A10BH01"},
            {"Rosuvastatin", "Rosuvastatin", "10mg", "tablet", "oral", "Statins", "C10AA07"},
            {"Esomeprazole", "Esomeprazole", "40mg", "capsule", "oral", "PPIs", "A02BC05"},
            {"Valsartan", "Valsartan", "80mg", "tablet", "oral", "ARBs", "C09CA03"},
            {"Propranolol", "Propranolol", "40mg", "tablet", "oral", "Beta Blockers", "C07AA05"},
            {"Clindamycin", "Clindamycin", "300mg", "capsule", "oral", "Antibiotics", "J01FF01"},
            {"Metronidazole", "Metronidazole", "500mg", "tablet", "oral", "Antibiotics", "J01XD01"},
            {"Doxycycline", "Doxycycline", "100mg", "capsule", "oral", "Antibiotics", "J01AA02"},
            {"Spironolactone", "Spironolactone", "25mg", "tablet", "oral", "Diuretics", "C03DA01"},
            {"Enalapril", "Enalapril", "10mg", "tablet", "oral", "ACE Inhibitors", "C09AA02"},
            {"Simvastatin", "Simvastatin", "20mg", "tablet", "oral", "Statins", "C10AA01"},
            {"Domperidone", "Domperidone", "10mg", "tablet", "oral", "Antiemetics", "A03FA03"},
            {"Ondansetron", "Ondansetron", "4mg", "tablet", "oral", "Antiemetics", "A04AA01"},
            {"Loratadine", "Loratadine", "10mg", "tablet", "oral", "Antihistamines", "R06AX13"},
            {"Acetylcysteine", "Acetylcysteine", "600mg", "effervescent", "oral", "Mucolytics", "R05CB01"},
            {"Enoxaparin", "Enoxaparin", "40mg", "injection", "subcutaneous", "Anticoagulants", "B01AB05"},
        };
        for (int i = 0; i < meds.length; i++) {
            String[] d = meds[i];
            Medication m = new Medication();
            m.setMedicationId("MED-" + String.format("%03d", i + 1));
            m.setTradeName(d[0]);
            m.setActiveIngredient(d[1]);
            m.setStrength(d[2]);
            m.setDosageForm(d[3]);
            m.setAdministrationRoute(d[4]);
            m.setDrugGroup(d[5]);
            m.setAtcCode(d[6]);
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
