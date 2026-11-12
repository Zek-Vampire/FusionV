# FusionV API documentation

Base URL: `http://localhost:8080/api/v1` (all paths below are relative to it). JSON in, JSON out, except file uploads (`multipart/form-data`) and downloads.

## Authentication
Log in or register, then send the token with every protected request:
```
Authorization: Bearer <token>
```
Tokens expire after `JWT_EXPIRATION_MINUTES` (default 120). Roles: `STUDENT` (default) and `ADMIN` (created with `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Passwords are BCrypt hashed and never returned.

## Error format (every error)
```json
{
  "timestamp": "2026-10-23T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "You already liked this post",
  "fieldErrors": {}
}
```
Validation errors (400) fill `fieldErrors`, for example `{"email":"must be a well-formed email address"}`.

| Status | Meaning |
|---|---|
| 400 | invalid input, business rule broken, invalid file |
| 401 | not logged in, bad or expired token, wrong credentials |
| 403 | logged in but not allowed (not the leader / owner / admin) |
| 404 | record not found |
| 409 | duplicate or conflict (duplicate email/like/request, team full, still in use) |
| 413 | uploaded file larger than 10 MB |
| 500 | unexpected server or database error (technical details are logged, not returned) |

## Endpoints

### `POST /auth/register`

* **Purpose:** Create an account and log in.
* **Auth:** Public
* **Request:**
```json
{
  "fullName": "Aryan Sharma",
  "email": "aryan@example.com",
  "password": "hello1234"
}
```
* **Response:** 201 Created
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "fullName": "Aryan Sharma",
    "email": "aryan@example.com",
    "role": "STUDENT",
    "yearBranch": "2nd Year | Computer Engineering",
    "college": "Fr. CRCE",
    "motto": null,
    "about": null,
    "location": "Mumbai",
    "linkUrl": null,
    "resumeFileName": null,
    "skills": [
      "Java"
    ],
    "interests": [
      "AI/ML"
    ],
    "createdAt": "2026-10-01T10:15:00"
  }
}
```
* **Errors:** 400 invalid fields / weak password (min 8 chars with letter + digit), 409 email already registered

### `POST /auth/login`

* **Purpose:** Log in. The token goes into the `Authorization: Bearer <token>` header of later requests.
* **Auth:** Public
* **Request:**
```json
{
  "email": "aryan@example.com",
  "password": "hello1234"
}
```
* **Response:** 200 OK
```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "fullName": "Aryan Sharma",
    "email": "aryan@example.com",
    "role": "STUDENT",
    "yearBranch": "2nd Year | Computer Engineering",
    "college": "Fr. CRCE",
    "motto": null,
    "about": null,
    "location": "Mumbai",
    "linkUrl": null,
    "resumeFileName": null,
    "skills": [
      "Java"
    ],
    "interests": [
      "AI/ML"
    ],
    "createdAt": "2026-10-01T10:15:00"
  }
}
```
* **Errors:** 401 invalid email or password (same message for both)

### `GET /users/me`

* **Purpose:** Get my profile.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
{
  "id": 1,
  "fullName": "Aryan Sharma",
  "email": "aryan@example.com",
  "role": "STUDENT",
  "yearBranch": "2nd Year | Computer Engineering",
  "college": "Fr. CRCE",
  "motto": null,
  "about": null,
  "location": "Mumbai",
  "linkUrl": null,
  "resumeFileName": null,
  "skills": [
    "Java"
  ],
  "interests": [
    "AI/ML"
  ],
  "createdAt": "2026-10-01T10:15:00"
}
```
* **Errors:** 401

### `PUT /users/me`

* **Purpose:** Update my profile (all fields are replaced; blank becomes empty).
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "fullName": "Aryan Sharma",
  "yearBranch": "2nd Year",
  "college": "Fr. CRCE",
  "motto": "Build",
  "about": "Hi",
  "location": "Mumbai",
  "linkUrl": "https://example.com/me"
}
```
* **Response:** 200 OK
(UserResponse)
* **Errors:** 400 validation / link must start with http(s)://, 401

### `POST /users/me/password`

* **Purpose:** Change my password.
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "currentPassword": "hello1234",
  "newPassword": "newpass5678"
}
```
* **Response:** 204 No Content
* **Errors:** 400 wrong current password or weak new password, 401

### `PUT /users/me/skills`

* **Purpose:** Replace my skills (new skills are created automatically, case-insensitive).
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "values": [
    "Java",
    "Spring Boot"
  ]
}
```
* **Response:** 200 OK
(UserResponse)
* **Errors:** 400 invalid skill name, 401

