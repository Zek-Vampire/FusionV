export const POST_TYPES = [
  { value: 'UPDATE', label: 'Update' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
];

const TYPE_TONES = {
  UPDATE: 'neutral',
  PROJECT: 'lime',
  ACHIEVEMENT: 'warning',
};

export function postTypeLabel(type) {
  return POST_TYPES.find((item) => item.value === type)?.label || 'Update';
}

export function postTypeTone(type) {
  return TYPE_TONES[type] || 'neutral';
}
