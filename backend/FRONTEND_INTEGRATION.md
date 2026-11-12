# Frontend integration

The original UI (`frontend/index.html`, `style.css`, `script.js`) was **not redesigned**. Same layout, CSS classes, form IDs and navigation.
Changes made:

| File | Change |
|---|---|
| `frontend/config.js` (new) | `window.FUSIONV_CONFIG.apiBaseUrl`, the only place where the backend address is set |
| `frontend/index.html` | loads `config.js`; the "Suggested for You" demo cards became an empty `#suggestList` container; the hackathon filter is filled from the API; the demo numbers/lists in the profile were emptied (JS fills them); the 4th profile counter "Profile Views" (no such feature) is now "Posts" |
| `frontend/script.js` | all demo data (`TEAMS`, `profile`, `notifs`, `activity`...) and fake actions were replaced by `fetch()` calls. Icons, modal, sidebar, counters and rendering code are unchanged |

## How the JavaScript talks to the backend

One helper, `api(path, options)`, adds the `Authorization` header, sends JSON or `FormData`, and turns error answers into `Error(message)` that the UI shows as a toast. A 401 answer clears the token and shows the login page.

```js
// config.js
window.FUSIONV_CONFIG = { apiBaseUrl: 'http://localhost:8080/api/v1' };

// script.js (simplified)
async function api(path, options = {}) {
  const headers = {};
  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  if (session.token) headers.Authorization = 'Bearer ' + session.token;
  const res = await fetch(API_BASE + path, { method: options.method || 'GET', headers, body });
  ...
}
```
The token is stored in `localStorage` when "Remember me" is ticked (or at sign-up), otherwise in `sessionStorage`.

## Feature by feature

| UI feature (element) | What happens | API call |
|---|---|---|
| Login form `#loginForm` | validates, sends credentials, stores token, opens `#profile` | `POST /auth/login` |
| Sign-up (same form, `signup` mode) | fullName/email/password (8+ chars, letter + digit) | `POST /auth/register` |
| Route guard | `#teams` and `#profile` redirect to `#login` without token | - |
| Profile header, About, contact box | filled from the user | `GET /users/me` |
| Edit Profile / Edit About (modals) | save name, year, college, motto, about, location, link | `PUT /users/me` |
| Skills / Interests chips (add, ×) | whole list is saved | `PUT /users/me/skills`, `PUT /users/me/interests` |
| Counters (`.kpi`) | hackathons, teams, resources, posts | `GET /users/me/stats` |
| Resume (sidebar `data-action="resume"`) | uploads the file | `POST /users/me/resume` (FormData) |
| My Resources tab, "+ Upload" | modal with title, subject, category, tags, description, file | `POST /resources` (FormData), `GET /resources/mine`, `DELETE /resources/{id}`, download link `GET /resources/{id}/download` |
| My Posts tab, "+ New Post", Achievements lists | post type Update/Project/Achievement; achievements = posts of type ACHIEVEMENT | `POST /posts`, `GET /posts?mine=true`, `DELETE /posts/{id}` |
| Teams grid, tabs, search, filters, sort | server filters (`q`, `skill`, `hackathonId`, `openOnly`, `mine`, `sort`); size buckets and the Invitations tab are applied in the browser | `GET /teams`, `GET /invitations` |
| Hackathon dropdown / Create Team dropdown | options come from the database | `GET /hackathons` |
| Skill checkboxes | skills that exist in the database | `GET /skills` |
| Create Team (modal) | name, description, skills, hackathon, max members | `POST /teams` |
| Team card button | "Request to Join" / "Requested" / "Accept Invite" / "Joined" / "Team Full" depending on `myStatus` | `POST /teams/{id}/join-requests`, `POST /invitations/{id}/accept` |
| Team name click (details modal) | members, join requests (Accept/Reject), invite by email, leave, delete | `GET /teams/{id}`, `GET /teams/{id}/join-requests`, `POST /teams/join-requests/{id}/accept\|reject`, `POST /teams/{id}/invitations`, `DELETE /teams/{id}/members/me`, `DELETE /teams/{id}` |
| Suggested for You | first two open teams I am not in | uses the `GET /teams` result, `POST /teams/{id}/join-requests` |
| Bookmark on a team | stored in the browser only (`localStorage`), a personal preference | - |
| Saved Teams (sidebar menu) | loads the bookmarked teams | `GET /teams/{id}` |
| Messages (sidebar) | choose a team, read history, send | `GET/POST /teams/{id}/messages` |
| Bell | list + "Mark all as read", refreshed every 30 s | `GET /notifications`, `POST /notifications/read-all` |
| Settings (sidebar) | change password | `POST /users/me/password` |
| Logout | removes the token | - |

## Example fetch() requests

```js
// log in
const { token, user } = await fetch(API_BASE + '/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
}).then(r => r.json());

// search teams that need Java, still open
const teams = await fetch(API_BASE + '/teams?skill=Java&openOnly=true', {
  headers: { Authorization: 'Bearer ' + token }
}).then(r => r.json());

// ask to join team 3
await fetch(API_BASE + '/teams/3/join-requests', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });

// upload a study material
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('title', 'DBMS Notes');
form.append('category', 'NOTES');
await fetch(API_BASE + '/resources', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form });
// Do NOT set Content-Type yourself for FormData: the browser adds the multipart boundary.
```

## Things in the UI that are not backed by the backend (on purpose)

* **Hackathon Explorer page:** the supplied UI has no hackathon page (the "Hackathons" menu opens Teams), so hackathons appear as the dropdown filter and inside team cards. The complete search API exists (`GET /hackathons` with all filters); a dedicated page can be added on top of it.
* **Student search by skill:** API only (`GET /users/search`), no UI element existed for it.
* **Profile photo upload, Google/GitHub sign-in, password reset by email, notification/privacy toggles:** no backend feature, so the camera button is hidden, social buttons and "Forgot password" explain that they are unavailable, and the toggles were replaced by a real "change password" form.
* **Marketing numbers on the home page** (students, teams, resources counters) are static text from the original design, not database values.

## Running it

1. Start PostgreSQL and the backend (`README.md`).
2. Register in the UI (or `POST /auth/register`).
3. To see hackathons, create an admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), log in through the API and add hackathons, or run `database/demo-data.sql`.
