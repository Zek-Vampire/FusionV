# FusionV Database Setup

**Database:** PostgreSQL 16  
**Total tables:** 16

The database schema contains the following tables:

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

Every table, column, constraint and index is defined in `database/schema.sql`.

## Option 1: Docker (Recommended)

```bash
cd backend
cp .env.example .env
```

Configure `DB_PASSWORD` and a JWT secret of at least 32 characters in `.env`.

Start the database:

```bash
docker compose up -d
```

Docker Compose initializes the database using:

- `database/init/01-schema.sql`
- `database/init/02-demo-data.sql`

Start the backend:

```bash
./run-dev.sh
```

The backend should use `DDL_AUTO=validate` to validate the existing database schema.

**Reset the database:**

```bash
docker compose down -v
docker compose up -d
```

**Skip demo hackathons:** Remove `database/init/02-demo-data.sql` before the first database initialization.

## Option 2: PostgreSQL Installed Locally

Create the database:

```bash
psql -U postgres -c "CREATE DATABASE fusionv;"
```

Import the schema:

```bash
psql -U postgres -d fusionv -f database/schema.sql
```

Optionally import demo data:

```bash
psql -U postgres -d fusionv -f database/demo-data.sql
```

Then configure the backend to use:

```env
DDL_AUTO=validate
```

## Option 3: Hibernate Table Creation (Quick Local Testing)

For a quick local test, configure:

```env
DDL_AUTO=update
```

Hibernate will create or update the database tables based on the JPA entities.

**Important:** Use only one database initialization approach. Do not combine Hibernate table creation with the manual schema or Docker initialization options.

## First Admin Account

Configure the following variables in `.env`:

```env
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

The admin account is created during backend startup when these values are configured.

The password must contain at least 8 characters, including at least one letter and one digit.

An admin account can add hackathons.

## Verify Database Setup

To list all database tables:

```bash
docker exec -it fusionv-db psql -U postgres -d fusionv -c "\dt"
```

You should see **16 tables**:

- users
- skills
- user_skills
- user_interests
- hackathons
- teams
- team_skills
- team_members
- join_requests
- posts
- post_technologies
- post_likes
- comments
- resources
- messages
- notifications

If all 16 tables are listed, the database schema has been initialized.
