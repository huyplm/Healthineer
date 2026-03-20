-- ---------------------------------------------------------------------------
-- Healthineer – PostgreSQL DDL schema (database: hospital)
-- Generated from JPA entities (com.hospital.pharmacy.domain.model).
-- Compatible with PostgreSQL 16. Use with ddl-auto: validate or none.
--
-- Run (after DB and user exist):
--   psql -U admin -d hospital -f backend/src/main/resources/db/schema.sql
-- Or from project root:
--   psql -U admin -d hospital -f schema.sql
-- ---------------------------------------------------------------------------

-- Enums: JPA @Enumerated(EnumType.STRING) maps to VARCHAR; no CREATE TYPE needed.
-- Role: DOCTOR, PHARMACIST, NURSE, ADMIN
-- PrescriptionStatus: DRAFT, SUBMITTED, REVIEWED, APPROVED, DISPENSED, COMPLETED

-- ---------------------------------------------------------------------------
-- 1. users (no FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL       CONSTRAINT pk_users PRIMARY KEY,
    username        VARCHAR(100)    NOT NULL,
    full_name       VARCHAR(120)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL,
    department      VARCHAR(120),
    active          BOOLEAN         NOT NULL DEFAULT true,
    CONSTRAINT uq_users_username UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS ix_users_username ON users (username);

-- ---------------------------------------------------------------------------
-- 2. patients (no FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id              BIGSERIAL       CONSTRAINT pk_patients PRIMARY KEY,
    patient_id      VARCHAR(50)     NOT NULL,
    full_name       VARCHAR(150)    NOT NULL,
    date_of_birth   DATE            NOT NULL,
    gender          VARCHAR(10)     NOT NULL,
    phone_number    VARCHAR(30),
    insurance_id    VARCHAR(80),
    CONSTRAINT uq_patients_patient_id UNIQUE (patient_id)
);

CREATE INDEX IF NOT EXISTS ix_patients_patient_id ON patients (patient_id);

-- ---------------------------------------------------------------------------
-- 3. medications (no FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medications (
    id                  BIGSERIAL   CONSTRAINT pk_medications PRIMARY KEY,
    medication_id       VARCHAR(50) NOT NULL,
    trade_name          VARCHAR(160) NOT NULL,
    active_ingredient   VARCHAR(160) NOT NULL,
    dosage_form         VARCHAR(80),
    strength            VARCHAR(80),
    administration_route VARCHAR(80),
    atc_code            VARCHAR(60),
    drug_group          VARCHAR(120),
    contraindications   TEXT,
    active              BOOLEAN     NOT NULL DEFAULT true,
    CONSTRAINT uq_medications_medication_id UNIQUE (medication_id)
);

CREATE INDEX IF NOT EXISTS ix_medications_medication_id ON medications (medication_id);

-- ---------------------------------------------------------------------------
-- 4. allergies (FK → patients)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allergies (
    id              BIGSERIAL       CONSTRAINT pk_allergies PRIMARY KEY,
    patient_id      BIGINT          NOT NULL,
    allergen_name   VARCHAR(120)    NOT NULL,
    reaction        VARCHAR(120),
    first_occurred  DATE,
    CONSTRAINT fk_allergies_patient
        FOREIGN KEY (patient_id) REFERENCES patients (id)
);

CREATE INDEX IF NOT EXISTS ix_allergies_patient_id ON allergies (patient_id);

-- ---------------------------------------------------------------------------
-- 5. conditions (FK → patients)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conditions (
    id              BIGSERIAL       CONSTRAINT pk_conditions PRIMARY KEY,
    patient_id      BIGINT          NOT NULL,
    condition_name  VARCHAR(150)    NOT NULL,
    severity        VARCHAR(20),
    CONSTRAINT fk_conditions_patient
        FOREIGN KEY (patient_id) REFERENCES patients (id)
);

CREATE INDEX IF NOT EXISTS ix_conditions_patient_id ON conditions (patient_id);

-- ---------------------------------------------------------------------------
-- 6. prescriptions (FK → patients, users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id              BIGSERIAL       CONSTRAINT pk_prescriptions PRIMARY KEY,
    prescription_id VARCHAR(60)     NOT NULL,
    patient_fk      BIGINT          NOT NULL,
    doctor_fk       BIGINT          NOT NULL,
    department      VARCHAR(120)    NOT NULL,
    diagnosis       VARCHAR(255)    NOT NULL,
    clinical_note   TEXT,
    status          VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP       NOT NULL DEFAULT current_timestamp,
    updated_at      TIMESTAMP       NOT NULL DEFAULT current_timestamp,
    CONSTRAINT uq_prescriptions_prescription_id UNIQUE (prescription_id),
    CONSTRAINT fk_prescriptions_patient
        FOREIGN KEY (patient_fk) REFERENCES patients (id),
    CONSTRAINT fk_prescriptions_doctor
        FOREIGN KEY (doctor_fk) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS ix_prescriptions_prescription_id ON prescriptions (prescription_id);
CREATE INDEX IF NOT EXISTS ix_prescriptions_patient_fk ON prescriptions (patient_fk);
CREATE INDEX IF NOT EXISTS ix_prescriptions_doctor_fk ON prescriptions (doctor_fk);
CREATE INDEX IF NOT EXISTS ix_prescriptions_status ON prescriptions (status);

-- ---------------------------------------------------------------------------
-- 7. prescription_items (FK → prescriptions, medications)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescription_items (
    id              BIGSERIAL       CONSTRAINT pk_prescription_items PRIMARY KEY,
    prescription_fk BIGINT          NOT NULL,
    medication_fk   BIGINT          NOT NULL,
    dose            VARCHAR(80)     NOT NULL,
    frequency       VARCHAR(60)     NOT NULL,
    duration_days   INTEGER         NOT NULL,
    route           VARCHAR(60),
    instructions    VARCHAR(255),
    CONSTRAINT fk_prescription_items_prescription
        FOREIGN KEY (prescription_fk) REFERENCES prescriptions (id),
    CONSTRAINT fk_prescription_items_medication
        FOREIGN KEY (medication_fk) REFERENCES medications (id)
);

CREATE INDEX IF NOT EXISTS ix_prescription_items_prescription_fk ON prescription_items (prescription_fk);
CREATE INDEX IF NOT EXISTS ix_prescription_items_medication_fk ON prescription_items (medication_fk);

-- ---------------------------------------------------------------------------
-- 8. inventory_batches (FK → medications)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_batches (
    id                  BIGSERIAL   CONSTRAINT pk_inventory_batches PRIMARY KEY,
    medication_fk       BIGINT      NOT NULL,
    location            VARCHAR(120) NOT NULL,
    batch_number        VARCHAR(80) NOT NULL,
    expiry_date         DATE,
    manufacture_date    DATE,
    quantity            INTEGER     NOT NULL,
    unit_cost           INTEGER,
    CONSTRAINT fk_inventory_batches_medication
        FOREIGN KEY (medication_fk) REFERENCES medications (id)
);

CREATE INDEX IF NOT EXISTS ix_inventory_batches_medication_fk ON inventory_batches (medication_fk);
CREATE INDEX IF NOT EXISTS ix_inventory_batches_location ON inventory_batches (location);

-- ---------------------------------------------------------------------------
-- 9. messages (FK → prescriptions, users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL       CONSTRAINT pk_messages PRIMARY KEY,
    prescription_fk BIGINT          NOT NULL,
    sender_fk       BIGINT          NOT NULL,
    content         TEXT            NOT NULL,
    timestamp       TIMESTAMP       NOT NULL DEFAULT current_timestamp,
    message_type    VARCHAR(30)     NOT NULL,
    CONSTRAINT fk_messages_prescription
        FOREIGN KEY (prescription_fk) REFERENCES prescriptions (id),
    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_fk) REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS ix_messages_prescription_fk ON messages (prescription_fk);
CREATE INDEX IF NOT EXISTS ix_messages_sender_fk ON messages (sender_fk);
