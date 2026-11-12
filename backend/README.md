# FusionV backend

FusionV is a student collaboration platform: students register, build a profile (skills, interests, projects, achievements),
explore hackathons, form teams, chat inside teams, share study materials and post updates.
This folder is the **Spring Boot + PostgreSQL backend**. The original HTML/CSS/JS frontend lives next to it in `../frontend`
and is connected to the backend through `fetch()` calls (see `FRONTEND_INTEGRATION.md`).

## Technology stack

| Part | Technology |
|---|---|
| Language / build | Java 21, Maven |
| Framework | Spring Boot 3.3.5 (Spring Web, Spring Data JPA/Hibernate, Spring Security, Bean Validation) |
| Database | PostgreSQL 16 (only database used, no MySQL anywhere) |
| Login | BCrypt password hashes + JWT bearer token (jjwt 0.12.6) |
| Files | Java I/O + NIO, multipart upload, files stored on disk (`uploads/`), metadata in PostgreSQL |
| Tests | JUnit 5, Mockito |

Flow of every request: `Frontend -> Controller -> Service -> Repository -> PostgreSQL`.

## Prerequisites

* JDK 21 (`java -version` must say 21)
* Maven 3.9+ (`mvn -version`)
* PostgreSQL 16 (or any recent stable version)

## 1. Install and start PostgreSQL

* **Windows:** download the installer from https://www.postgresql.org/download/windows/ , keep the default port `5432`, remember the password you set for the `postgres` user.
* **macOS (Homebrew):** `brew install postgresql@16 && brew services start postgresql@16`
* **Ubuntu/Debian:** `sudo apt install postgresql` (the service starts automatically)
* **Docker:** `docker run --name fusionv-db -e POSTGRES_PASSWORD=change_me -p 5432:5432 -d postgres:16`

## 2. Create the database

```bash
psql -U postgres -c "CREATE DATABASE fusionv;"
```
(On Windows you can also use the *SQL Shell (psql)* or pgAdmin and run `CREATE DATABASE fusionv;`.)

### Two ways to create the tables (choose ONE)

| Approach | How | When |
|---|---|---|
| **A. Hibernate creates them** (default) | Do nothing. `DDL_AUTO=update` lets Hibernate create/alter tables at startup. | Local development |
| **B. SQL script** | `psql -U postgres -d fusionv -f database/schema.sql`, then start with `DDL_AUTO=validate`. | Controlled / production-like setup |

Spring is configured with `spring.sql.init.mode=never`, so `schema.sql` is never run by Spring itself and cannot conflict with Hibernate.
Optional demo rows (clearly labelled `[DEMO]`, not real hackathons): `psql -U postgres -d fusionv -f database/demo-data.sql`.

*Production note:* `update` is only for local development. For production use a migration tool such as Flyway or Liquibase
(start from `database/schema.sql` as version 1) and run with `DDL_AUTO=validate`.

## 3. Configure environment variables

Spring Boot does **not** read a `.env` file by itself. Copy `.env.example` to `.env`, fill in your values and then either

* run the helper script (it loads `.env` and starts the app): `./run-dev.sh` (Linux/macOS/Git Bash) or `.\run-dev.ps1` (Windows PowerShell), **or**
* set the variables yourself (PowerShell: `$env:DB_PASSWORD="..."`, bash: `export DB_PASSWORD=...`), **or**
* add them to your IDE run configuration.

| Variable | Required | Meaning |
|---|---|---|
| `DB_PASSWORD` | yes | PostgreSQL password |
| `JWT_SECRET` | yes | Random text, **at least 32 characters** (signs login tokens) |
| `DB_URL` | no | default `jdbc:postgresql://localhost:5432/fusionv` |
| `DB_USERNAME` | no | default `postgres` |
| `CORS_ALLOWED_ORIGINS` | no | comma separated frontend origins, default `http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000` |
| `UPLOAD_DIR` | no | where uploaded files are stored, default `uploads` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | no | creates the first administrator at startup (needed to add hackathons) |
| `HACKATHON_CSV_PATH` | no | CSV feed for hackathons, see below |
| `DDL_AUTO` | no | `update` (default) or `validate` |

