# FusionV

### Discover Hackathons. Build Teams. Create Together.

FusionV is a full-stack student collaboration platform designed to help students discover hackathons, connect with fellow developers, form teams, share learning resources, and collaborate on projects.

Built to bring student developers together, FusionV provides a centralized space for discovering opportunities and turning ideas into projects.

---

## Features

### Dashboard
- Personalized student dashboard.
- Hackathon and team overview.
- Notifications and invitations.
- Saved teams and useful resources.

### Hackathon Discovery
- Explore available hackathons.
- Search and filter hackathons.
- View hackathon details and deadlines.
- Access external registration links.

### Team Collaboration
- Discover and create teams.
- Send and manage join requests.
- Invite students to teams.
- View team members and details.
- Team-based messaging.

### Community
- Create and explore community posts.
- Like and comment on posts.
- Filter community content.
- Connect with other student developers.

### Student Directory
- Discover fellow students.
- Search by name and skills.
- View student profiles and interests.
- Find potential collaborators.

### Resource Library
- Explore learning resources.
- Upload and manage personal resources.
- Download shared resources.

### Notifications
- View notifications.
- Track unread notifications.
- Mark individual or all notifications as read.

### Student Profiles
- Manage personal information.
- Add skills and interests.
- Upload and download resumes.
- View profile-related activity.

---

## Technology Stack

### Frontend
- React 19
- Vite
- JavaScript
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- Motion

### Backend
- Java 21
- Spring Boot 3.3.5
- Spring Security
- Spring Data JPA
- Hibernate
- JWT Authentication
- Maven

### Database
- PostgreSQL

### Testing
- Vitest
- React Testing Library
- Playwright
- Axe Accessibility Testing
- JUnit 5
- Mockito

---

## Project Structure

```text

FusionV/
│
├── .gitignore
├── LICENSE
├── README.md
│
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── pom.xml
│   ├── docker-compose.yml
│   ├── run-dev.ps1
│   ├── run-dev.sh
│   ├── README.md
│   ├── API_DOCUMENTATION.md
│   ├── FRONTEND_INTEGRATION.md
│   │
│   ├── database/
│   │   ├── DATABASE_SETUP.md
│   │   ├── demo-data.sql
│   │   ├── er-diagram.md
│   │   ├── schema.sql
│   │   ├── init/
│   │   │   ├── 01-schema.sql
│   │   │   └── 02-demo-data.sql
│   │   └── migrations/
│   │       └── 002_structured_posts.sql
│   │
│   └── src/
│       ├── main/
│       │   ├── java/com/fusionv/
│       │   │   ├── FusionvApplication.java
│       │   │   ├── config/
│       │   │   ├── controller/
│       │   │   ├── dto/
│       │   │   ├── exception/
│       │   │   ├── model/
│       │   │   ├── notification/
│       │   │   ├── repository/
│       │   │   ├── security/
│       │   │   ├── service/
│       │   │   └── util/
│       │   │
│       │   └── resources/
│       │       └── application.properties.example
│       │
│       └── test/
│           └── java/com/fusionv/
│               ├── controller/
│               ├── exception/
│               ├── notification/
│               ├── service/
│               ├── util/
│               └── TestData.java
│
└── frontend/
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── index.html
    ├── vite.config.js
    ├── vitest.config.js
    ├── playwright.config.js
    ├── DEPLOYMENT.md
    │
    ├── public/
    │   └── assets/
    │
    ├── e2e/
    │   └── support/
    │
    └── src/
        ├── main.jsx
        ├── components/
        │   ├── cards/
        │   ├── common/
        │   ├── motion/
        │   ├── navigation/
        │   ├── posts/
        │   ├── profile/
        │   ├── public/
        │   ├── reactbits/
        │   ├── teams/
        │   └── ui/
        │
        ├── context/
        ├── hooks/
        ├── layouts/
        ├── lib/
        ├── pages/
        │   ├── Auth/
        │   ├── Community/
        │   ├── Dashboard/
        │   ├── Hackathons/
        │   ├── Messages/
        │   ├── Notifications/
        │   ├── Profile/
        │   ├── Resources/
        │   ├── Search/
        │   ├── Settings/
        │   ├── Students/
        │   └── Teams/
        │
        ├── routes/
        ├── services/
        │   └── api/
        ├── styles/
        └── test/

```
---

## Getting Started

### Prerequisites

Install the following:

- Node.js 20.19 or newer
- Java 21
- Maven 3.9 or newer
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Zek-Vampire/FusionV.git
cd FusionV
```
### 2. Configure the Backend

Open a terminal:

```bash
cd backend
```

Create your local environment file from the example:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS / Git Bash:**
```bash
cp .env.example .env
```

Edit `.env` and configure your PostgreSQL credentials and application secrets.

Create the PostgreSQL database named `fusionv` if it does not already exist.

Follow `backend/README.md` for the complete database setup instructions.

Start the backend:

**Windows PowerShell:**
```powershell
.\run-dev.ps1
```

**Linux / macOS / Git Bash:**
```bash
./run-dev.sh
```

The backend runs at:

```text
http://localhost:8080
```

### 3. Configure the Frontend

Open another terminal from the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

The Vite development server proxies `/api` requests to the Spring Boot backend by default.

---

## Testing

Run frontend unit and component tests:

```bash
cd frontend
npm test
```

Create a production build:

```bash
npm run build
```

Run the Playwright end-to-end tests:

```bash
npm run test:e2e
```

Run the complete configured browser test suite:

```bash
npm run test:e2e:all
```

The end-to-end tests require a running backend, configured database, and the required browser dependencies.

Run backend tests:

```bash
cd backend
mvn clean test
```

---

## Security

- JWT-based authentication.
- Protected application routes.
- Password hashing handled by the backend.
- Environment-based configuration.
- File upload validation.
- Authenticated API requests.
- Sensitive configuration files excluded from version control.

Never commit `.env`, database passwords, JWT secrets, API keys, or other private credentials.

Frontend environment variables prefixed with `VITE_` are exposed to the browser. Never store secrets in them.

---

## Project Status

**Development Complete — Deployment Pending**

The repository includes the React frontend, Spring Boot backend, PostgreSQL database scripts, API documentation, and automated tests.

Production hosting and final infrastructure security review remain pending.

---

## Future Improvements

Potential future enhancements include:

- Hackathon administration dashboard.
- Advanced team matching.
- Personalized hackathon recommendations.
- Developer portfolios.
- Community moderation.
- Password recovery and account management.

---

## Author

**Godson Menezes**

Computer Science Engineering Student

GitHub: [@Zek-Vampire](https://github.com/Zek-Vampire)

---

## License

This project is licensed under the Apache License 2.0.

You are free to use, modify, and distribute this software under the terms and conditions of the license.

See the [LICENSE](LICENSE) file for the complete license text.
