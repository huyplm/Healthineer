# Healthineer – System Context Document

> **Purpose**: Living document for AI agents and developers to quickly understand the full system.
> Updated after every architectural change. Read this FIRST before making changes.

---

## 1. System Overview

Hospital drug management and e-prescribing platform with AI-assisted clinical decision support.

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React 19 + TypeScript + Vite + MUI + React Query + React Router v7 | 5173 |
| Backend | Spring Boot 3.2.8 + Java 17+ + Maven Wrapper | 8080 (prod) / 8081 (local) |
| Database | PostgreSQL 16 (prod) / H2 in-memory (local dev) | 5432 |
| AI (LLM) | Groq Cloud API (Llama 3.3 70B) | external |
| AI (Drug data) | openFDA Drug Label API | external |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React SPA)                           │
│  src/ai/       → 6 hooks call backend API       │
│  src/api/      → apiFetch.ts (shared HTTP)      │
│  src/modules/  → UI pages per domain            │
│  src/auth/     → Mock login (localStorage)      │
└──────────────────┬──────────────────────────────┘
                   │ HTTP (JWT Bearer)
┌──────────────────▼──────────────────────────────┐
│  Backend (Spring Boot)                          │
│  presentation/  → REST controllers             │
│  domain/service → Business logic + AiService    │
│  infrastructure/                                │
│    ├── ai/      → GroqChatClient, OpenFdaClient │
│    ├── security → JWT, CORS, RateLimit          │
│    └── config/  → DataSeeder                    │
└──────────┬─────────────────┬────────────────────┘
           │                 │
    ┌──────▼──────┐   ┌─────▼──────┐
    │ PostgreSQL  │   │ Groq Cloud │
    │ / H2        │   │ openFDA    │
    └─────────────┘   └────────────┘
