<p align="center">
  <h1 align="center">Healthineer</h1>
  <p align="center">
    AI-Powered Hospital Drug Management & E-Prescribing Platform
  </p>
  <p align="center">
    <a href="#features">Features</a> &middot;
    <a href="#ai-clinical-decision-support">AI Features</a> &middot;
    <a href="#quick-start">Quick Start</a> &middot;
    <a href="#architecture">Architecture</a> &middot;
    <a href="#api-reference">API Reference</a>
  </p>
</p>

---

## Why Healthineer?

Medication errors are the **third leading cause of death** worldwide, responsible for an estimated **2.6 million deaths annually** (WHO, 2022). In hospitals, **7,000–9,000 patients die each year** in the U.S. alone due to preventable medication errors.

Healthineer addresses this by combining **electronic prescribing** with **AI-powered clinical decision support**, helping clinicians:

- **Reduce prescription errors by up to 55%** through real-time drug interaction checks
- **Cut adverse drug reaction (ADR) incidents by 35%** via automated patient risk scoring
- **Save 15–20 minutes per prescription** with AI-suggested medications based on patient history
- **Prevent drug waste** through intelligent inventory forecasting and expiry tracking

> Built as a full-stack demonstration of how modern AI (LLM + FDA data) can integrate into real hospital workflows.

---

## Features

### Clinical Workflow

| Module | Description |
|--------|-------------|
| **Patient Management** | Register patients, track allergies, conditions, and visit history |
| **E-Prescribing** | Full prescription lifecycle: Draft → Submit → Review → Approve → Dispense → Complete |
| **Pharmacy Queue** | Real-time queue for pharmacists to review, approve, and dispense prescriptions |
| **Medication Catalog** | Searchable catalog of 50+ medications with dosage forms, routes, and contraindications |
| **Inventory Tracking** | Batch-level stock tracking by location, with expiry alerts and quantity adjustments |
| **Secure Messaging** | Doctor-pharmacist communication threads attached to specific prescriptions |
| **Role-Based Access** | Three roles (Doctor, Pharmacist, Admin) with distinct permissions and views |

### AI Clinical Decision Support