### `PUT /users/me/interests`

* **Purpose:** Replace my interests.
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "values": [
    "AI/ML",
    "Open Source"
  ]
}
```
* **Response:** 200 OK
(UserResponse)
* **Errors:** 400, 401

### `GET /users/me/stats`

* **Purpose:** Numbers for the profile page.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
{
  "teamsJoined": 2,
  "hackathons": 1,
  "resourcesShared": 3,
  "posts": 4
}
```
* **Errors:** 401

### `GET /users/me/export`

* **Purpose:** Printable text version of my profile (`text/plain`).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```
FusionV profile: Aryan Sharma
=============================
Email       : aryan@example.com
...
```
* **Errors:** 401

### `POST /users/me/resume`

* **Purpose:** Upload my resume (`multipart/form-data`, field `file`; pdf/doc/docx, max 10 MB).
* **Auth:** Student (Bearer token)
* **Request:** `curl -H "Authorization: Bearer $T" -F file=@cv.pdf http://localhost:8080/api/v1/users/me/resume`
* **Response:** 200 OK
(UserResponse with resumeFileName)
* **Errors:** 400 invalid file, 413 too large, 401

### `GET /users/me/resume`

* **Purpose:** Download my resume.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK (file, `Content-Disposition: attachment`)
* **Errors:** 404 no resume, 401

### `GET /users/search?q=&skill=`

* **Purpose:** Find students by name and/or skill (max 50, no emails).
* **Auth:** Student (Bearer token)
* **Request:** `GET /users/search?skill=Java`
* **Response:** 200 OK
```json
[
  {
    "id": 1,
    "fullName": "Aryan Sharma",
    "yearBranch": "2nd Year",
    "college": "Fr. CRCE",
    "skills": [
      "Java"
    ]
  }
]
```
* **Errors:** 401

### `GET /users/{id}`

* **Purpose:** Public profile summary of a student.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
(StudentSummary)
* **Errors:** 404, 401

### `GET /skills`

* **Purpose:** All known skill names (for filters).
* **Auth:** Public
* **Request:** -
* **Response:** 200 OK
```json
[
  "Java",
  "Python"
]
```
* **Errors:** -

### `GET /hackathons`

* **Purpose:** Search hackathons. Optional filters: `name`, `domain`, `location`, `mode` (ONLINE|OFFLINE|HYBRID), `minTeamSize`, `maxTeamSize`, `deadlineFrom`, `deadlineTo` (yyyy-MM-dd). Sorted by registration deadline.
* **Auth:** Public
* **Request:** `GET /hackathons?mode=ONLINE&domain=AI`
* **Response:** 200 OK
```json
[
  {
    "id": 1,
    "name": "[DEMO] Sample Campus Hackathon",
    "domain": "Web Development",
    "organizer": "Demo Organizer",
    "location": "Mumbai",
    "mode": "OFFLINE",
    "description": "Placeholder",
    "eligibility": "Engineering students (demo)",
    "startDate": "2027-01-20",
    "endDate": "2027-01-21",
    "registrationDeadline": "2027-01-10",
    "minTeamSize": 2,
    "maxTeamSize": 4,
    "registrationUrl": "https://example.com/demo-hackathon-1"
  }
]
```
* **Errors:** 400 bad filter value