```

### Clean Architecture Layers

| Layer | Package | Responsibility |
|-------|---------|---------------|
| Presentation | `com.hospital.pharmacy.presentation` | REST controllers, exception handlers |
| Application | `com.hospital.pharmacy.application` | DTOs, mappers |
| Domain | `com.hospital.pharmacy.domain` | Entities, repositories, services |
| Infrastructure | `com.hospital.pharmacy.infrastructure` | Security, AI clients, config, seeder |

---

## 3. Domain Entities

| Entity | Table | Key Fields |
|--------|-------|------------|
| User | users | username, fullName, role (DOCTOR/PHARMACIST/ADMIN), department, passwordHash |
| Patient | patients | patientId, fullName, dateOfBirth, gender, allergies[], conditions[] |
| Allergy | allergies | allergenName, reaction (belongs to Patient) |
| Condition | conditions | conditionName, severity (belongs to Patient) |
| Medication | medications | medicationId, tradeName, activeIngredient, strength, dosageForm |
| Prescription | prescriptions | prescriptionId, patient, doctor, diagnosis, status, items[] |
| PrescriptionItem | prescription_items | medication, dose, frequency, durationDays, route |
| InventoryBatch | inventory_batches | medication, location, batchNumber, quantity, expiryDate |
| Message | messages | prescription, sender, content, timestamp |

### Prescription Lifecycle

```
DRAFT → SUBMITTED → REVIEWED → APPROVED → DISPENSED → COMPLETED
```

### User Roles & Access

| Role | Can do |
|------|--------|
| DOCTOR | Manage patients, create/submit prescriptions, view AI suggestions, chat |
| PHARMACIST | Review/approve/dispense prescriptions, manage inventory, chat |
| ADMIN | User management, medication catalog, inventory oversight |

---

## 4. API Endpoints

### Auth
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| POST | /api/auth/login | public | Returns JWT + user info |

### Patients
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/patients | JWT | List/search patients |
| GET | /api/patients/{id} | JWT | Get patient detail |
| POST | /api/patients | JWT | Create patient |
| PUT | /api/patients/{id} | JWT | Update patient |
| GET | /api/patients/{id}/allergies | JWT | Patient allergies |
| POST | /api/patients/{id}/allergies | JWT | Add allergy |
| GET | /api/patients/{id}/conditions | JWT | Patient conditions |

### Prescriptions
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/prescriptions/my | JWT | Doctor's prescriptions |
| GET | /api/prescriptions/{id} | JWT | Prescription detail |
| POST | /api/prescriptions | JWT | Create draft |
| PUT | /api/prescriptions/{id}/submit | JWT | Submit for review |
| PUT | /api/prescriptions/{id}/items | JWT | Update items |
| GET | /api/prescriptions/queue | JWT | Pharmacy queue |
| PUT | /api/prescriptions/{id}/review | JWT | Pharmacist review |
| PUT | /api/prescriptions/{id}/approve | JWT | Approve |
| PUT | /api/prescriptions/{id}/dispense | JWT | Dispense |

### Medications
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/medications | JWT | Search/list medications |
| GET | /api/medications/{id} | JWT | Medication detail |
| POST | /api/medications | JWT | Create medication |

### Inventory
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/inventory/{location} | JWT | Batches by location |
| GET | /api/inventory/medication/{id} | JWT | Batches by medication |
| POST | /api/inventory/batches | JWT | Add batch |
| PUT | /api/inventory/batches/{id}/adjust | JWT | Adjust quantity |
| GET | /api/inventory/expiry-risk | JWT | Expiry risk report |
| GET | /api/inventory/health | JWT | Inventory health |

### Messages
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/prescriptions/{id}/messages | JWT | Prescription messages |
| POST | /api/prescriptions/{id}/messages | JWT | Send message |

### AI (6 features)
| Verb | Path | Auth | Source | Description |
|------|------|------|--------|-------------|
| POST | /api/ai/prescriptions/suggest | JWT | Groq LLM | Smart prescription suggestions |
| POST | /api/ai/prescriptions/interactions | JWT | openFDA + Groq | Drug interaction check |
| GET | /api/ai/patients/{id}/adr-risk | JWT | Groq LLM | Adverse drug reaction risk score |
| GET | /api/ai/patients/{id}/summary | JWT | Groq LLM | AI patient summary |
| POST | /api/ai/chat | JWT | Groq LLM | Chat assistant for prescriptions |
| GET | /api/ai/inventory/forecast | JWT | Groq LLM | Inventory stockout/expiry forecast |

---

## 5. AI Integration Architecture

### Strategy: Real AI with Mock Fallback

```
Request → GROQ_API_KEY set? 
  ├─ Yes → Call Groq/openFDA → Success? → Return real AI response
  │                            └─ Fail + fallback=true → Return mock data
  └─ No → Return mock data (same as before integration)
```

### Backend Components

| File | Role |
|------|------|
| `AiConfigProperties.java` | Binds `app.ai.*` YAML config |
| `GroqChatClient.java` | HTTP client for Groq OpenAI-compatible API. Methods: `chat()`, `chatAsJson()` |
| `OpenFdaClient.java` | HTTP client for openFDA drug label API. Method: `checkInteractions()` |
| `AiService.java` | Orchestrator. Each method: try real → catch → fallback to mock. `@Transactional(readOnly=true)` |
| `AiController.java` | 6 REST endpoints, all `@PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")` |

### Frontend Hooks

Each hook calls backend API first, falls back to local mock if backend is unreachable:

| Hook | Backend Endpoint | Consumers |
|------|-----------------|-----------|
| `useAiSuggestPrescription` | POST /api/ai/prescriptions/suggest | CreatePrescription |
| `useAiCheckDrugInteractions` | POST /api/ai/prescriptions/interactions | CreatePrescription |
| `useAiAdrRisk` | GET /api/ai/patients/{id}/adr-risk | PrescriptionDetail, PatientDetail |
| `useAiPatientSummary` | GET /api/ai/patients/{id}/summary | PatientDetail |
| `useAiChatForPrescription` | POST /api/ai/chat | DiscussionPanel |
| `useAiInventoryForecast` | GET /api/ai/inventory/forecast | InventoryAIDashboard |

