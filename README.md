# Healthineer – Hospital Drug & Prescription Management

React + TypeScript web app for drug management, e-prescribing, and pharmacy workflow.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, MUI, React Query, React Router v7, React Hook Form + Zod
- **Backend:** Spring Boot (Java 17), Maven Wrapper (`.\mvnw.cmd`), port 8080
- **Database:** PostgreSQL 16 (localhost:5432, DB `hospital`, user `admin` / password `pass`)

## Run the app (local dev, no Docker)

Dev runs on your machine with **PostgreSQL installed locally**. Docker is not required.

### 1. PostgreSQL

- Install [PostgreSQL 16](https://www.postgresql.org/download/) (or use an existing local instance).
- Create database and user (once):

```sql
CREATE USER admin WITH PASSWORD 'pass';
CREATE DATABASE hospital OWNER admin;
```

Or via `psql`: connect as superuser, then run the two lines above.  
Details: [docs/setup-local.md](docs/setup-local.md).

### 2. Backend

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

- API: http://localhost:8080  
- Swagger: http://localhost:8080/swagger-ui.html  
- JPA `ddl-auto: update` creates/updates tables automatically.

### 3. Frontend

```bash
npm install
npm run dev
```

- App: http://localhost:5173

### Mock login

- Choose role (Doctor / Pharmacist / Admin), enter name (optional), click Sign in.

---

## Project structure

```
src/
├── ai/            # AI hooks (suggest, interactions, ADR, summary, chat, forecast)
├── api/           # API client + mock data
├── auth/          # Auth context, login
├── layout/        # App layout, sidebar, topbar
├── modules/
│   ├── patients/      # Patient management
│   ├── prescriptions/ # Prescriptions
│   ├── medications/   # Medication catalog
│   ├── inventory/     # Inventory
│   ├── pharmacy/      # Pharmacy workflow (review, dispense)
│   ├── chat/          # Doctor–pharmacist messages
│   └── admin/         # Admin
├── pages/
├── routes/
└── types/
```

## Roles & access

| Role         | Screens                                                                 |
|-------------|--------------------------------------------------------------------------|
| **Doctor**  | Patients, My Prescriptions, New Prescription, Messages                 |
| **Pharmacist** | Prescription Queue, Inventory, Medication Catalog, Messages        |
| **Admin**   | User Management, Medication Catalog, Inventory                         |

## Real API integration

Replace the functions in `src/api/client.ts` with `fetch` or axios calls to your backend. The API surface is already defined (patients, prescriptions, medications, inventory, chat).

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run preview` – preview production build

---

## Docker (optional / deploy only)

**Docker (Dockerfile, docker-compose) is for deploy or optional use only. It is not required for local development.**  
For day-to-day dev, use PostgreSQL on your machine and run backend + frontend as above.  
If you still want to use Docker, see the comments at the top of each compose file and the Dockerfile in `backend/`.