### `GET /hackathons/{id}`

* **Purpose:** Hackathon details.
* **Auth:** Public
* **Request:** -
* **Response:** 200 OK
```json
{
  "id": 1,
  "name": "[DEMO] Sample Campus Hackathon",
  "domain": "Web Development",
  "organizer": "Demo Organizer",
  "location": "Mumbai",
  "mode": "OFFLINE",
  "description": "Placeholder",
  "eligibility": "Engineering students (demo)",
  "startDate": "2027-01-20",
  "endDate": "2027-01-21",
  "registrationDeadline": "2027-01-10",
  "minTeamSize": 2,
  "maxTeamSize": 4,
  "registrationUrl": "https://example.com/demo-hackathon-1"
}
```
* **Errors:** 404

### `POST /hackathons`

* **Purpose:** Create a hackathon.
* **Auth:** Administrator
* **Request:**
```json
{
  "name": "[DEMO] Sample Campus Hackathon",
  "domain": "Web Development",
  "organizer": "Demo Organizer",
  "location": "Mumbai",
  "mode": "OFFLINE",
  "description": "Placeholder",
  "eligibility": "Engineering students (demo)",
  "startDate": "2027-01-20",
  "endDate": "2027-01-21",
  "registrationDeadline": "2027-01-10",
  "minTeamSize": 2,
  "maxTeamSize": 4,
  "registrationUrl": "https://example.com/demo-hackathon-1"
}
```
* **Response:** 201 Created
(HackathonResponse)
* **Errors:** 400 validation (name, mode, dates, team sizes, URL), 401, 403

### `PUT /hackathons/{id}`

* **Purpose:** Update a hackathon.
* **Auth:** Administrator
* **Request:** (same body as POST)
* **Response:** 200 OK
* **Errors:** 400, 403, 404

### `DELETE /hackathons/{id}`

* **Purpose:** Delete a hackathon (its teams stay, without the link).
* **Auth:** Administrator
* **Request:** -
* **Response:** 204 No Content
* **Errors:** 403, 404

### `POST /hackathons/import`

* **Purpose:** Import a JSON list; existing (name + startDate) are skipped; all-or-nothing.
* **Auth:** Administrator
* **Request:**
```json
[
  {
    "name": "[DEMO] Sample Campus Hackathon",
    "domain": "Web Development",
    "organizer": "Demo Organizer",
    "location": "Mumbai",
    "mode": "OFFLINE",
    "description": "Placeholder",
    "eligibility": "Engineering students (demo)",
    "startDate": "2027-01-20",
    "endDate": "2027-01-21",
    "registrationDeadline": "2027-01-10",
    "minTeamSize": 2,
    "maxTeamSize": 4,
    "registrationUrl": "https://example.com/demo-hackathon-1"
  }
]
```
* **Response:** 200 OK
```json
{
  "created": 1,
  "skipped": 0
}
```
* **Errors:** 400, 403

### `POST /hackathons/import/csv`

* **Purpose:** Import a CSV file (`multipart`, field `file`).
* **Auth:** Administrator
* **Request:** `curl -H "Authorization: Bearer $T" -F file=@hackathons.csv .../hackathons/import/csv`
* **Response:** 200 OK
```json
{
  "created": 3,
  "skipped": 0
}
```
* **Errors:** 400 bad CSV (message names the line), 403

### `POST /hackathons/sync`

* **Purpose:** Read every configured data source (CSV path from `HACKATHON_CSV_PATH`).
* **Auth:** Administrator
* **Request:** -
* **Response:** 200 OK
```json
{
  "created": 2,
  "skipped": 1
}
```
* **Errors:** 400 no source configured / unreadable, 403

### `POST /teams`

