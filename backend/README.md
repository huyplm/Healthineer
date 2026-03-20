# Pharmacy Backend (Spring Boot 3, Java 17)

Production-oriented backend skeleton for the hospital medication & e-prescription system.

## Stack

- Spring Boot 3.2.x
- Java 17
- PostgreSQL (dev), H2 (test profile)
- Spring Data JPA + Hibernate
- Bean Validation + method-level validation
- JWT auth (OAuth2 Resource Server)
- OpenAPI/Swagger
- JUnit 5 + Testcontainers + MockMvc
- Docker + docker-compose

## Structure

`src/main/java/com/hospital/pharmacy/`

- `domain/model`: entities + enums
- `domain/repository`: repository interfaces
- `domain/service`: use-cases/application services
- `application/dto`: request/response DTOs
- `infrastructure/security`: security + JWT + rate limit + CORS
- `infrastructure/config`: seed data
- `presentation`: REST controllers + global exception handling

## Run

### Local (requires Maven installed)

```bash
cd backend
mvn spring-boot:run
```

Swagger UI:

- http://localhost:8080/swagger-ui.html

## Default Seed Users

All accounts use password: `password`

- `doctor1` (DOCTOR)
- `doctor2` (DOCTOR)
- `pharm1` (PHARMACIST)
- `pharm2` (PHARMACIST)
- `admin` (ADMIN)

## Docker

```bash
cd backend
docker compose up --build
```

## Notes

- API paths follow the frontend spec under `/api/**`
- AI endpoints are mock and ready to swap with real AI services later
- Inventory deduction during dispense is transaction-bound
