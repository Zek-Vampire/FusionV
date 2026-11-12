/**
 * Formatting helpers ported from the legacy FusionV frontend (`core.js`).
 * Dates from the API are calendar dates (YYYY-MM-DD), so they are parsed at
 * local midnight exactly like the existing application.
 */

function pad(value) {
  return value < 10 ? `0${value}` : String(value);
}

export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value);
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);
  const date = new Date(dateOnly ? `${text}T00:00:00` : text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, options) {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleDateString(
    undefined,
    options || { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

export function formatMonthYear(value) {
  return formatDate(value, { month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(value) {
  const date = parseDate(value);
  if (!date) return '';
  const seconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return 'Just now';
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(value);
}

export function formatDateRange(start, end) {
  if (!start && !end) return '';
  if (start && end) {
    if (start === end) return formatDate(start);
    return `${formatDate(start)} – ${formatDate(end)}`;
  }
  return formatDate(start || end);
}

export function formatNumber(value) {
  const number = Number(value) || 0;
  try {
    return number.toLocaleString();
  } catch {
    return String(number);
  }
}

export function fileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10240 ? 1 : 0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileExtension(name) {
  const text = String(name || '').trim();
  const index = text.lastIndexOf('.');
  return index >= 0 ? text.slice(index + 1).toLowerCase() : '';
}

const CATEGORY_LABELS = {
  NOTES: 'Notes',
  QUESTION_PAPER: 'Question paper',
  PDF: 'PDF',
  OTHER: 'Other',
};

export function categoryLabel(value) {
  return CATEGORY_LABELS[value] || value || 'Other';
}

const MODE_LABELS = {
  ONLINE: 'Online',
  OFFLINE: 'In person',
  HYBRID: 'Hybrid',
};

export function modeLabel(value) {
  return MODE_LABELS[value] || value || 'Not listed';
}

export function truncate(value, max) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).replace(/\s+$/, '')}…`;
}
