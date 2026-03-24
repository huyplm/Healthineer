# Healthineer – System Context Document

> **Purpose**: Living document for AI agents and developers to quickly understand the full system.
> Updated after every architectural change. Read this FIRST before making changes.

---

## 0. Guide for AI agents

Use this document as the **single source of truth** for architecture, boundaries, and known gaps. Prefer it over guessing from partial file reads.

### Suggested reading order

1. **Known Issues (section 14)** — Active limitations and partial mocks; avoids re-introducing fixed bugs.
2. **System overview + Architecture (sections 1–2)** — Stack, layers, and where packages live.
3. **Domain + API (sections 3–4)** — Entities, lifecycle, and REST contract (auth per endpoint).
4. **AI integration (section 5)** — Groq vs openFDA vs mock; JSON extraction gotchas.
5. **Frontend integration (section 6)** — Auth, adapters, prescription flows, lazy-loading.
6. **Implementation deep-dive (section 12)** — Prescription UI/adapter patterns, drawer layout, debounced hooks.
7. **File structure (section 11)** — Repo map.

### Mental model

| Topic | Rule |
|--------|------|
| **Source of truth** | PostgreSQL (prod) / H2 (local). REST API is canonical; `src/api/client.ts` maps DTOs and falls back to `mockData.ts` when the request fails. |
| **Authentication** | JWT from `POST /api/auth/login`. Stored in `localStorage` (`healthineer_token`). `apiFetch` sends `Authorization` unless `skipAuth: true` (login). |
| **Authorization** | Enforced on the **backend** with `@PreAuthorize`. The React router only wraps routes in `ProtectedRoute` (authenticated or not). **Role-based nav** is UX-only: `AppLayout` hides links a role should not see; a user can still type a URL—API calls will return **403** if forbidden. |
| **IDs** | Backend uses `Long`; frontend models use `string`. Adapters in `client.ts` use `String(id)`. |
| **UI language** | User-visible frontend strings are **English** (prescription forms, routes labels, mock prescription codes use `RX` prefix). |

### Common debugging entry points

| Symptom | Likely cause | Where to look |
|---------|----------------|---------------|
| Medication or patient name blank in tables | UI reading nested `item.medication` only; backend DTO is flat | `medicationName`, `patientName`, `doctorName` on responses; section 12.1 |
| Prescription detail infinite “Loading…” | `useQuery` error ignored, or backend 500 | `PrescriptionDetail.tsx`; backend `LazyInitializationException` (section 6.3) |
| AI suggestion row with empty drug autocomplete | ID mismatch or catalog gap | `AiService.suggestReal` + catalog; `CreatePrescription` resolvers (section 5 / 12) |
| Red “drug safety” panel flickering | Effect + unstable deps causing refetch loop | `useAiCheckDrugInteractions.ts` stable key + debounce (section 12.2) |
| Sidebar covers main content | Drawer `paper` width not synced with drawer root | `AppLayout.tsx` (section 12.3) |

### Safe-change boundaries

- **Architectural** change (new endpoint, entity, env var, AI provider): update **this file**, **changelog (section 13)**, and **Known Issues (section 14)** if behavior changes.
- **Secrets**: never commit `.env`, `application-local.yml`, or Groq keys. `application.yml` uses `${GROQ_API_KEY:}` only.

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

