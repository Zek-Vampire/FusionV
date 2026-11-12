import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/FormControls';

export default function TagDialog({ open, onClose, label, existing = [], onAdd, loading = false }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValue('');
    setError('');
  }, [open]);

  function submit(event) {
    event.preventDefault();
    const text = value.trim();
    if (!text) {
      setError(`Enter a ${label.toLowerCase()}.`);
      return;
    }
    if (text.length > 50) {
      setError('Use 50 characters or fewer.');
      return;
    }
    if (existing.some((item) => item.toLowerCase() === text.toLowerCase())) {
      setError(`That ${label.toLowerCase()} is already on your profile.`);
      return;
    }
    setError('');
    onAdd?.(text);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add ${label.toLowerCase()}`}
      description="Short names work best, for example Java, UI/UX or Open Source."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="tag-dialog-form" loading={loading}>
            Add {label.toLowerCase()}
          </Button>
        </>
      }
    >
      <form id="tag-dialog-form" onSubmit={submit} noValidate>
        <Input
          label={`${label} name`}
          name="value"
          maxLength={50}
          value={value}
          error={error}
          autoFocus
          onChange={(event) => {
            setValue(event.target.value);
            setError('');
          }}
        />
      </form>
    </Modal>
  );
}