### Groq Prompt Design

Each AI method uses structured prompts that instruct the LLM to return JSON only (no markdown). The `extractJson()` utility strips any markdown code fences the LLM might add.

---

## 6. Frontend Route Map

| Path | Component | Role Access |
|------|-----------|-------------|
| /login | LoginPage | public |
| / | HomePage | all |
| /patients | PatientList | DOCTOR |
| /patients/new | PatientForm | DOCTOR |
| /patients/:id | PatientDetail | DOCTOR |
| /prescriptions | PrescriptionList | DOCTOR |
| /prescriptions/new | CreatePrescription | DOCTOR |
| /prescriptions/:id | PrescriptionDetail | DOCTOR, PHARMACIST |
| /medications | MedicationCatalog | PHARMACIST, ADMIN |
| /inventory | InventoryByLocation | PHARMACIST, ADMIN |
| /inventory/ai-dashboard | InventoryAIDashboard | PHARMACIST, ADMIN |
| /pharmacy/queue | PrescriptionQueue | PHARMACIST |
| /pharmacy/review/:id | PrescriptionReview | PHARMACIST |
| /pharmacy/dispense/:id | DispenseSummary | PHARMACIST |
| /chat | ChatInbox | DOCTOR, PHARMACIST |
| /admin/users | UserManagement | ADMIN |

---

## 7. Configuration

### Backend (application.yml)

```yaml
server.port: 8080                          # 8081 in local profile
spring.datasource.url: jdbc:postgresql://localhost:5432/hospital  # H2 in local
spring.jpa.hibernate.ddl-auto: update      # create-drop in local
spring.flyway.enabled: true                # false in local
app.jwt.secret: 0123456789abcdef...        # HMAC-SHA256, 32 chars
app.jwt.expiration-minutes: 180
app.rate-limit.requests-per-minute: 120
app.ai.groq.api-key: ${GROQ_API_KEY:}     # empty = mock mode
app.ai.groq.model: llama-3.3-70b-versatile
app.ai.groq.base-url: https://api.groq.com/openai/v1
app.ai.openfda.base-url: https://api.fda.gov/drug
app.ai.fallback-to-mock: true
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:8081
```

### Spring Profiles

| Profile | Database | AI | Use case |
|---------|----------|----|----------|
| (default) | PostgreSQL | mock (no key) | Production |
| local | H2 in-memory | Groq real (key in application-local.yml) | Dev/demo |

---

## 8. Security

- **JWT**: HMAC-SHA256, issued by `/api/auth/login`, 3h expiry
- **Role claims**: `role` field in JWT payload → Spring `ROLE_DOCTOR`, `ROLE_PHARMACIST`, `ROLE_ADMIN`
- **CORS**: allows `localhost:5173` and `127.0.0.1:5173`
- **Rate limiting**: 120 req/min per IP via `RateLimitFilter`
- **Swagger**: public at `/swagger-ui.html`
- **Actuator health**: public at `/actuator/health`

---

## 9. Data Seeding (DataSeeder.java)

On startup (if tables empty):
- 5 users: doctor1, doctor2, pharm1, pharm2, admin (all password: `password`)
- 10 patients with conditions (Diabetes/Hypertension alternating)
- 50 medications (Paracetamol, Amoxicillin, Metformin + generics)
- 50 inventory batches at "Central Pharmacy" (500 qty each, 12mo expiry)

---

## 10. File Structure Quick Reference

