import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/FormControls';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { updateMyProfile } from '@/services/users';
import { safeHttpUrl } from '@/lib/validation';

const EMPTY = {
  fullName: '',
  yearBranch: '',
  college: '',
  motto: '',
  about: '',
  location: '',
  linkUrl: '',
};

export default function ProfileEditDialog({ open, onClose }) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGeneralError('');
    setForm({
      fullName: user?.fullName || '',
      yearBranch: user?.yearBranch || '',
      college: user?.college || '',
      motto: user?.motto || '',
      about: user?.about || '',
      location: user?.location || '',
      linkUrl: user?.linkUrl || '',
    });
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      updateUser(updated);
      toast({ title: 'Profile updated', variant: 'success' });
      onClose?.();
    },
    onError: (error) => {
      setErrors(error?.fieldErrors || {});
      setGeneralError(error?.message || 'Your profile could not be saved.');
    },
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    const fullName = form.fullName.trim();
    if (fullName.length < 2) nextErrors.fullName = 'Enter your full name.';
    else if (fullName.length > 100) nextErrors.fullName = 'Use at most 100 characters.';
    if (form.motto.length > 200) nextErrors.motto = 'Use at most 200 characters.';
    if (form.about.length > 2000) nextErrors.about = 'Use at most 2,000 characters.';
    if (form.location.length > 100) nextErrors.location = 'Use at most 100 characters.';
    if (form.linkUrl.trim() && !safeHttpUrl(form.linkUrl)) {
      nextErrors.linkUrl = 'Use a full http:// or https:// link.';
    }
    if (form.yearBranch.length > 100) nextErrors.yearBranch = 'Use at most 100 characters.';
    if (form.college.length > 150) nextErrors.college = 'Use at most 150 characters.';

    setErrors(nextErrors);
    setGeneralError('');
    if (Object.keys(nextErrors).length) return;

    mutation.mutate({
      fullName,
      yearBranch: form.yearBranch.trim(),
      college: form.college.trim(),
      motto: form.motto.trim(),
      about: form.about.trim(),
      location: form.location.trim(),
      linkUrl: form.linkUrl.trim(),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="These are the fields the backend accepts. Email and role cannot be changed here."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="profile-edit-form" loading={mutation.isPending}>
            Save profile
          </Button>
        </>
      }
    >
      <form id="profile-edit-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <Input
          containerClassName="sm:col-span-2"
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={form.fullName}
          error={errors.fullName}
          maxLength={100}
          onChange={(event) => update('fullName', event.target.value)}
        />
        <Input
          label="Year / branch"
          name="yearBranch"
          maxLength={100}
          placeholder="3rd year · Computer Engineering"
          value={form.yearBranch}
          error={errors.yearBranch}
          onChange={(event) => update('yearBranch', event.target.value)}
        />
        <Input
          label="College"
          name="college"
          maxLength={150}
          value={form.college}
          error={errors.college}
          onChange={(event) => update('college', event.target.value)}
        />
        <Input
          containerClassName="sm:col-span-2"
          label="Motto"
          name="motto"
          maxLength={200}
          value={form.motto}
          error={errors.motto}
          onChange={(event) => update('motto', event.target.value)}
        />
        <Textarea
          containerClassName="sm:col-span-2"
          label="About me"
          name="about"
          rows={5}
          maxLength={2000}
          value={form.about}
          error={errors.about}
          hint="Tell students what you build and what you want to work on."
          onChange={(event) => update('about', event.target.value)}
        />
        <Input
          label="Location"
          name="location"
          maxLength={100}
          value={form.location}
          error={errors.location}
          onChange={(event) => update('location', event.target.value)}
        />
        <Input
          label="Website or profile link"
          name="linkUrl"
          type="url"
          maxLength={300}
          placeholder="https://…"
          value={form.linkUrl}
          error={errors.linkUrl}
          onChange={(event) => update('linkUrl', event.target.value)}
        />
        {generalError ? (
          <p role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200 sm:col-span-2">
            {generalError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
