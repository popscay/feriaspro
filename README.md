# VacaFlow — Employee Vacation Management System

A full-stack vacation management application with role-based access control, built with **Spring Boot (Java 17)** and **React**.


## Project Structure

```
vacation-app/
The config package contains configuration classes such as CORS setup, OpenAPI/Swagger configuration, and data seeding utilities.
The controller package is responsible for exposing REST API endpoints and handling incoming HTTP requests.
The service package contains the core business logic, including validation rules and permission checks based on user roles.
The repository package manages data access using Spring Data JPA repositories.
The model package defines the JPA entities, such as Employee and VacationRequest.
The dto package includes Data Transfer Objects used for request and response payloads.
The mapper package is responsible for converting between entities and DTOs.
The exception package handles custom exceptions and includes a global exception handler to standardize error responses.
```

---

## Backend Setup & Run

### Prerequisites
- Java 17+
- Maven 3.8+

### Run the backend

```bash
cd vacation-app/backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**

### Database
- H2 in-memory database — no setup required.
- Auto-seeded with sample data on startup.
- H2 console: **http://localhost:8080/h2-console**
  - JDBC URL: `jdbc:h2:mem:vacationdb`
  - Username: `sa`
  - Password: *(empty)*

### Swagger / OpenAPI
- Swagger UI: **http://localhost:8080/swagger-ui.html**
- OpenAPI JSON: **http://localhost:8080/api-docs**

---

## Frontend Setup & Run

### Prerequisites
- Node.js 18+
- npm 9+

### Install & run

```bash
cd vacation-app/frontend
npm install
npm start
```

The frontend starts on **http://localhost:3000**


## API Endpoints

All endpoints require the `X-User-Id` header (simulated authentication).

## Business Rules

- Vacation dates are **inclusive** (Aug 1–5 = 5 days).
- No two employees may have **overlapping** vacation periods (checked across PENDING and APPROVED).
- Only **PENDING** requests can be edited, approved, or rejected.
- Managers can only act on employees **assigned to them**.

---