* **Purpose:** Create a team (you become the leader).
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "name": "CodeCrafters",
  "description": "Web and AI projects",
  "hackathonId": 1,
  "maxMembers": 4,
  "skills": [
    "Java",
    "Spring Boot"
  ]
}
```
* **Response:** 201 Created
```json
{
  "id": 3,
  "name": "CodeCrafters",
  "description": "Web and AI projects",
  "hackathonId": 1,
  "hackathonName": "[DEMO] Sample Campus Hackathon",
  "leaderId": 1,
  "leaderName": "Aryan Sharma",
  "maxMembers": 4,
  "memberCount": 2,
  "skills": [
    "Java",
    "Spring Boot"
  ],
  "members": [
    {
      "userId": 1,
      "fullName": "Aryan Sharma",
      "role": "LEADER",
      "joinedAt": "2026-10-01T10:20:00"
    }
  ],
  "myStatus": "LEADER",
  "pendingRequests": 1,
  "createdAt": "2026-10-01T10:20:00"
}
```
* **Errors:** 400 validation / size outside the hackathon's limits, 404 hackathon

### `GET /teams`

* **Purpose:** Search teams. Filters: `q`, `skill` (repeatable), `hackathonId`, `minSize`, `maxSize` (team capacity), `openOnly`, `mine`, `sort` (latest|name|spots).
* **Auth:** Student (Bearer token)
* **Request:** `GET /teams?skill=Java&skill=Python&openOnly=true`
* **Response:** 200 OK
```json
[
  {
    "id": 3,
    "name": "CodeCrafters",
    "description": "Web and AI projects",
    "hackathonId": 1,
    "hackathonName": "[DEMO] Sample Campus Hackathon",
    "leaderId": 1,
    "leaderName": "Aryan Sharma",
    "maxMembers": 4,
    "memberCount": 2,
    "skills": [
      "Java",
      "Spring Boot"
    ],
    "members": [
      {
        "userId": 1,
        "fullName": "Aryan Sharma",
        "role": "LEADER",
        "joinedAt": "2026-10-01T10:20:00"
      }
    ],
    "myStatus": "LEADER",
    "pendingRequests": 1,
    "createdAt": "2026-10-01T10:20:00"
  }
]
```
* **Errors:** 401

### `GET /teams/{id}`

* **Purpose:** Team details, members, my status (LEADER, MEMBER, REQUESTED, INVITED, NONE).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
{
  "id": 3,
  "name": "CodeCrafters",
  "description": "Web and AI projects",
  "hackathonId": 1,
  "hackathonName": "[DEMO] Sample Campus Hackathon",
  "leaderId": 1,
  "leaderName": "Aryan Sharma",
  "maxMembers": 4,
  "memberCount": 2,
  "skills": [
    "Java",
    "Spring Boot"
  ],
  "members": [
    {
      "userId": 1,
      "fullName": "Aryan Sharma",
      "role": "LEADER",
      "joinedAt": "2026-10-01T10:20:00"
    }
  ],
  "myStatus": "LEADER",
  "pendingRequests": 1,
  "createdAt": "2026-10-01T10:20:00"
}
```
* **Errors:** 404

### `PUT /teams/{id}`

* **Purpose:** Edit team (leader only). maxMembers cannot go below the current size.
* **Auth:** Student (Bearer token)
* **Request:** (same body as POST /teams)
* **Response:** 200 OK
(TeamResponse)
* **Errors:** 400, 403 not leader, 404

### `DELETE /teams/{id}`

* **Purpose:** Delete team (leader or admin).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 204 No Content
* **Errors:** 403, 404

### `POST /teams/{id}/join-requests`

* **Purpose:** Ask to join a team. The leader gets a notification.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 201 Created
```json
{
  "id": 7,
  "teamId": 3,
  "teamName": "CodeCrafters",
  "userId": 5,
  "userName": "Priya",
  "type": "REQUEST",
  "status": "PENDING",
  "createdAt": "2026-10-02T09:00:00"
}
```
* **Errors:** 404, 409 already a member / request pending / team full