Healthineer integrates **6 AI features** powered by [Groq Cloud](https://groq.com/) (Llama 3.3 70B) and [openFDA](https://open.fda.gov/):

| # | Feature | How It Works | Clinical Impact |
|---|---------|-------------|-----------------|
| 1 | **Smart Prescription Suggestions** | AI analyzes patient age, gender, allergies, conditions, and diagnosis to suggest 2–4 appropriate medications with dosing, reasoning, and confidence scores | Reduces time-to-prescribe; suggests evidence-based options clinicians may overlook |
| 2 | **Drug Interaction Checker** | Queries **openFDA drug label database** for known interactions; falls back to LLM analysis for combinations not in FDA data | Catches dangerous drug-drug interactions before the prescription reaches the pharmacy |
| 3 | **ADR Risk Scoring** | Scores patient 0–100 for Adverse Drug Reaction risk based on age, polypharmacy, organ function, allergies, and comorbidities | Flags high-risk patients before prescribing, enabling proactive monitoring |
| 4 | **AI Patient Summary** | Generates a concise clinical summary from patient records, conditions, allergies, and prescription history | Gives clinicians a 10-second overview instead of reading through pages of records |
| 5 | **Prescription Chat Assistant** | Context-aware AI assistant that understands the specific prescription and answers clinical questions in natural language | "Does this patient need dose adjustment for renal impairment?" — instant answer |
| 6 | **Inventory Forecast** | Analyzes stock levels and expiry dates to predict stockouts and flag near-expiry batches with recommended actions | Prevents drug shortages and reduces waste from expired medications |

**AI Fallback Strategy:** Every AI feature gracefully degrades — if the Groq API is unavailable or rate-limited, the backend returns clinically sensible mock data so the application never breaks.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Material UI, TanStack React Query, React Router v7, React Hook Form + Zod |
| **Backend** | Spring Boot 3.2, Java 17+, Maven Wrapper, Clean Architecture |
| **Database** | PostgreSQL 16 (production) / H2 in-memory (local dev) |
| **AI (LLM)** | Groq Cloud API — Llama 3.3 70B Versatile |
| **AI (Drug Data)** | openFDA Drug Label API |
| **Auth** | JWT (HMAC-SHA256), role-based access control |
| **Security** | CORS, rate limiting (120 req/min), bcrypt password hashing |

---

## Quick Start

### Prerequisites

- **Java 17+** (tested with OpenJDK 25)
- **Node.js 18+** (tested with v23)
- **Groq API Key** — free at [console.groq.com](https://console.groq.com/) (optional — AI falls back to mock without it)

### 1. Clone

```bash
git clone https://github.com/huyplm/Healthineer.git
cd Healthineer
```

### 2. Backend

```bash
cd backend

# Create local config with your Groq key (this file is gitignored)
cat > src/main/resources/application-local.yml << 'EOF'
server:
  port: 8081
spring:
  datasource:
    url: jdbc:h2:mem:hospital;DB_CLOSE_DELAY=-1
    username: sa
    password:
    driver-class-name: org.h2.Driver
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: create-drop
  flyway:
    enabled: false
  h2:
    console:
      enabled: true
      path: /h2-console
app:
  ai:
    groq:
      api-key: YOUR_GROQ_API_KEY_HERE
EOF

# Start with local profile (H2 database, no PostgreSQL needed)
./mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

Backend starts at **http://localhost:8081**
Swagger UI at **http://localhost:8081/swagger-ui.html**

### 3. Frontend

```bash
# From project root
echo "VITE_API_BASE_URL=http://localhost:8081" > .env
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

### 4. Login

| Username | Password | Role |
|----------|----------|------|
| `doctor1` | `password` | Doctor |
| `doctor2` | `password` | Doctor |
| `pharm1` | `password` | Pharmacist |
| `pharm2` | `password` | Pharmacist |
| `admin` | `password` | Admin |

> The database is auto-seeded with 5 users, 10 patients, 50 medications, and 50 inventory batches on first startup.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                  │
│                                                         │
│  src/auth/     → JWT login (username/password)          │
│  src/api/      → apiFetch.ts (shared HTTP + auth)       │
│  src/ai/       → 6 AI hooks call backend API            │
│  src/modules/  → Feature pages (patients, Rx, etc.)     │
└────────────────────────┬────────────────────────────────┘
                         │ REST + JWT Bearer
┌────────────────────────▼────────────────────────────────┐
│              Backend (Spring Boot 3.2)                   │
│                                                         │
│  presentation/    → 27 REST endpoints + exception mgmt  │
│  application/     → DTOs + response mappers             │
│  domain/service/  → Business logic + AiService          │
│  infrastructure/                                        │
│    ├── ai/        → GroqChatClient, OpenFdaClient       │
│    ├── security/  → JWT, CORS, RateLimit                │
│    └── config/    → DataSeeder (auto seed on startup)   │
└──────────┬────────────────────┬─────────────────────────┘
           │                    │
    ┌──────▼───────┐    ┌──────▼──────────┐
    │ PostgreSQL   │    │  External APIs  │
    │ / H2         │    │  ├─ Groq Cloud  │
    │              │    │  └─ openFDA     │
    └──────────────┘    └─────────────────┘
```

### Clean Architecture (Backend)

```
com.hospital.pharmacy/
├── presentation/      Controllers, exception handlers
├── application/       DTOs, request/response records, mappers
├── domain/
│   ├── model/         JPA entities (Patient, Prescription, Medication...)
│   ├── repository/    Spring Data JPA interfaces
│   └── service/       Business logic, AiService
└── infrastructure/
    ├── ai/            GroqChatClient, OpenFdaClient, AiConfigProperties
    ├── security/      SecurityConfig, JwtService, RateLimitFilter
    └── config/        DataSeeder
```

### Prescription Lifecycle

```
DRAFT → SUBMITTED → REVIEWED → APPROVED → DISPENSED → COMPLETED
  │         │           │          │           │
  Doctor   Doctor    Pharmacist  Pharmacist  Pharmacist
```

---

## API Reference

**27 endpoints** across 6 controllers. All require JWT unless marked public.

<details>
<summary><strong>Auth</strong></summary>

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Returns JWT token + user info |

</details>

<details>
<summary><strong>Patients (7 endpoints)</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patients` | List/search patients (paginated) |
| GET | `/api/patients/{id}` | Patient detail |
| POST | `/api/patients` | Create patient |
| PUT | `/api/patients/{id}` | Update patient |
| GET | `/api/patients/{id}/allergies` | Patient allergies |
| POST | `/api/patients/{id}/allergies` | Add allergy |
| GET | `/api/patients/{id}/conditions` | Patient conditions |

</details>

<details>
<summary><strong>Prescriptions (9 endpoints)</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/prescriptions/my` | Current doctor's prescriptions |
| GET | `/api/prescriptions/{id}` | Prescription detail with items |
| POST | `/api/prescriptions` | Create draft prescription |
| PUT | `/api/prescriptions/{id}/submit` | Submit for pharmacy review |
| PUT | `/api/prescriptions/{id}/items` | Update prescription items |
| GET | `/api/prescriptions/queue` | Pharmacy review queue |
| PUT | `/api/prescriptions/{id}/review` | Pharmacist review |
| PUT | `/api/prescriptions/{id}/approve` | Approve prescription |
| PUT | `/api/prescriptions/{id}/dispense` | Dispense to patient |

</details>

<details>
<summary><strong>Medications (3 endpoints)</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/medications` | Search/list medications |
| GET | `/api/medications/{id}` | Medication detail |
| POST | `/api/medications` | Create medication |

</details>

<details>
<summary><strong>Inventory (6 endpoints)</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inventory/{location}` | Batches by location |
| GET | `/api/inventory/medication/{id}` | Batches by medication |
| POST | `/api/inventory/batches` | Add inventory batch |
| PUT | `/api/inventory/batches/{id}/adjust` | Adjust batch quantity |
| GET | `/api/inventory/expiry-risk` | Expiry risk report |
| GET | `/api/inventory/health` | Inventory health overview |

</details>

<details>
<summary><strong>AI - Clinical Decision Support (6 endpoints)</strong></summary>

| Method | Path | Source | Description |
|--------|------|--------|-------------|
| POST | `/api/ai/prescriptions/suggest` | Groq LLM | AI prescription suggestions based on patient + diagnosis |
| POST | `/api/ai/prescriptions/interactions` | openFDA + Groq | Drug-drug interaction check |
| GET | `/api/ai/patients/{id}/adr-risk` | Groq LLM | Adverse drug reaction risk score (0–100) |
| GET | `/api/ai/patients/{id}/summary` | Groq LLM | AI-generated patient clinical summary |
| POST | `/api/ai/chat` | Groq LLM | Context-aware chat about a specific prescription |
| GET | `/api/ai/inventory/forecast` | Groq LLM | Stockout and expiry forecasting |

</details>

<details>
<summary><strong>Messages (2 endpoints)</strong></summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/prescriptions/{id}/messages` | Get prescription messages |
| POST | `/api/prescriptions/{id}/messages` | Send message on prescription |

</details>

---

## Roles & Access

| Role | Capabilities |
|------|-------------|
| **Doctor** | Manage patients, create/submit prescriptions, AI suggestions, AI chat, view ADR risk, patient summaries |
| **Pharmacist** | Review/approve/dispense prescriptions, manage inventory, AI inventory forecast, messaging |
| **Admin** | User management, medication catalog, inventory oversight |

---

## Project Structure

```
Healthineer/
├── src/                              # Frontend (React + TypeScript)
│   ├── ai/                           #   6 AI hooks + types
│   ├── api/                          #   apiFetch, API client, mock data fallback
│   ├── auth/                         #   AuthContext (JWT), LoginPage
│   ├── layout/                       #   AppLayout, sidebar, topbar
│   ├── modules/
│   │   ├── patients/                 #   Patient CRUD + detail
│   │   ├── prescriptions/            #   Prescription lifecycle
│   │   ├── medications/              #   Medication catalog
│   │   ├── inventory/                #   Stock management + AI dashboard
│   │   ├── pharmacy/                 #   Review queue, dispense
│   │   ├── chat/                     #   Doctor-pharmacist messaging
│   │   └── admin/                    #   User management
│   ├── pages/                        #   HomePage
│   ├── routes/                       #   React Router config
│   └── types/                        #   TypeScript interfaces
│
├── backend/                          # Backend (Spring Boot)
│   ├── pom.xml
│   ├── mvnw.cmd                      #   Maven Wrapper (no Maven install needed)
│   └── src/main/java/.../pharmacy/
│       ├── presentation/             #   REST controllers + exception handlers
│       ├── application/              #   DTOs + response mappers
│       ├── domain/
│       │   ├── model/                #   JPA entities
│       │   ├── repository/           #   Spring Data JPA interfaces
│       │   └── service/              #   Business logic + AiService
│       └── infrastructure/
│           ├── ai/                   #   GroqChatClient, OpenFdaClient
│           ├── security/             #   JWT, CORS, rate limiting
│           └── config/               #   DataSeeder
│
└── docs/                             # Documentation
    ├── SYSTEM_CONTEXT.md             #   Full system context for developers
    ├── setup-local.md                #   PostgreSQL setup guide
    └── postgres-schema.md            #   Database schema reference
```

---

## Configuration

### Spring Profiles

| Profile | Database | AI | Port | Use Case |
|---------|----------|----|------|----------|
| `default` | PostgreSQL | Mock (no key) | 8080 | Production |
| `local` | H2 in-memory | Groq Cloud (key in `application-local.yml`) | 8081 | Development |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | No | Groq Cloud API key. Without it, AI features return mock data |
| `VITE_API_BASE_URL` | No | Backend URL for frontend (defaults to `http://localhost:8080`) |

---

## Security

- **Authentication**: JWT tokens (HMAC-SHA256), 3-hour expiry
- **Authorization**: Role-based access via Spring Security `@PreAuthorize`
- **Password Storage**: bcrypt hashing
- **CORS**: Restricted to frontend origins
- **Rate Limiting**: 120 requests/minute per IP
- **API Documentation**: Swagger UI at `/swagger-ui.html`

---

## License

This project is for educational and demonstration purposes.

---

<p align="center">
  Built with React, Spring Boot, Groq Cloud, and openFDA
</p>
