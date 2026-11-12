import { paths } from '@/routes/paths';

/** Mirrors the backend's email regex (`ValidationUtil`). */
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(String(value || '').trim());
}

/** Mirrors `ValidationUtil.isStrongPassword`: 8+ characters, a letter and a digit. */
export function isStrongPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value)
  );
}

/** Only http(s) links are ever rendered as external links. */
export function safeHttpUrl(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? text : null;
  } catch {
    return null;
  }
}

/**
 * `?next=` may only point at an internal application path. Rejecting protocol
 * and protocol-relative URLs prevents an open redirect, and auth routes are
 * excluded so a successful sign-in cannot loop back to the form.
 */
export function safeNextPath(value, fallback = paths.home) {
  const text = String(value || '').trim();
  if (!text.startsWith('/') || text.startsWith('//') || text.includes('\\')) return fallback;
  if (text === paths.login || text === paths.signup) return fallback;
  if (text.startsWith(`${paths.login}?`) || text.startsWith(`${paths.signup}?`)) return fallback;
  return text;
}