### `GET /teams/{id}/join-requests`

* **Purpose:** Pending requests of my team (leader only).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
[
  {
    "id": 7,
    "teamId": 3,
    "teamName": "CodeCrafters",
    "userId": 5,
    "userName": "Priya",
    "type": "REQUEST",
    "status": "PENDING",
    "createdAt": "2026-10-02T09:00:00"
  }
]
```
* **Errors:** 403, 404

### `POST /teams/join-requests/{requestId}/accept`

* **Purpose:** Accept a request (leader). Re-checks the size limit inside a locked transaction.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
{
  "id": 7,
  "teamId": 3,
  "teamName": "CodeCrafters",
  "userId": 5,
  "userName": "Priya",
  "type": "REQUEST",
  "status": "ACCEPTED",
  "createdAt": "2026-10-02T09:00:00"
}
```
* **Errors:** 403, 404, 409 team full / already answered

### `POST /teams/join-requests/{requestId}/reject`

* **Purpose:** Reject a request (leader).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
{
  "id": 7,
  "teamId": 3,
  "teamName": "CodeCrafters",
  "userId": 5,
  "userName": "Priya",
  "type": "REQUEST",
  "status": "REJECTED",
  "createdAt": "2026-10-02T09:00:00"
}
```
* **Errors:** 403, 404, 409

### `POST /teams/{id}/invitations`

* **Purpose:** Invite a registered student by email (leader).
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "email": "priya@example.com"
}
```
* **Response:** 201 Created
```json
{
  "id": 7,
  "teamId": 3,
  "teamName": "CodeCrafters",
  "userId": 5,
  "userName": "Priya",
  "type": "INVITE",
  "status": "PENDING",
  "createdAt": "2026-10-02T09:00:00"
}
```
* **Errors:** 403, 404 team or student, 409 duplicate / full

### `GET /invitations`

* **Purpose:** My pending invitations.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
[
  {
    "id": 7,
    "teamId": 3,
    "teamName": "CodeCrafters",
    "userId": 5,
    "userName": "Priya",
    "type": "INVITE",
    "status": "PENDING",
    "createdAt": "2026-10-02T09:00:00"
  }
]
```
* **Errors:** 401

### `POST /invitations/{id}/accept`

* **Purpose:** Accept an invitation (you join the team).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
* **Errors:** 403 not yours, 404, 409 full / answered

### `POST /invitations/{id}/decline`

* **Purpose:** Decline an invitation.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
* **Errors:** 403, 404, 409

### `DELETE /teams/{id}/members/me`

* **Purpose:** Leave a team. If the leader leaves, the longest-standing member becomes leader; the last member leaving deletes the team.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 204 No Content
* **Errors:** 400 not a member, 404

### `GET /teams/{teamId}/messages`

* **Purpose:** Last 100 team messages, oldest first (members only).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
[
  {
    "id": 12,
    "teamId": 3,
    "senderId": 1,
    "senderName": "Aryan Sharma",
    "content": "Meeting at 6 pm",
    "createdAt": "2026-10-02T13:00:00"
  }
]
```
* **Errors:** 403 not a member, 404

### `POST /teams/{teamId}/messages`

