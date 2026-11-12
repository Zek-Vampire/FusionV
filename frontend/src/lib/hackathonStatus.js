import { todayISO } from './format';

/**
 * Exact port of the legacy `C.hackathonStatus()` computation.
 *
 * The backend has no status field: registration and event state are derived
 * from calendar dates and the visitor's local date. Both values are compared
 * as YYYY-MM-DD strings, so a deadline of "today" stays open until midnight.
 */
export function hackathonStatus(hackathon, today) {
  const now = today || todayISO();
  const h = hackathon || {};

  let registration = 'unknown';
  if (h.registrationDeadline) {
    if (now > h.registrationDeadline) registration = 'closed';
    else if (now === h.registrationDeadline) registration = 'today';
    else registration = 'open';
  }

  let event = 'unknown';
  if (h.startDate && h.endDate) {
    if (now < h.startDate) event = 'upcoming';
    else if (now > h.endDate) event = 'past';
    else event = 'ongoing';
  } else if (h.startDate) {
    event = now < h.startDate ? 'upcoming' : 'ongoing';
  } else if (h.endDate) {
    event = now <= h.endDate ? 'ongoing' : 'past';
  }

  return {
    registration,
    event,
    registrationLabel:
      registration === 'open'
        ? 'Registration open'
        : registration === 'today'
          ? 'Registration closes today'
          : registration === 'closed'
            ? 'Registration closed'
            : 'Registration deadline not listed',
    eventLabel:
      event === 'upcoming'
        ? 'Upcoming'
        : event === 'ongoing'
          ? 'Happening now'
          : event === 'past'
            ? 'Completed'
            : 'Dates not listed',
  };
}

export function registrationTone(registration) {
  if (registration === 'open') return 'success';
  if (registration === 'today') return 'warning';
  return 'neutral';
}

export function eventTone(event) {
  if (event === 'ongoing') return 'lime';
  if (event === 'upcoming') return 'neutral';
  return 'outline';
}
