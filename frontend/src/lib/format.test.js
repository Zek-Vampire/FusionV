import { describe, expect, it } from 'vitest';
import {
  categoryLabel,
  fileExtension,
  fileSize,
  formatDateRange,
  formatNumber,
  modeLabel,
  parseDate,
  truncate,
} from './format';

describe('format helpers', () => {
  it('formats a date-only value as a local calendar date', () => {
    const date = parseDate('2026-11-10');
    expect(date?.getFullYear()).toBe(2026);
    expect(formatDateRange('2026-11-10', '2026-11-12')).toMatch(/10.*–.*12/);
    expect(formatDateRange('2026-11-10', '2026-11-10')).not.toContain('–');
    expect(formatDateRange(null, null)).toBe('');
  });

  it('formats numbers, file sizes and extensions', () => {
    expect(formatNumber(1200)).toBe((1200).toLocaleString());
    expect(fileSize(512)).toBe('512 B');
    expect(fileSize(2048)).toBe('2.0 KB');
    expect(fileSize(3 * 1024 * 1024)).toBe('3.0 MB');
    expect(fileExtension('Resume.Final.PDF')).toBe('pdf');
    expect(fileExtension('no-extension')).toBe('');
  });

  it('uses the backend labels and truncates long text', () => {
    expect(categoryLabel('QUESTION_PAPER')).toBe('Question paper');
    expect(categoryLabel('SOMETHING')).toBe('SOMETHING');
    expect(modeLabel('OFFLINE')).toBe('In person');
    expect(truncate('one two three', 8)).toBe('one two…');
    expect(truncate('short', 20)).toBe('short');
  });
});
