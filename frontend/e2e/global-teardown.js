import fs from 'node:fs';
import path from 'node:path';

const STATE_FILE = path.resolve('.e2e/state.json');
const RESULTS_DIR = path.resolve('test-results');

async function request(apiURL, apiPath, { method = 'GET', token } = {}) {
  const headers = { Accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiURL}${apiPath}`, { method, headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.status;
}

export default async function globalTeardown() {
  if (!fs.existsSync(STATE_FILE)) return;
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

  const cleanup = {
    sharedTeam: 'not requested',
    sharedResource: 'not requested',
    generatedAccounts: [],
    note: '',
  };

  if (process.env.E2E_KEEP_DATA === '1') {
    cleanup.sharedTeam = 'kept (E2E_KEEP_DATA=1)';
    cleanup.sharedResource = 'kept (E2E_KEEP_DATA=1)';
    cleanup.note = 'Shared E2E fixtures were intentionally kept for debugging.';
  } else {
    try {
      cleanup.sharedResource = `deleted (${await request(
        state.apiURL,
        `/resources/${state.resource.id}`,
        { method: 'DELETE', token: state.owner.token },
      )})`;
    } catch (error) {
      cleanup.sharedResource = `cleanup failed: ${error.message}`;
    }
    try {
      cleanup.sharedTeam = `deleted (${await request(
        state.apiURL,
        `/teams/${state.team.id}`,
        { method: 'DELETE', token: state.owner.token },
      )})`;
    } catch (error) {
      cleanup.sharedTeam = `cleanup failed: ${error.message}`;
    }
  }

  if (state.owner.generated) cleanup.generatedAccounts.push(state.owner.email);
  if (state.member.generated) cleanup.generatedAccounts.push(state.member.email);
  cleanup.note =
    cleanup.note ||
    'Generated accounts cannot be deleted: the backend exposes no account-deletion endpoint.';

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(RESULTS_DIR, 'e2e-cleanup.json'),
    JSON.stringify(cleanup, null, 2),
  );
  console.log(`E2E cleanup: ${cleanup.sharedTeam}, ${cleanup.sharedResource}`);
  if (cleanup.generatedAccounts.length) {
    console.log(`Generated E2E accounts remain: ${cleanup.generatedAccounts.join(', ')}`);
  }

  // Never leave generated passwords or JWTs on disk.
  fs.rmSync(STATE_FILE, { force: true });
}
