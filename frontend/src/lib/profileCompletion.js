const PLACEHOLDER_TEXT = /^(n\/?a|none|not set|not provided|add (your|a) .+|lorem ipsum.*)$/i;

export function hasProfileValue(value) {
  const text = String(value ?? '').trim();
  return Boolean(text) && !PLACEHOLDER_TEXT.test(text);
}

export function isValidHttpUrl(value) {
  const text = String(value ?? '').trim();
  if (!text) return false;
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Nine checks, matching the existing FusionV profile completion card. */
export function profileCompletion(user) {
  const value = user || {};
  const checks = [
    {
      key: 'yearBranch',
      label: 'Year and branch',
      action: 'edit-profile',
      complete: hasProfileValue(value.yearBranch),
    },
    {
      key: 'college',
      label: 'College',
      action: 'edit-profile',
      complete: hasProfileValue(value.college),
    },
    { key: 'motto', label: 'Motto', action: 'edit-profile', complete: hasProfileValue(value.motto) },
    { key: 'about', label: 'About me', action: 'edit-about', complete: hasProfileValue(value.about) },
    {
      key: 'location',
      label: 'Location',
      action: 'edit-about',
      complete: hasProfileValue(value.location),
    },
    {
      key: 'linkUrl',
      label: 'Profile link',
      action: 'edit-about',
      complete: hasProfileValue(value.linkUrl) && isValidHttpUrl(value.linkUrl),
    },
    {
      key: 'resumeFileName',
      label: 'Resume',
      action: 'resume',
      complete: hasProfileValue(value.resumeFileName),
    },
    {
      key: 'skills',
      label: 'At least one skill',
      action: 'add-skill',
      complete: Array.isArray(value.skills) && value.skills.length > 0,
    },
    {
      key: 'interests',
      label: 'At least one interest',
      action: 'add-interest',
      complete: Array.isArray(value.interests) && value.interests.length > 0,
    },
  ];
  const completed = checks.filter((check) => check.complete).length;
  return {
    checks,
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
  };
}
