# FusionV database setup

Database: PostgreSQL 16, 15 tables (users, skills, user_skills, user_interests, hackathons, teams, team_skills,
team_members, join_requests, posts, post_likes, comments, resources, messages, notifications).
Every table, column, constraint and index matches the JPA entities in `src/main/java/com/fusionv/model`.

## Option 1: Docker (recommended)
```bash
cd backend
cp .env.example .env          # set DB_PASSWORD and a 32+ char JWT_SECRET
set -a; . ./.env; set +a      # (Windows PowerShell: just use run-dev.ps1 later; compose reads .env automatically)
docker compose up -d          # creates DB, runs database/init/01-schema.sql and 02-demo-data.sql
./run-dev.sh                  # starts the API with DDL_AUTO=validate
```
Reset to a clean database: `docker compose down -v && docker compose up -d`.
Skip demo hackathons: delete `database/init/02-demo-data.sql` before the first start.

## Option 2: PostgreSQL installed on your machine
```bash
psql -U postgres -c "CREATE DATABASE fusionv;"
psql -U postgres -d fusionv -f database/schema.sql
psql -U postgres -d fusionv -f database/demo-data.sql   # optional
```
Then run the backend with `DDL_AUTO=validate`.

## Option 3: let Hibernate create tables (quick local test)
Set `DDL_AUTO=update`. Do not combine with Option 1 or 2.

## First admin account
Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (8+ chars, letter + digit). It is created at startup and can add hackathons.

## Check it worked
```bash
docker exec -it fusionv-db psql -U postgres -d fusionv -c "\dt"
```
You should see all 15 tables listed (skills/user_skills etc. included).
