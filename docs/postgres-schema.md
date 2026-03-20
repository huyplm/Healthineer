# PostgreSQL schema (DDL)

Schema DDL for the `hospital` database is generated from the JPA entities and stored in:

**`backend/src/main/resources/db/schema.sql`**

Use it when you want to create tables **without** running Spring Boot (Hibernate) to generate the schema.

## Prerequisites

- PostgreSQL 16 (or compatible)
- Database `hospital` and user `admin` with password `pass` (or adjust connection in the command below)

## Run the script

From the project root:

```bash
psql -U admin -d hospital -f backend/src/main/resources/db/schema.sql
```

Or from the `backend` directory:

```bash
psql -U admin -d hospital -f src/main/resources/db/schema.sql
```

On Windows (PowerShell), if `psql` is in PATH:

```powershell
psql -U admin -d hospital -f backend\src\main\resources\db\schema.sql
```

The script uses `CREATE TABLE IF NOT EXISTS`, so it is safe to run multiple times (it will not drop or overwrite existing data).

## After running the script

- You can start the backend with **`spring.jpa.hibernate.ddl-auto: validate`** (or `none`) so that Hibernate only checks that the schema matches the entities and does not create or alter tables.
- In `application.yml`, set for example:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

## Contents of the script

- **Tables:** `users`, `patients`, `medications`, `allergies`, `conditions`, `prescriptions`, `prescription_items`, `inventory_batches`, `messages`
- **Enums:** Stored as `VARCHAR` (e.g. `role`, `status`) to match JPA `@Enumerated(EnumType.STRING)`.
- **Constraints:** Primary keys, unique columns, foreign keys, and indexes on FKs and key columns.

Order of creation respects foreign key dependencies (independent tables first, then tables that reference them).
