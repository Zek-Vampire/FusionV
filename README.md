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
- Spring Boot 3
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

### Development Tools
- Git
- GitHub
- Visual Studio Code
- Postman
- pgAdmin

---

## Project Structure

```text
FusionV/
│
├── frontend-react/
│   ├── public/
│   ├── src/
│   ├── e2e/
│   ├── package.json
│   ├── vite.config.js
│   └── playwright.config.js
│
├── backend/
│   ├── src/
│   ├── database/
│   ├── pom.xml
│   └── .env.example
│
├── docs/
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have installed:

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

Navigate to the backend directory:

```bash
cd backend
```

Create your local environment configuration using the provided `.env.example`.

Configure your PostgreSQL database credentials and required application secrets.

Follow the backend README for database setup and environment configuration.

Start the Spring Boot backend using the documented development command.

The default backend address is:

```text
http://localhost:8080
```

### 3. Configure the Frontend

Open another terminal and navigate to the React frontend:

```bash
cd frontend-react
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

---

## Testing

Run frontend unit and component tests:

```bash
npm test
```

Run the production build:

```bash
npm run build
```

Run the Playwright end-to-end suite:

```bash
npx playwright test
```

The end-to-end suite requires a configured backend and test environment.

---

## Security

- Authentication using JWT.
- Protected application routes.
- Password hashing handled by the backend.
- Environment-based configuration.
- File upload validation.
- Authenticated API requests.

---

## Project Status

**Development Complete — Deployment Pending**

The project has undergone:

- Frontend and backend integration testing.
- Automated unit and component testing.
- Playwright end-to-end testing.
- Responsive layout verification.
- Cross-browser smoke testing.
- Accessibility checks.
- Production build verification.

Production hosting, deployment configuration and final infrastructure security review are still pending.

---

## Future Improvements

Potential future enhancements include:

- Hackathon administration dashboard.
- Real-time messaging.
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

#### License

This project is licensed under the Apache License 2.0.

You are free to use, modify, and distribute this software under the terms and conditions of the license.

See the [LICENSE](LICENSE) file for the complete license text.
