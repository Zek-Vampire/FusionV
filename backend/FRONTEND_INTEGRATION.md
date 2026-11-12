# FusionV Frontend Integration

FusionV uses a React-based frontend and a Spring Boot backend connected through REST APIs.

The frontend is built with React and Vite. The backend provides authentication, student profiles, hackathons, teams, posts, resources, messages, and notifications.

All API endpoints use the `/api/v1` base path.

## 1. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Development Server | Vite |
| Routing | React Router |
| API Communication | Axios |
| Server State | TanStack Query |
| Styling | Tailwind CSS |
| Backend | Java 21, Spring Boot 3.3.5 |
| Database | PostgreSQL |
| Authentication | JWT |
| API Format | REST / JSON |

## 2. Integration Architecture

The frontend communicates with the backend through a centralized Axios API client.

```text
React Frontend
      |
      v
Service Modules
      |
      v
Centralized API Client (Axios)
      |
      v
Vite Development Proxy
      |
      v
Spring Boot REST API
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

The frontend does not access the PostgreSQL database directly.

## 3. API Configuration

The API client is configured in:

```text
frontend/src/services/api/client.js
```

The centralized endpoint definitions are maintained in:

```text
frontend/src/services/api/endpoints.js
```

The default API base URL is:

```text
/api/v1
```

The frontend environment example is:

```text
frontend/.env.example
```

Relevant configuration:

```env
VITE_API_BASE_URL=/api/v1
VITE_PROXY_TARGET=http://localhost:8080
```

### Development proxy

The Vite configuration is located at:

```text
frontend/vite.config.js
```

During local development:

- React runs at `http://localhost:5173`.
- Spring Boot runs at `http://localhost:8080`.
- Requests beginning with `/api` are forwarded to the backend.
- The browser communicates with the frontend origin, while Vite forwards API requests to Spring Boot.

This avoids requiring a separate browser CORS configuration for the default development proxy.

If the frontend calls the backend directly instead of using the proxy, the frontend origin must be allowed by the backend's CORS configuration.

## 4. API Client and Request Handling

The frontend uses Axios through a centralized API client.

Main file:

```text
frontend/src/services/api/client.js
```

The API client provides:

- Centralized API base URL configuration.
- Automatic JWT authorization headers.
- JSON request and response handling.
- Standardized API error handling.
- Request timeout handling.
- Unauthorized-session event handling.
- Separate handling for file uploads and downloads.

### JWT authorization

When a stored JWT is available, the API client automatically attaches it to requests:

```http
Authorization: Bearer <JWT_TOKEN>
```

The backend validates the token before allowing access to protected endpoints.

### Error handling

API errors are normalized through:

```text
frontend/src/lib/errors.js
```

The client handles authentication and authorization responses separately:

- `401 Unauthorized`: an authenticated request can trigger the unauthorized-session event.
- `403 Forbidden`: the user is not authorized to perform the requested operation; the session is not automatically cleared.

Successful `204 No Content` responses are normalized to `null`.

## 5. Authentication and Session Management

Authentication service:

```text
frontend/src/services/auth.js
```

Session storage:

```text
frontend/src/lib/storage.js
```

The frontend supports:

- Student registration.
- Student login.
- JWT-based authenticated requests.
- Persistent sessions.
- Tab-based sessions.
- Current-user profile validation.

### Authentication endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a student |
| POST | `/auth/login` | Authenticate a student |
| GET | `/users/me` | Retrieve the authenticated user's profile |

### Session storage

The frontend uses browser storage to maintain the authentication session.

| Storage | Purpose |
|---|---|
| `localStorage` | Persistent session when the user chooses to stay signed in |
| `sessionStorage` | Session limited to the current browser tab |

Session keys include:

```text
fusionv_token
fusionv_user_id
fusionv_email
```

The frontend manages the session lifecycle because the backend does not provide a token refresh or logout endpoint.

## 6. Frontend API Service Modules

The API functionality is organized into separate service modules.

Location:

```text
frontend/src/services/
```