### Current Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend → Backend Auth | **Connected** | Real JWT login via POST /api/auth/login |
| Frontend → Backend CRUD | **Connected** | All CRUD calls go to backend with mock fallback |
| Frontend → Backend AI | **Connected** | 6 AI hooks call backend directly; backend handles fallback |
| Backend → Groq Cloud | **Connected** | Real AI responses with mock fallback on failure |
| Backend → openFDA | **Connected** | Real drug interaction data |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React SPA)                                   │
│  src/auth/     → JWT login (username/password → backend)│
│  src/api/      → apiFetch.ts (shared HTTP + JWT auth)   │
│  src/api/      → client.ts (backend API + mock fallback)│
│  src/ai/       → 6 hooks call backend AI endpoints      │
│  src/modules/  → UI pages per domain                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (JWT Bearer)
┌────────────────────────▼────────────────────────────────┐
│  Backend (Spring Boot)                                  │
│  presentation/  → 27 REST endpoints + exception mgmt   │
│  application/   → DTOs + response mappers              │
│  domain/service → Business logic + AiService           │
│  infrastructure/                                        │
│    ├── ai/      → GroqChatClient, OpenFdaClient        │
│    ├── security → JWT, CORS, RateLimit                 │
│    └── config/  → DataSeeder                           │
└──────────┬─────────────────┬────────────────────────────┘
           │                 │
    ┌──────▼──────┐   ┌─────▼──────────┐
    │ PostgreSQL  │   │  External APIs │
    │ / H2        │   │  ├─ Groq Cloud │
    └─────────────┘   │  └─ openFDA    │
                      └────────────────┘
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
  │         │           │          │           │
  Doctor   Doctor    Pharmacist  Pharmacist  Pharmacist
```

### User Roles & Access

| Role | Can do |
|------|--------|
| DOCTOR | Manage patients, create/submit prescriptions, view AI suggestions, chat |
| PHARMACIST | Review/approve/dispense prescriptions, manage inventory, chat |
| ADMIN | User management, medication catalog, inventory oversight |

---

## 4. API Endpoints

**27 endpoints** across 6 controllers. All require JWT unless marked public.

### Auth
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| POST | /api/auth/login | public | Returns JWT (`accessToken`) + user info |

### Patients
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/patients | JWT | List/search patients (paginated) |
| GET | /api/patients/{id} | JWT | Get patient detail |
| POST | /api/patients | JWT | Create patient |
| PUT | /api/patients/{id} | JWT | Update patient |
| GET | /api/patients/{id}/allergies | JWT | Patient allergies |
| POST | /api/patients/{id}/allergies | JWT | Add allergy |
| GET | /api/patients/{id}/conditions | JWT | Patient conditions |

### Prescriptions
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/prescriptions/my | JWT | Doctor's prescriptions (paginated) |
| GET | /api/prescriptions/{id} | JWT | Prescription detail with items |
| POST | /api/prescriptions | JWT | Create **draft** only (ignores any client "status" field) |
| PUT | /api/prescriptions/{id}/submit | JWT | Submit for review (doctor) |
| PUT | /api/prescriptions/{id}/items | JWT | Replace line items (doctor, draft) |
| GET | /api/prescriptions/queue | JWT | Pharmacy queue (paginated) |
| PUT | /api/prescriptions/{id}/review | JWT | Pharmacist review |
| PUT | /api/prescriptions/{id}/approve | JWT | Approve |
| PUT | /api/prescriptions/{id}/dispense | JWT | Dispense |

**Frontend `prescriptionsApi.update`:** maps `status` values to the PUT paths above (`submitted` → `/submit`, `reviewed` → `/review`, etc.) and uses `/items` when the payload includes `items`.

### Medications
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/medications | JWT | Search/list medications (`?q=` + paginated) |
| GET | /api/medications/{id} | JWT | Medication detail |
| POST | /api/medications | JWT | Create medication (pharmacist/admin) |

There is **no** update/delete endpoint; frontend `medicationsApi.update` touches mock data only.

### Inventory
| Verb | Path | Auth | Description |
|------|------|------|-------------|
| GET | /api/inventory/{location} | JWT | Batches by location |
| GET | /api/inventory/medication/{id} | JWT | Batches by medication |
| POST | /api/inventory/batches | JWT | Add batch |
| PUT | /api/inventory/batches/{id}/adjust | JWT | Adjust quantity (`?delta=`) |
| GET | /api/inventory/expiry-risk | JWT | Expiry risk report |
| GET | /api/inventory/health | public | Inventory health overview |

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

### Strategy: Real AI with Backend Fallback

```
Frontend hook → apiFetch (with JWT) → Backend AiController
                                          │
                                    AiService method
                                          │
                                 GROQ_API_KEY set?
                                   ├─ Yes → Call Groq/openFDA
                                   │        ├─ Success → Return real AI response
                                   │        └─ Fail + fallback=true → Return mock
                                   └─ No → Return mock data
