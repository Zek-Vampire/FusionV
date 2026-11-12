import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.E2E_API_URL || 'http://localhost:8080/api/v1';
const STATE_DIR = path.resolve('.e2e');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const RUN_ID =
  process.env.E2E_RUN_ID ||
  `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

function generatedPassword() {
  // Meets the backend rule: at least 8 characters with a letter and a digit.
  return `E2e${crypto.randomBytes(9).toString('base64url')}9`;
}

function accountFromEnv(prefix, fullName) {
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];
  if (Boolean(email) !== Boolean(password)) {
    throw new Error(
      `Set both E2E_${prefix}_EMAIL and E2E_${prefix}_PASSWORD, or neither to use generated accounts.`,
    );
  }
  return email
    ? { email, password, fullName, generated: false, token: null, id: null }
    : null;
}

async function request(apiPath, { method = 'GET', token, body } = {}) {
  const headers = { Accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${API_URL}${apiPath}`, { method, headers, body: payload });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const message = data?.message || text || response.statusText;
    throw new Error(`${method} ${apiPath} failed (${response.status}): ${message}`);
  }
  return data;
}

async function ensureAccount(account, prefix) {
  if (account.generated !== false) {
    const registered = await request('/auth/register', {
      method: 'POST',
      body: {
        fullName: account.fullName,
        email: account.email,
        password: account.password,
      },
    });
    account.token = registered.token;
    account.id = registered.user.id;
    return;
  }
  const loggedIn = await request('/auth/login', {
    method: 'POST',
    body: { email: account.email, password: account.password },
  });
  account.token = loggedIn.token;
  account.id = loggedIn.user.id;
}

async function checkBackend() {
  try {
    const response = await fetch(`${API_URL}/hackathons`, { headers: { Accept: '*/*' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(
      `The live E2E suite needs the Spring Boot API at ${API_URL}. ` +
        `Start it, or set E2E_API_URL. Cause: ${error.message}`,
    );
  }
}

export default async function globalSetup() {
  await checkBackend();

  const owner =
    accountFromEnv('OWNER', `E2E Owner ${RUN_ID}`) ||
    {
      fullName: `E2E Owner ${RUN_ID}`,
      email: `e2e.owner.${RUN_ID}@example.com`,
      password: generatedPassword(),
      generated: true,
      token: null,
      id: null,
    };
  const member =
    accountFromEnv('MEMBER', `E2E Member ${RUN_ID}`) ||
    {
      fullName: `E2E Member ${RUN_ID}`,
      email: `e2e.member.${RUN_ID}@example.com`,
      password: generatedPassword(),
      generated: true,
      token: null,
      id: null,
    };

  await ensureAccount(owner, 'OWNER');
  await ensureAccount(member, 'MEMBER');

  const team = await request('/teams', {
    method: 'POST',
    token: owner.token,
    body: {
      name: `E2E Shared Team ${RUN_ID}`,
      description: 'Shared fixture team for live browser, messaging and download checks.',
      maxMembers: 5,
      skills: ['Testing', 'Java'],
    },
  });

  await request(`/teams/${team.id}/join-requests`, {
    method: 'POST',
    token: member.token,
  });
  const requests = await request(`/teams/${team.id}/join-requests`, { token: owner.token });
  const pending = requests.find((item) => item.status === 'PENDING' && item.userId === member.id);
  if (!pending) throw new Error('The member join request for the shared E2E team was not created.');
  await request(`/teams/join-requests/${pending.id}/accept`, {
    method: 'POST',
    token: owner.token,
  });

  const filename = `e2e-shared-${RUN_ID}.txt`;
  const form = new FormData();
  form.append(
    'file',
    new Blob([`FusionV live E2E download fixture ${RUN_ID}\n`], { type: 'text/plain' }),
    filename,
  );
  form.append('title', `E2E Download Fixture ${RUN_ID}`);
  form.append('description', 'Temporary shared download fixture for cross-browser E2E checks.');
  form.append('subject', 'E2E');
  form.append('category', 'OTHER');
  form.append('tags', 'e2e, download');
  const resource = await request('/resources', {
    method: 'POST',
    token: owner.token,
    body: form,
  });

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      {
        runId: RUN_ID,
        baseURL: BASE_URL,
        apiURL: API_URL,
        owner,
        member,
        team: { id: team.id, name: team.name },
        resource: {
          id: resource.id,
          title: resource.title,
          filename,
        },
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );

  console.log(`Live E2E fixtures ready (${RUN_ID})`);
}