| Service file | Responsibility |
|---|---|
| `auth.js` | Login, registration and current-user retrieval |
| `users.js` | Student profiles, skills, interests, password changes and profile exports |
| `hackathons.js` | Hackathon listing and management |
| `teams.js` | Team creation, updates, membership, invitations and join requests |
| `posts.js` | Community posts, likes and comments |
| `resources.js` | Study resource listing, uploads, updates and downloads |
| `messages.js` | Team message history and message sending |
| `notifications.js` | Notifications and read status |
| `skills.js` | Skill listing |
| `public.js` | Public platform statistics |

Each service module uses the centralized API client and endpoint definitions instead of duplicating request configuration.

## 7. Main API Endpoint Groups

All endpoints below are relative to `/api/v1`.

| Feature | Main endpoints |
|---|---|
| Authentication | `/auth/register`, `/auth/login` |
| Student profiles | `/users/me`, `/users/{id}`, `/users/search` |
| Student skills | `/users/me/skills` |
| Student interests | `/users/me/interests` |
| Student statistics | `/users/me/stats` |
| Hackathons | `/hackathons` |
| Teams | `/teams` |
| Join requests | `/teams/{id}/join-requests` |
| Invitations | `/invitations` |
| Community posts | `/posts` |
| Post comments | `/posts/{id}/comments` |
| Study resources | `/resources` |
| Team messages | `/teams/{id}/messages` |
| Notifications | `/notifications` |
| Skills | `/skills` |
| Public statistics | `/public/stats` |
| Admin statistics | `/admin/stats` |

For HTTP methods, request parameters, authorization requirements and complete endpoint details, refer to:

```text
backend/API_DOCUMENTATION.md
```

## 8. File Uploads and Downloads

File transfers are handled separately from ordinary JSON API requests.

Implementation:

```text
frontend/src/services/api/client.js
```

The frontend uses dedicated upload and download helpers.

### Supported operations

| Operation | Endpoint |
|---|---|
| Upload study resource | `POST /resources` |
| Download study resource | `GET /resources/{id}/download` |
| Upload student resume | `POST /users/me/resume` |
| Download student resume | `GET /users/me/resume` |
| Export student profile | `GET /users/me/export` |

Uploads use `FormData` with the appropriate multipart fields.

The browser automatically sets the multipart content type and boundary. The frontend must not manually set the `Content-Type` header for `FormData` requests.

File downloads use the raw response so the frontend can process the returned file and its filename.

## 9. Running the Integrated Application

### Step 1: Start PostgreSQL

Make sure the PostgreSQL service is running and the `fusionv` database has been created and initialized.

### Step 2: Start the Spring Boot backend

Open a terminal:

```bash
cd backend
```

Run on Windows PowerShell:

```powershell
.\run-dev.ps1
```

Or on Linux, macOS or Git Bash:

```bash
./run-dev.sh
```

The backend runs at:

```text
http://localhost:8080
```

### Step 3: Start the React frontend

Open another terminal from the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm ci
```

Start Vite:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

### Step 4: Verify integration

Verify that:

1. The React application loads successfully.
2. The backend is running.
3. Registration and login requests reach the backend.
4. Authenticated requests include the JWT authorization header.
5. Protected pages load for authenticated users.
6. API errors are handled by the frontend.
7. File uploads and downloads work as expected.

## 10. Testing

Frontend API client tests are located in:

```text
frontend/src/services/api/client.test.js
```

Additional service-related tests are maintained under:

```text
frontend/src/services/
```

Run frontend tests:

```bash
cd frontend
npm test
```

Run backend tests:

```bash
cd backend
mvn clean test
```

## 11. Important Integration Notes

- The React frontend must communicate with the backend through the documented REST API.
- The frontend must not connect directly to PostgreSQL.
- Keep API endpoint definitions centralized.
- Do not hardcode JWT tokens or database credentials.
- Never commit `.env` files or production secrets.
- Configure production API URLs and CORS settings before deployment.
- The development proxy configuration is not a substitute for production reverse-proxy configuration.

## Related Documentation

- `README.md` — Backend setup and architecture.
- `API_DOCUMENTATION.md` — Backend API reference.
- `database/DATABASE_SETUP.md` — Database initialization.
- `frontend/DEPLOYMENT.md` — Frontend deployment configuration.
