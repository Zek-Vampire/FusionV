const PREFIX = 'fusionv_saved_teams:';
const LEGACY_KEY = 'fusionv_saved_teams';

function keyFor(userId) {
  return `${PREFIX}${userId}`;
}

function read(userId) {
  if (!userId) return [];
  try {
    const values = JSON.parse(window.localStorage.getItem(keyFor(userId)) || '[]');
    return Array.isArray(values)
      ? values.map(Number).filter((value) => Number.isFinite(value))
      : [];
  } catch {
    return [];
  }
}

function write(userId, values) {
  if (!userId) return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(values));
  } catch {
    /* private mode / quota: saved teams are a convenience, never required data */
  }
}

/** Removes the old browser-wide key once so it cannot leak between accounts. */
export function removeLegacySavedTeams() {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

export function readSavedTeamIds(userId) {
  return read(userId);
}

export function isTeamSaved(userId, teamId) {
  return read(userId).includes(Number(teamId));
}

export function toggleSavedTeam(userId, teamId) {
  const values = read(userId);
  const id = Number(teamId);
  const index = values.indexOf(id);
  if (index >= 0) values.splice(index, 1);
  else values.push(id);
  write(userId, values);
  return index < 0;
}

export function clearSavedTeams(userId) {
  write(userId, []);
}

export const SAVED_TEAMS_PREFIX = PREFIX;
