# Local setup (no Docker)

Short guide to run Healthineer on your machine for development.

## Prerequisites

- **Node.js** (LTS) and **npm**
- **Java 17** (backend uses Maven Wrapper; no need to install Maven)
- **PostgreSQL 16**

## 1. PostgreSQL

1. Install PostgreSQL 16 from [postgresql.org](https://www.postgresql.org/download/) (or your package manager).
2. Create the database and user (run once, e.g. with `psql` as a superuser):

```sql
CREATE USER admin WITH PASSWORD 'pass';
CREATE DATABASE hospital OWNER admin;
```

- **Windows:** After install, use `psql` from the PostgreSQL bin directory or pgAdmin.
- **macOS (Homebrew):** `brew install postgresql@16`, then `psql postgres` and run the SQL above.
- **Linux:** Use your distro’s package (e.g. `apt install postgresql-16`), then `sudo -u postgres psql` and run the SQL.

Backend expects: host `localhost`, port `5432`, database `hospital`, user `admin`, password `pass`. JPA `ddl-auto: update` will create/update tables.

## 2. Backend

From the project root:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

(On macOS/Linux use `./mvnw spring-boot:run`.)

- First run may take a few minutes (dependencies). When you see “Started PharmacyApplication”, the API is ready.
- API: http://localhost:8080  
- Swagger: http://localhost:8080/swagger-ui.html

## 3. Frontend

From the project root (in a new terminal):

```bash
npm install
npm run dev
```

- App: http://localhost:5173  
- Use mock login (role + optional name).

## 4. Tests (optional)

- **Backend:** `cd backend` then `.\mvnw.cmd test`
- **Frontend:** `npm run build` (and your test script if you have one)

## Summary

| Step     | Command / action                                      |
|----------|--------------------------------------------------------|
| Postgres | Create user `admin` / DB `hospital` (see SQL above)   |
| Backend  | `cd backend` → `.\mvnw.cmd spring-boot:run`            |
| Frontend | `npm install` → `npm run dev`                         |

No Docker required for this flow.
