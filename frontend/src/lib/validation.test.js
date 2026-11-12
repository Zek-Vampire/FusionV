import { describe, expect, it } from 'vitest';
import { isStrongPassword, isValidEmail, safeHttpUrl, safeNextPath } from './validation';

describe('validation helpers', () => {
  it('matches the backend email rule', () => {
    expect(isValidEmail('student@college.edu')).toBe(true);
    expect(isValidEmail('student@college')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('matches the backend password rule', () => {
    expect(isStrongPassword('fusionv1')).toBe(true);
    expect(isStrongPassword('fusionv')).toBe(false);
    expect(isStrongPassword('12345678')).toBe(false);
  });

  it('accepts internal return paths and rejects redirects', () => {
    expect(safeNextPath('/hackathons?q=ai')).toBe('/hackathons?q=ai');
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('/login?next=%2Fteams')).toBe('/');
    expect(safeNextPath('\\evil')).toBe('/');
    expect(safeNextPath('/dashboard', '/fallback')).toBe('/dashboard');
  });

  it('only exposes http(s) links', () => {
    expect(safeHttpUrl('https://devpost.com')).toBe('https://devpost.com');
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('not a url')).toBeNull();
  });
});