```
ProjectHealthineer/
├── .env                          # Frontend env (VITE_API_BASE_URL)
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── README.md
├── docs/
│   ├── SYSTEM_CONTEXT.md         # THIS FILE
│   ├── setup-local.md
│   └── postgres-schema.md
├── src/                          # Frontend (React)
│   ├── ai/                       # 6 AI hooks + types
│   ├── api/                      # apiFetch, client (mock), mockData
│   ├── auth/                     # AuthContext, LoginPage
│   ├── layout/                   # AppLayout (sidebar, topbar)
│   ├── modules/                  # Feature modules (patients, prescriptions, etc.)
│   ├── pages/                    # HomePage
│   ├── routes/                   # React Router config
│   └── types/                    # TypeScript interfaces
├── backend/                      # Backend (Spring Boot)
│   ├── pom.xml
│   ├── mvnw.cmd
│   └── src/main/java/com/hospital/pharmacy/
│       ├── presentation/         # REST controllers + exception handlers
│       ├── application/          # DTOs + mappers
│       ├── domain/
│       │   ├── model/            # JPA entities
│       │   ├── repository/       # Spring Data JPA interfaces
│       │   └── service/          # Business logic + AiService
│       └── infrastructure/
│           ├── ai/               # GroqChatClient, OpenFdaClient, AiConfigProperties
│           ├── security/         # SecurityConfig, JwtService, RateLimitFilter
│           └── config/           # DataSeeder
├── docker-compose.yml            # Optional (deploy only)
├── docker-compose.dev.yml        # Optional (deploy only)
└── backend/Dockerfile            # Optional (deploy only)
```

---

## 11. Changelog

| Date | Change | Files Affected |
|------|--------|----------------|
| 2026-03-20 | Initial project: React frontend with mock data, all 6 AI features mock | src/ |
| 2026-03-20 | Backend created: Spring Boot, Clean Architecture, JWT, all CRUD endpoints | backend/ |
| 2026-03-20 | Lombok removed, explicit getters/setters (Java 25 compat) | domain/model/*.java |
| 2026-03-20 | Maven Wrapper added, Docker refactored to optional | backend/mvnw.cmd, Dockerfiles |
| 2026-03-20 | Documentation: README, setup-local.md, postgres-schema.md | docs/, README.md |
| 2026-03-20 | Git init + pushed to github.com/huyplm/Healthineer | .gitignore |
| 2026-03-21 | **AI Integration**: Groq Cloud + openFDA replacing mock AI | See section 5 |
| 2026-03-21 | New: AiConfigProperties, GroqChatClient, OpenFdaClient | infrastructure/ai/ |
| 2026-03-21 | AiMockService → AiService (real + fallback) | domain/service/AiService.java |
| 2026-03-21 | 2 new endpoints: POST /api/ai/chat, GET /api/ai/inventory/forecast | presentation/AiController.java |
| 2026-03-21 | 5 new DTOs: AiChatRequest/Response, AiInventoryForecast* | application/dto/ai/ |
| 2026-03-21 | Frontend hooks → call backend API with apiFetch, fallback to mock | src/ai/*.ts, src/api/apiFetch.ts |
| 2026-03-21 | application-local.yml: H2 + Groq key, port 8081 | backend/src/main/resources/ |
| 2026-03-21 | @Transactional added to AiService (fix lazy loading) | domain/service/AiService.java |
| 2026-03-21 | H2 scope changed test→runtime in pom.xml | backend/pom.xml |
| 2026-03-21 | Created SYSTEM_CONTEXT.md + .cursor/rules | docs/, .cursor/rules/ |

---

## 12. Known Issues & Gotchas

1. **Frontend auth is mock-only**: Login stores user in localStorage, no real JWT flow. Backend JWT works via Swagger/curl. Frontend AI hooks pass token from `healthineer_token` localStorage key (not yet wired to login flow).
2. **Frontend ↔ Backend ID mismatch**: Frontend mock data uses string IDs (p1, m2). Backend uses Long numeric IDs. AI hooks convert with `Number(id)`, which returns 0 for non-numeric strings.
3. **Port conflict**: Default port 8080 may conflict with Apache httpd. Local profile uses 8081.
4. **Flyway**: Enabled by default, disabled in local profile. No migration files exist yet (relies on `ddl-auto: update`).
5. **Groq rate limit**: Free tier = 1,000 req/day for 70B model. Falls back to mock on rate limit errors.
6. **openFDA**: No API key needed, 40 req/min limit. Drug name matching is substring-based, may produce false positives.
