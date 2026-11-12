# FusionV Backend

The FusionV backend is a REST API built with **Java 21, Spring Boot, and PostgreSQL**. It handles authentication, student profiles, hackathons, team collaboration, community posts, messaging, notifications, and resource management.

The backend communicates with the React frontend through REST endpoints under `/api/v1`.

## Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Java 21 |
| Framework | Spring Boot 3.3.5 |
| Build Tool | Maven |
| Database | PostgreSQL |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security |
| Authentication | JWT |
| Password Hashing | BCrypt |
| Validation | Jakarta Bean Validation |
| File Handling | Java I/O and NIO |
| Testing | JUnit 5, Mockito, Spring Boot Test |

## Prerequisites

Install the following before running the backend:

- JDK 21
- Apache Maven 3.9 or newer
- PostgreSQL
- Git

Verify your installations:

```bash
java -version
mvn -version
psql --version
```

## 1. Database Setup

FusionV uses PostgreSQL.

Create a database named `fusionv`:

```sql
CREATE DATABASE fusionv;
```

You can create the database through pgAdmin or the PostgreSQL command line:

```bash
psql -U postgres -c "CREATE DATABASE fusionv;"
```

### Database initialization options

Choose one of the following approaches.

**Option A: Docker Compose**

From the backend directory:

```bash
docker compose up -d
```

Docker Compose initializes the database using the SQL files in `database/init/`.

**Option B: Manual SQL initialization**

From the backend directory:

```bash
psql -U postgres -d fusionv -f database/schema.sql
```

Optional demo data:

```bash
psql -U postgres -d fusionv -f database/demo-data.sql
```

**Option C: Hibernate initialization**

For local development, Hibernate can create or update tables automatically by using:

```env
DDL_AUTO=update
```

Do not combine Hibernate table generation with manual schema initialization.

For a controlled setup, initialize the schema using SQL and use:

```env
DDL_AUTO=validate
```

For production, use a proper database migration strategy rather than relying on Hibernate's `update` mode.

For more information, see `database/DATABASE_SETUP.md`.

## 2. Environment Configuration

Navigate to the backend directory:

```bash
cd backend
```

Create your local `.env` file from the example.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS / Git Bash:**

```bash
cp .env.example .env
```

Open `.env` and configure your database credentials and application secrets.

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL JDBC connection URL |
| `DB_USERNAME` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | Random secret of at least 32 characters |
| `JWT_EXPIRATION_MINUTES` | JWT token validity in minutes |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins |
| `UPLOAD_DIR` | Directory used for uploaded files |
| `ADMIN_EMAIL` | Optional initial administrator email |
| `ADMIN_PASSWORD` | Optional initial administrator password |
| `HACKATHON_CSV_PATH` | Optional hackathon CSV file path |
| `DDL_AUTO` | Hibernate schema management mode |

Never commit your `.env` file or expose database credentials and JWT secrets.

## 3. Run the Backend

Make sure PostgreSQL is running and the database is configured.

**Windows PowerShell:**

```powershell
.\run-dev.ps1
```

**Linux / macOS / Git Bash:**

```bash
./run-dev.sh
```

Alternatively, run Maven directly after configuring the required environment variables:

```bash
mvn spring-boot:run
```

The backend API runs at:

```text
http://localhost:8080
```

The API base path is:

```text
http://localhost:8080/api/v1
```

## 4. Connect the React Frontend

The current FusionV frontend is built using React and Vite and is located in the repository's `frontend/` directory.

Open another terminal from the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm ci
```

Start the frontend development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite development server proxies `/api` requests to the Spring Boot backend at `http://localhost:8080` by default.

To change the backend proxy target, configure `VITE_PROXY_TARGET` in the frontend environment.

For deployment and production configuration, see `frontend/DEPLOYMENT.md`.

## 5. Backend Architecture

The backend follows a layered architecture:

```text
Client Request
      |
      v
Controller Layer
      |
      v
Service Layer
      |
      v
Repository Layer
      |
      v
PostgreSQL Database
```

### Main packages

| Package | Responsibility |
|---|---|
| `config/` | Application and security configuration |
| `controller/` | REST API endpoints |
| `dto/` | Request and response objects |
| `exception/` | Custom exceptions and global exception handling |
| `model/` | JPA entities and enums |
| `notification/` | Notification processing and templates |
| `repository/` | Database access using Spring Data JPA |
| `security/` | JWT authentication and authorization |
| `service/` | Application business logic |
| `util/` | Validation, file handling and utility classes |

Main application entry point:

```text
src/main/java/com/fusionv/FusionvApplication.java
```

## 6. Database Structure

The PostgreSQL schema contains 16 tables:

1. `users`
2. `skills`
3. `user_skills`
4. `user_interests`
5. `hackathons`
6. `teams`
7. `team_skills`
8. `team_members`
9. `join_requests`
10. `posts`
11. `post_technologies`
12. `post_likes`
13. `comments`
14. `resources`
15. `messages`
16. `notifications`

The database schema and entity relationships are documented in:

- `database/schema.sql`
- `database/er-diagram.md`
- `database/DATABASE_SETUP.md`

## 7. File Storage

FusionV supports file uploads for study resources and student resumes.

Uploaded files are stored locally under the configured upload directory.

Default directories:

```text
uploads/
├── resources/
└── resumes/
```

Uploaded files are excluded from Git through `.gitignore`.

The application validates uploaded file types and enforces file size limits.

## 8. Hackathon Management

Hackathon records can be managed through administrator functionality and import endpoints.

Supported operations include:

- Creating, updating and deleting hackathons.
- Importing hackathons using JSON.
- Importing hackathons through CSV.
- Synchronizing hackathons from a configured CSV source.

An initial administrator can be configured through `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

See `API_DOCUMENTATION.md` for endpoint details.

## 9. Testing

Run the backend test suite from the backend directory:

```bash
mvn clean test
```

Build the backend:

```bash
mvn clean package
```

The generated JAR is placed in:

```text
target/
```

## 10. API Documentation

Detailed API endpoint information is available in:

```text
API_DOCUMENTATION.md
```

Frontend integration and API communication are implemented in the React frontend under:

```text
../frontend/src/services/
```

## Security Notes

- Authentication uses JWT.
- Passwords are hashed using BCrypt.
- Protected endpoints require authentication.
- File uploads are validated.
- Database credentials and application secrets must be configured through environment variables.
- Never commit `.env` or production credentials.
- Configure production CORS origins and secure deployment settings before hosting.

## License

This project is licensed under the Apache License 2.0.

See the root `LICENSE` file for details.