Never commit `.env` (it is in `.gitignore`). No credentials are hardcoded anywhere.

## 4. Build, test and run

```bash
mvn clean test            # unit tests (no database needed)
mvn spring-boot:run       # start on http://localhost:8080   (or ./run-dev.sh)
mvn clean package         # builds target/fusionv-1.0.0.jar
```

## 5. Connect the frontend

1. Start the backend (port 8080).
2. Serve `../frontend` over HTTP, for example VS Code *Live Server* (port 5500) or `python -m http.server 5500` inside `frontend/`.
   Do not open `index.html` with `file://`: browsers send the origin `null` and CORS will block the calls.
3. If the backend runs elsewhere, edit `frontend/config.js` (`apiBaseUrl`).

## How files are stored

* Study materials: `uploads/resources/`, resumes: `uploads/resumes/` (outside `src/`, ignored by Git).
* Every file is saved under a random name (`UUID.ext`); the original name is only metadata in PostgreSQL, so path traversal is impossible.
* Allowed: pdf, doc, docx, ppt, pptx, txt, png, jpg, jpeg (resumes: pdf, doc, docx), max 10 MB.
  Extension, content type and the file's first bytes ("magic bytes") must all agree (`util/FileValidator`).
* Downloads are public (`GET /api/v1/resources/{id}/download`); uploads, edits and deletes need a login and ownership.

## Hackathon data sources

There are no invented hackathons and no scraping. Hackathons enter the system in three ways:

1. **Administrator** (`ADMIN_EMAIL` account): `POST/PUT/DELETE /api/v1/hackathons`.
2. **Import**: `POST /api/v1/hackathons/import` (JSON list) or `/import/csv` (CSV upload).
3. **Configured feed**: set `HACKATHON_CSV_PATH=/path/to/hackathons.csv`, then call `POST /api/v1/hackathons/sync` as admin.

CSV header (only `name` and `mode` are required): 
`name,domain,organizer,location,mode,description,eligibility,startDate,endDate,registrationDeadline,minTeamSize,maxTeamSize,registrationUrl`
(dates `2027-01-31`, mode `ONLINE|OFFLINE|HYBRID`). Rows with the same name and start date are skipped.
To connect an authorized partner API later, write one class implementing `service/HackathonDataSource`; Spring picks it up automatically.

## Project layout

```
backend/
  src/main/java/com/fusionv/
    controller/    REST endpoints          service/     business rules
    repository/    Spring Data JPA + search specifications
    model/         JPA entities + enums    dto/         request/response records
    security/      JWT                     config/      security, first admin
    notification/  abstract notification classes + thread pool sender
    exception/     custom exceptions + GlobalExceptionHandler
    util/          validation, file checks, syllabus demos
  database/        schema.sql, demo-data.sql, er-diagram.md
  uploads/         stored files (git-ignored)
```
Documents: `API_DOCUMENTATION.md`, `FRONTEND_INTEGRATION.md`, `SYLLABUS_MAPPING.md`, `database/er-diagram.md`.

## Database tables

`users`, `skills`, `user_skills`, `user_interests`, `hackathons`, `teams`, `team_skills`, `team_members`, `join_requests`,
`posts`, `post_likes`, `comments`, `resources`, `messages`, `notifications`. ER diagram (Mermaid): `database/er-diagram.md`.
Key rules in the schema: unique email, unique `(team_id,user_id)` membership, unique `(post_id,user_id)` like,
at most one pending request per `(team_id,user_id)`, foreign keys everywhere, indexes on search/foreign-key columns.

## Team work split (four students)

| Student | Area | Main folders/files |
|---|---|---|
| 1 | Authentication, profiles, security | `AuthService`, `UserService`, `security/`, `config/SecurityConfig` |
| 2 | Hackathons and teams | `HackathonService`, `TeamService`, `notification/` |
| 3 | Resources, files, posts | `StudyResourceService`, `FileStorageService`, `PostService`, `util/FileValidator` |
| 4 | Database, tests, syllabus demos, docs | `database/`, `src/test/`, `util/*Demo`, `SYLLABUS_MAPPING.md` |
