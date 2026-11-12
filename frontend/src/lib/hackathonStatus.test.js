import { describe, expect, it } from 'vitest';
import { hackathonStatus } from './hackathonStatus';

const TODAY = '2026-11-10';

describe('hackathonStatus', () => {
  it('marks a future deadline as open and today as closing today', () => {
    expect(hackathonStatus({ registrationDeadline: '2026-11-11' }, TODAY).registration).toBe('open');
    expect(hackathonStatus({ registrationDeadline: TODAY }, TODAY)).toMatchObject({
      registration: 'today',
      registrationLabel: 'Registration closes today',
    });
  });

  it('marks a past deadline as closed', () => {
    expect(hackathonStatus({ registrationDeadline: '2026-11-09' }, TODAY)).toMatchObject({
      registration: 'closed',
      registrationLabel: 'Registration closed',
    });
  });

  it('keeps registration unknown when no deadline is listed', () => {
    expect(hackathonStatus({}, TODAY)).toMatchObject({
      registration: 'unknown',
      registrationLabel: 'Registration deadline not listed',
    });
  });

  it('computes upcoming, ongoing and past events from both dates', () => {
    expect(hackathonStatus({ startDate: '2026-11-20', endDate: '2026-11-22' }, TODAY).event).toBe(
      'upcoming',
    );
    expect(hackathonStatus({ startDate: '2026-11-09', endDate: '2026-11-11' }, TODAY).event).toBe(
      'ongoing',
    );
    expect(hackathonStatus({ startDate: '2026-10-01', endDate: '2026-10-03' }, TODAY).event).toBe(
      'past',
    );
  });

  it('handles a single start or end date exactly like the legacy app', () => {
    expect(hackathonStatus({ startDate: '2026-11-01' }, TODAY).event).toBe('ongoing');
    expect(hackathonStatus({ startDate: '2026-11-20' }, TODAY).event).toBe('upcoming');
    expect(hackathonStatus({ endDate: '2026-11-09' }, TODAY).event).toBe('past');
    expect(hackathonStatus({ endDate: TODAY }, TODAY).event).toBe('ongoing');
  });

  it('reports dates not listed when the event has no dates', () => {
    expect(hackathonStatus({}, TODAY)).toMatchObject({
      event: 'unknown',
      eventLabel: 'Dates not listed',
    });
  });
});