* **Purpose:** Send a team message; other members get a notification (background thread).
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "content": "Meeting at 6 pm"
}
```
* **Response:** 201 Created
```json
{
  "id": 12,
  "teamId": 3,
  "senderId": 1,
  "senderName": "Aryan Sharma",
  "content": "Meeting at 6 pm",
  "createdAt": "2026-10-02T13:00:00"
}
```
* **Errors:** 400 empty/too long, 403, 404

### `POST /resources`

* **Purpose:** Upload study material (`multipart/form-data`): `file`, `title` (required), `subject`, `category` (NOTES|QUESTION_PAPER|PDF|OTHER), `tags`, `description`.
* **Auth:** Student (Bearer token)
* **Request:** `curl -H "Authorization: Bearer $T" -F file=@notes.pdf -F title="DBMS Notes" -F category=NOTES .../resources`
* **Response:** 201 Created
```json
{
  "id": 5,
  "title": "DBMS Notes",
  "description": "Unit 1-3",
  "subject": "DBMS",
  "category": "NOTES",
  "tags": "dbms,sql",
  "originalFileName": "dbms-notes.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 120344,
  "downloadCount": 3,
  "uploaderId": 1,
  "uploaderName": "Aryan Sharma",
  "createdAt": "2026-10-02T11:00:00",
  "downloadUrl": "/api/v1/resources/5/download"
}
```
* **Errors:** 400 invalid file (type, content, empty), 413 too large, 500 storage problem

### `GET /resources`

* **Purpose:** Search materials: `q`, `category`, `subject`, `tag`.
* **Auth:** Public
* **Request:** `GET /resources?category=QUESTION_PAPER&subject=DBMS`
* **Response:** 200 OK
```json
[
  {
    "id": 5,
    "title": "DBMS Notes",
    "description": "Unit 1-3",
    "subject": "DBMS",
    "category": "NOTES",
    "tags": "dbms,sql",
    "originalFileName": "dbms-notes.pdf",
    "contentType": "application/pdf",
    "sizeBytes": 120344,
    "downloadCount": 3,
    "uploaderId": 1,
    "uploaderName": "Aryan Sharma",
    "createdAt": "2026-10-02T11:00:00",
    "downloadUrl": "/api/v1/resources/5/download"
  }
]
```
* **Errors:** 400 bad category

### `GET /resources/mine`

* **Purpose:** Materials I uploaded.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
[
  {
    "id": 5,
    "title": "DBMS Notes",
    "description": "Unit 1-3",
    "subject": "DBMS",
    "category": "NOTES",
    "tags": "dbms,sql",
    "originalFileName": "dbms-notes.pdf",
    "contentType": "application/pdf",
    "sizeBytes": 120344,
    "downloadCount": 3,
    "uploaderId": 1,
    "uploaderName": "Aryan Sharma",
    "createdAt": "2026-10-02T11:00:00",
    "downloadUrl": "/api/v1/resources/5/download"
  }
]
```
* **Errors:** 401

### `GET /resources/{id}`

* **Purpose:** Material details.
* **Auth:** Public
* **Request:** -
* **Response:** 200 OK
```json
{
  "id": 5,
  "title": "DBMS Notes",
  "description": "Unit 1-3",
  "subject": "DBMS",
  "category": "NOTES",
  "tags": "dbms,sql",
  "originalFileName": "dbms-notes.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 120344,
  "downloadCount": 3,
  "uploaderId": 1,
  "uploaderName": "Aryan Sharma",
  "createdAt": "2026-10-02T11:00:00",
  "downloadUrl": "/api/v1/resources/5/download"
}
```
* **Errors:** 404

### `GET /resources/{id}/download`

* **Purpose:** Download the file (public, counts downloads).
* **Auth:** Public
* **Request:** -
* **Response:** 200 OK (file)
* **Errors:** 404 record or file missing

### `PUT /resources/{id}`

* **Purpose:** Edit title/subject/category/tags/description (uploader or admin).
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "title": "DBMS Notes v2",
  "description": "",
  "subject": "DBMS",
  "category": "NOTES",
  "tags": "dbms"
}
```
* **Response:** 200 OK
(ResourceResponse)
* **Errors:** 400, 403, 404

### `DELETE /resources/{id}`

* **Purpose:** Delete material and its file (uploader or admin).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 204 No Content
* **Errors:** 403, 404

### `POST /posts`

* **Purpose:** Publish a post. `type`: UPDATE (default), PROJECT, ACHIEVEMENT.
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "content": "We reached the final round!",
  "type": "ACHIEVEMENT"
}
```
* **Response:** 201 Created
```json
{
  "id": 9,
  "authorId": 1,
  "authorName": "Aryan Sharma",
  "content": "We reached the final round!",
  "type": "ACHIEVEMENT",
  "createdAt": "2026-10-02T12:00:00",
  "updatedAt": null,
  "likeCount": 2,
  "commentCount": 1,
  "likedByMe": false
}
```
* **Errors:** 400