```

**Key change (Phase 2):** Frontend AI hooks no longer have local mock fallbacks. All AI logic is handled by the backend's `AiService`, which decides whether to use real AI or mock data. This avoids duplicating fallback logic across 6 hooks.

### Backend AI Components

| File | Role |
|------|------|
| `AiConfigProperties.java` | Binds `app.ai.*` YAML config. Method `isRealAiEnabled()` checks if API key is present |
| `GroqChatClient.java` | HTTP client for Groq OpenAI-compatible API. Methods: `chat()`, `chatAsJson()`. Includes `extractJsonBlock()` for cleaning LLM responses |
| `OpenFdaClient.java` | HTTP client for openFDA drug label API. Method: `checkInteractions()` |
| `AiService.java` | Orchestrator. Each method: try real → catch → fallback to mock. `@Transactional(readOnly=true)` |
| `AiController.java` | 6 REST endpoints, all `@PreAuthorize("hasAnyRole('DOCTOR','PHARMACIST','ADMIN')")` |

### Frontend AI Hooks

Each hook calls backend API directly via `apiFetch` (with JWT). No local fallback.

| Hook | Backend Endpoint | Consumers |
|------|-----------------|-----------|
| `useAiSuggestPrescription` | POST /api/ai/prescriptions/suggest | CreatePrescription |
| `useAiCheckDrugInteractions` | POST /api/ai/prescriptions/interactions | CreatePrescription |
| `useAiAdrRisk` | GET /api/ai/patients/{id}/adr-risk | PrescriptionDetail, PatientDetail |
| `useAiPatientSummary` | GET /api/ai/patients/{id}/summary | PatientDetail |
| `useAiChatForPrescription` | POST /api/ai/chat | DiscussionPanel |
| `useAiInventoryForecast` | GET /api/ai/inventory/forecast | InventoryAIDashboard |

### Groq Prompt Design

Each AI method uses structured prompts that instruct the LLM to return JSON only (no markdown). The `extractJsonBlock()` / `extractJson()` utilities strip markdown code fences and choose the **earlier** of `[` or `{` as the JSON start (fix: do not always prefer `[` or nested arrays break object parsing).

### Prescription suggestions (catalog enforcement)

`AiService.suggestReal` loads the active medication list, embeds **id|tradeName|activeIngredient|strength** in the prompt, and instructs the model to return **only** catalog `medicationId` values. `resolveAndValidateIds` post-processes the JSON list to fix or match IDs by name when the model drifts. This keeps autocomplete and persistence aligned with `Medication` rows (seed list in `DataSeeder`).

---

## 6. Frontend–Backend Integration

### Auth Flow

```
LoginPage (username + password)
  → apiFetch('/api/auth/login', { skipAuth: true })
  → Backend returns { accessToken, tokenType, userId, username, fullName, role }
  → Store accessToken in localStorage('healthineer_token')
  → Store user info in localStorage('healthineer_auth')
  → All subsequent apiFetch calls include Authorization: Bearer <token>
```

- `apiFetch` supports `skipAuth: true` option to prevent stale JWTs from being sent during login
- On logout, both `healthineer_token` and `healthineer_auth` are cleared, and user is navigated to `/login`

### CRUD API Client (src/api/client.ts)

The client layer sits between UI components and the backend:

```
UI Component → client.ts API function → apiFetch → Backend REST endpoint
                     │                                      │
                     └── catch → mock fallback ─────────────┘
```

**Adapter pattern:** 15+ mapper functions convert backend DTOs (Java records with `Long` IDs) to frontend TypeScript types (with `string` IDs). Key mappings:

| Backend DTO | Frontend Type | ID Mapping |
|-------------|---------------|-----------|
| `PatientResponse { id: Long }` | `Patient { id: string }` | `String(backend.id)` |
| `PrescriptionResponse { id: Long }` | `Prescription { id: string }` | `String(backend.id)` |
| `MedicationResponse { id: Long }` | `Medication { id: string }` | `String(backend.id)` |
| `InventoryBatchResponse` | `MedicationBatch` | `String(backend.id)` |
| `MessageResponse` | `Message` | `String(backend.id)` |

Backend paginated responses (`Page<T>`) are unwrapped from `{ content: T[], totalElements, ... }`.

---

## 7. Frontend Route Map

All routes below `/` require authentication (`ProtectedRoute`). **Role column = primary nav audience**; backend still enforces roles on API calls.

| Path | Component | Primary role(s) |
|------|-----------|-----------------|
| /login | LoginPage | public |
| / | HomePage | any authenticated |
| /patients | PatientList | doctor |
| /patients/new | PatientForm | doctor |
| /patients/:id | PatientDetail | doctor |
| /patients/:id/edit | PatientForm | doctor |
| /prescriptions | PrescriptionList | doctor |
| /prescriptions/new | CreatePrescription | doctor |
| /prescriptions/:id/edit | EditPrescription | doctor |
| /prescriptions/:id | PrescriptionDetail | doctor/pharmacist |
| /medications | MedicationCatalog | pharmacist, admin |
| /inventory | InventoryByLocation | pharmacist, admin |
| /inventory/ai-dashboard | InventoryAIDashboard | pharmacist, admin |
| /inventory/:medicationId | InventoryDetail | pharmacist, admin |
| /pharmacy/queue | PrescriptionQueue | pharmacist |
| /pharmacy/review/:id | PrescriptionReview | pharmacist |
| /pharmacy/dispense/:id | DispenseSummary | pharmacist |
| /chat | ChatInbox | doctor, pharmacist |
| /admin/users | UserManagement | admin |

---

## 8. Configuration

### Backend (application.yml)

```yaml
server.port: 8080                          # 8081 in local profile
spring.datasource.url: jdbc:postgresql://localhost:5432/hospital  # H2 in local
spring.jpa.hibernate.ddl-auto: update      # create-drop in local
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

| Profile | Database | AI | Port | Use case |
|---------|----------|----|------|----------|
| (default) | PostgreSQL | mock (no key) | 8080 | Production |
| local | H2 in-memory | Groq real (key in application-local.yml) | 8081 | Dev/demo |

### Key localStorage Keys

| Key | Written by | Read by | Content |
|-----|-----------|---------|---------|
| `healthineer_token` | AuthContext (login) | apiFetch (every request) | JWT access token string |
| `healthineer_auth` | AuthContext (login) | AuthContext (page reload) | `{ user: { id, name, role, email } }` |

### Route Protection

`ProtectedRoute` component in `src/routes/index.tsx` uses `useAuth()` hook (subscribes to AuthContext state). When `isAuthenticated` becomes `false` (logout), the guard reactively redirects to `/login`. Logout in `AppLayout` also explicitly navigates to `/login`.

**Additional routes** (not all listed in the table in section 7): `patients/:id/edit` → `PatientForm`; `prescriptions/:id/edit` → `EditPrescription`; `inventory/:medicationId` → `InventoryDetail`. Catch-all `*` redirects to `/`.

### 6.2 Adapter: flat prescription DTOs vs nested frontend types

`PrescriptionResponse` and `PrescriptionItemResponse` expose **flat** strings from the mapper (`patientName`, `doctorName`, `medicationName`, `dose` as a single field). The frontend `Prescription` / `PrescriptionItem` types also allow nested `patient` / `doctor` / `medication` for **mock** fallback data.

**Rule for UI:** always display names with a fallback chain, e.g.  
`item.medicationName || item.medication?.tradeName || '—'` and  
`prescription.patientName || prescription.patient?.fullName`.  
Used in: `PrescriptionDetail`, `PrescriptionReview`, `DispenseSummary`, `PrescriptionQueue`, `PrescriptionList`.

**`toPrescriptionItem` (`client.ts`)**: backend `dose` may combine number + unit (e.g. `500 mg`). The adapter parses with `/^([\d.]+)\s*(.*)$/` so `dose` and `unit` are not duplicated in the table (avoid showing `500 500`).

### 6.3 JPA, transactions, and lazy loading

`spring.jpa.open-in-view` is **`false`** in `application.yml`. Controllers therefore run **outside** a Hibernate session when serializing.

`PrescriptionService` read methods (`get`, `myPrescriptions`, `queue`) are annotated `@Transactional(readOnly = true)` and call `initializeLazyRelations(p)` to touch `patient`, `doctor`, and each item’s `medication` **inside** the transaction so `ResponseMapper` never triggers `LazyInitializationException`.

If a new endpoint returns entities with lazy associations, either use a read-only transaction + explicit initialization, DTO projections, or `JOIN FETCH` in the repository query.

### 6.4 Prescription create + submit (frontend)

`POST /api/prescriptions` always creates a **DRAFT** (`createDraft`). There is **no** status field on that request that changes behavior.

**Submit to pharmacy:** after a successful create, the client must call **`PUT /api/prescriptions/{id}/submit`**. `prescriptionsApi.update(id, { status: 'submitted' })` maps to that endpoint in `client.ts`. The create-prescription screen uses a two-step mutation: create draft, then submit if the user chose “Submit to Pharmacy”.

---

## 9. Security

- **Authentication**: JWT (HMAC-SHA256), issued by `POST /api/auth/login`, 3h expiry
- **Authorization**: Role claims in JWT → Spring `ROLE_DOCTOR`, `ROLE_PHARMACIST`, `ROLE_ADMIN`
- **Password storage**: bcrypt via `BCryptPasswordEncoder`
- **CORS**: allows `localhost:5173` and `127.0.0.1:5173`
- **Rate limiting**: 120 req/min per IP via `RateLimitFilter`
- **Public endpoints**: `/api/auth/login`, `/swagger-ui/**`, `/v3/api-docs/**`, `/actuator/health`, `/api/inventory/health`
- **Login safety**: `apiFetch` clears stale token and uses `skipAuth: true` for login requests to prevent Spring Security from rejecting requests with expired JWTs

---

## 10. Data Seeding (DataSeeder.java)

On startup (if tables empty):
- 5 users: doctor1, doctor2, pharm1, pharm2, admin (all password: `password`)
- 10 patients with conditions (Diabetes/Hypertension alternating)
- 50 medications (Paracetamol, Amoxicillin, Metformin + generics)
- 50 inventory batches at "Central Pharmacy" (500 qty each, 12mo expiry)

---

## 11. File Structure Quick Reference

```
ProjectHealthineer/
├── .env                          # Frontend env (VITE_API_BASE_URL)
├── .gitignore                    # Includes .env, application-local.yml, target/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── README.md                     # Project showcase with all features
├── docs/
│   ├── SYSTEM_CONTEXT.md         # THIS FILE
│   ├── setup-local.md
│   └── postgres-schema.md
├── src/                          # Frontend (React)
│   ├── ai/                       # 6 AI hooks (call backend directly) + types
│   ├── api/
│   │   ├── apiFetch.ts           # Shared HTTP client with JWT auth + skipAuth
│   │   ├── client.ts             # Backend API calls + adapter layer + mock fallback
│   │   ├── mockData.ts           # Fallback mock data
│   │   └── index.ts              # Barrel exports
│   ├── auth/
│   │   ├── AuthContext.tsx        # JWT login via backend, token management
│   │   └── LoginPage.tsx         # Username/password form + quick login buttons
│   ├── layout/                   # AppLayout (sidebar, topbar)
│   ├── modules/                  # Feature modules (patients, prescriptions, etc.)
│   ├── pages/                    # HomePage
│   ├── routes/                   # React Router config
│   └── types/                    # TypeScript interfaces (string IDs, relaxed types)
├── backend/                      # Backend (Spring Boot)
│   ├── pom.xml
│   ├── mvnw.cmd
│   └── src/main/java/com/hospital/pharmacy/
│       ├── presentation/         # REST controllers + exception handlers
│       ├── application/          # DTOs + ResponseMapper
│       ├── domain/
│       │   ├── model/            # JPA entities
│       │   ├── repository/       # Spring Data JPA interfaces
│       │   └── service/          # Business logic + AiService
│       └── infrastructure/
│           ├── ai/               # GroqChatClient, OpenFdaClient, AiConfigProperties
│           ├── security/         # SecurityConfig, JwtService, RateLimitFilter
│           └── config/           # DataSeeder
└── .cursor/rules/                # Cursor IDE rules for AI agents
```

---

## 12. Implementation deep-dive

Short reference for agents changing UI, API adapters, or AI behavior.

### 12.1 Prescription list/detail UI and adapters

- Prefer **flat** backend fields for display: `medicationName`, `patientName`, `doctorName`.
- Mock path enriches nested objects; real API path may leave nested graphs unset—do not rely on them alone.
- Clinical note mapping: frontend often uses `clinicalNotes` (plural) in forms; backend DTO field is `clinicalNote` (singular)—`client.ts` maps between them.

### 12.2 `useAiCheckDrugInteractions`

Uses a **stable key** from `patientId` + sorted `medicationId` list, debounced (~800ms), and `lastKeyRef` to avoid rapid refetches when parent re-renders recreate array references. Prevents flicker in the red/amber alert strip on `CreatePrescription`.

### 12.3 `AppLayout` permanent drawer

`MuiDrawer` root and `.MuiDrawer-paper` widths stay in sync (`open ? DRAWER_WIDTH : 0`, constant `260` in `AppLayout.tsx`) with `overflowX: hidden` so the sidebar **pushes** main content instead of overlapping when open.

### 12.4 `CreatePrescription` AI row → form

`normalizeFrequency` / `normalizeRoute` map free-text AI output to select values (`1x`, `2x`, …, `oral`, …). `resolveMedicationId` matches string or numeric IDs against the loaded medication list. Default non-mg unit from suggestions is **`tablet`** (English).

---

## 13. Changelog

| Date | Change | Files Affected |
|------|--------|----------------|
| 2026-03-20 | Initial project: React frontend with mock data, all 6 AI features mock | src/ |
| 2026-03-20 | Backend created: Spring Boot, Clean Architecture, JWT, all CRUD endpoints | backend/ |
| 2026-03-20 | Lombok removed, explicit getters/setters (Java 25 compat) | domain/model/*.java |
| 2026-03-20 | Maven Wrapper added, Docker refactored to optional | backend/mvnw.cmd, Dockerfiles |
| 2026-03-20 | Documentation: README, setup-local.md, postgres-schema.md | docs/, README.md |
| 2026-03-20 | Git init + pushed to github.com/huyplm/Healthineer | .gitignore |
| 2026-03-21 | **Phase 1 – AI Integration**: Groq Cloud + openFDA replacing mock AI | See section 5 |
| 2026-03-21 | New: AiConfigProperties, GroqChatClient, OpenFdaClient | infrastructure/ai/ |
| 2026-03-21 | AiMockService → AiService (real + fallback) | domain/service/AiService.java |
| 2026-03-21 | 2 new endpoints: POST /api/ai/chat, GET /api/ai/inventory/forecast | presentation/AiController.java |
| 2026-03-21 | 5 new DTOs: AiChatRequest/Response, AiInventoryForecast* | application/dto/ai/ |
| 2026-03-21 | Frontend hooks → call backend API with apiFetch, fallback to mock | src/ai/*.ts, src/api/apiFetch.ts |
| 2026-03-21 | application-local.yml: H2 + Groq key, port 8081 | backend/src/main/resources/ |
| 2026-03-21 | @Transactional added to AiService (fix lazy loading) | domain/service/AiService.java |
| 2026-03-21 | H2 scope changed test→runtime in pom.xml | backend/pom.xml |
| 2026-03-21 | Created SYSTEM_CONTEXT.md + .cursor/rules | docs/, .cursor/rules/ |
| 2026-03-21 | **Phase 2 – Full Frontend↔Backend Integration** | See below |
| 2026-03-21 | Auth: LoginPage → real backend login, JWT stored in localStorage | src/auth/ |
| 2026-03-21 | apiFetch: Added `skipAuth` option to prevent stale JWT on login | src/api/apiFetch.ts |
| 2026-03-21 | client.ts: Replaced all mock CRUD with real backend API calls | src/api/client.ts |
| 2026-03-21 | client.ts: 15+ adapter functions mapping backend DTOs → frontend types | src/api/client.ts |
| 2026-03-21 | AI hooks: Removed local mock fallbacks, backend handles all fallback | src/ai/*.ts |
| 2026-03-21 | Types: Relaxed for backend compat (optional fields, string unions) | src/types/index.ts |
| 2026-03-21 | Fix: `extractJsonBlock` picking `[` inside object before root `{` | GroqChatClient.java, AiService.java |
| 2026-03-21 | README: Complete rewrite with features, metrics, architecture | README.md |
| 2026-03-23 | Fix: ProtectedRoute now uses `useAuth()` instead of reading localStorage directly | src/routes/index.tsx |
| 2026-03-23 | Fix: Logout button navigates to `/login` after clearing auth state | src/layout/AppLayout.tsx |
| 2026-03-23 | Fix: Prescription reads—`@Transactional` + `initializeLazyRelations` (open-in-view off) | PrescriptionService.java |
| 2026-03-23 | Fix: Submit flow—create draft then `PUT .../submit`; detail page error state | CreatePrescription.tsx, client.ts, PrescriptionDetail.tsx |
| 2026-03-23 | Fix: Empty medication column—flat DTO fields + dose/unit parse in adapter | client.ts, prescription/pharmacy views |
| 2026-03-23 | Fix: AI interaction panel flicker—stable key + debounce | useAiCheckDrugInteractions.ts |
| 2026-03-24 | Fix: Permanent drawer paper width synced with drawer (no overlay on content) | AppLayout.tsx |
| 2026-03-24 | UI: Vietnamese strings replaced with English across prescription/inventory/AI types | src/modules/prescriptions/*.tsx, mockData, client, InventoryAIDashboard, ai/types.ts |
| 2026-03-24 | Docs: SYSTEM_CONTEXT expanded for AI agent onboarding and deep-dive sections | docs/SYSTEM_CONTEXT.md |

---

## 14. Known Issues & Gotchas

### Resolved (Phase 2+)

1. ~~**Frontend auth is mock-only**~~ → Real JWT login; token in `healthineer_token`.
2. ~~**Frontend ↔ Backend ID mismatch**~~ → Adapters in `client.ts` (`Long` → `string`).
3. ~~**Logout screen freeze**~~ → `ProtectedRoute` uses `useAuth()`; logout navigates to `/login`.
4. ~~**Prescription detail 500 / empty names**~~ → `PrescriptionService` read transactions + lazy init; UI uses flat `medicationName` / `patientName`; dose parsed in adapter.
5. ~~**AI interaction UI flicker**~~ → Debounced `useAiCheckDrugInteractions` with stable dependency key.
6. ~~**Sidebar overlapping content**~~ → Drawer root and paper widths synchronized when toggling.

### Active

1. **Port conflict**: Default backend port 8080 may be busy; **local** profile uses **8081** (must match `VITE_API_BASE_URL`).
2. **Flyway**: On in default profile, **off** in local. Schema driven by Hibernate `ddl-auto`; no versioned migrations checked in.
3. **Groq rate limit**: Free tier limits apply; failures can yield mock responses when `fallback-to-mock: true`.
4. **openFDA**: Public API, rate limited; heuristic name matching may mis-match or miss interactions.
5. **Chat/Messaging**: Conversation-style helpers in `client.ts` may still use **mock**; REST messages are per-prescription only.
6. **Users API**: Listing users may be **mock**—no dedicated admin users list endpoint matching the UI in some paths.
7. **Inventory locations**: `getLocations()` may be **mock**; backend stores location as string on batches.
8. **Medication update**: `medicationsApi.update` is **mock-only** (no `PUT /api/medications/{id}`; `MedicationController` exposes GET, POST, GET by id only).
9. **JWT refresh**: No silent refresh; ~3h expiry, then re-login. Failed 401/403 does not auto-redirect to login in `apiFetch`.
10. **Router vs API roles**: Typing URLs does not hide pages; **403** from API is expected for wrong role.