### `GET /posts`

* **Purpose:** Feed, newest first. `mine=true`, `authorId`, `type`, `page` (0..), `size` (1-50).
* **Auth:** Student (Bearer token)
* **Request:** `GET /posts?mine=true&type=ACHIEVEMENT`
* **Response:** 200 OK
```json
[
  {
    "id": 9,
    "authorId": 1,
    "authorName": "Aryan Sharma",
    "content": "We reached the final round!",
    "type": "ACHIEVEMENT",
    "createdAt": "2026-10-02T12:00:00",
    "updatedAt": null,
    "likeCount": 2,
    "commentCount": 1,
    "likedByMe": false
  }
]
```
* **Errors:** 401

### `PUT /posts/{id}`

* **Purpose:** Edit my post.
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "content": "Edited",
  "type": "UPDATE"
}
```
* **Response:** 200 OK
(PostResponse)
* **Errors:** 400, 403 not yours, 404

### `DELETE /posts/{id}`

* **Purpose:** Delete my post (admin may delete any).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 204 No Content
* **Errors:** 403, 404

### `POST /posts/{id}/like`

* **Purpose:** Like a post.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
(PostResponse, likedByMe=true)
* **Errors:** 404, 409 already liked

### `DELETE /posts/{id}/like`

* **Purpose:** Remove my like.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
(PostResponse)
* **Errors:** 404 post or no like to remove

### `GET /posts/{id}/comments`

* **Purpose:** Comments of a post, oldest first.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
[
  {
    "id": 4,
    "postId": 9,
    "authorId": 5,
    "authorName": "Priya",
    "content": "Congratulations!",
    "createdAt": "2026-10-02T12:05:00"
  }
]
```
* **Errors:** 404

### `POST /posts/{id}/comments`

* **Purpose:** Add a comment.
* **Auth:** Student (Bearer token)
* **Request:**
```json
{
  "content": "Congratulations!"
}
```
* **Response:** 201 Created
```json
{
  "id": 4,
  "postId": 9,
  "authorId": 5,
  "authorName": "Priya",
  "content": "Congratulations!",
  "createdAt": "2026-10-02T12:05:00"
}
```
* **Errors:** 400, 404

### `DELETE /posts/comments/{commentId}`

* **Purpose:** Delete my comment (admin may delete any).
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 204 No Content
* **Errors:** 403, 404

### `GET /notifications`

* **Purpose:** My 30 newest notifications.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
```json
[
  {
    "id": 2,
    "type": "JOIN_REQUEST",
    "message": "Priya wants to join your team CodeCrafters",
    "relatedTeamId": 3,
    "read": false,
    "createdAt": "2026-10-02T09:00:01"
  }
]
```
* **Errors:** 401

### `POST /notifications/{id}/read`

* **Purpose:** Mark one as read.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 200 OK
(NotificationResponse)
* **Errors:** 404

### `POST /notifications/read-all`

* **Purpose:** Mark all as read.
* **Auth:** Student (Bearer token)
* **Request:** -
* **Response:** 204 No Content
* **Errors:** 401

### `GET /admin/stats`

* **Purpose:** Counts and background-notification statistics (queued/delivered/failed).
* **Auth:** Administrator
* **Request:** -
* **Response:** 200 OK
```json
{
  "users": 10,
  "teams": 3,
  "resources": 5,
  "posts": 8,
  "notificationsQueued": 12,
  "notificationsDelivered": 12,
  "notificationsFailed": 0
}
```
* **Errors:** 403
