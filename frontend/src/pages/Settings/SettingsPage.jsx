import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Download, Info, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PasswordInput } from '@/components/ui/FormControls';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSavedTeams } from '@/hooks/useSavedTeams';
import { useSignOut } from '@/hooks/useSignOut';
import { formatDate } from '@/lib/format';
import { isPersistentSession } from '@/lib/storage';
import { isStrongPassword } from '@/lib/validation';
import { changePassword, downloadProfileExport } from '@/services/users';
import { paths } from '@/routes/paths';

export default function SettingsPage() {
  usePageTitle('Settings');
  const { user } = useAuth();
  const signOut = useSignOut();
  const { toast } = useToast();
  const saved = useSavedTeams(user?.id);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [clearOpen, setClearOpen] = useState(false);

  const password = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      setGeneralError('');
      toast({
        title: 'Password changed',
        description: 'Use the new password the next time you log in.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setErrors(error?.fieldErrors || {});
      setGeneralError(error?.message || 'The password could not be changed.');
    },
  });

  const exportProfile = useMutation({
    mutationFn: downloadProfileExport,
    onSuccess: () => toast({ title: 'Profile export downloaded', variant: 'success' }),
    onError: (error) => toast({ title: 'Export failed', description: error?.message, variant: 'error' }),
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = 'Enter your current password.';
    if (!isStrongPassword(form.newPassword)) {
      nextErrors.newPassword = 'Use at least 8 characters including a letter and a digit.';
    }
    if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = 'The two new passwords do not match.';
    }
    setErrors(nextErrors);
    setGeneralError('');
    if (Object.keys(nextErrors).length) return;
    password.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Only settings with a real backend effect are shown. Unsupported preferences are listed as unavailable instead of pretending to work."
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Account</h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">Name</dt>
              <dd className="text-right">{user?.fullName || 'Not available'}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">Email</dt>
              <dd className="break-all text-right">{user?.email || 'Not available'}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">Role</dt>
              <dd className="text-right">{user?.role === 'ADMIN' ? 'Administrator' : 'Student'}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">Member since</dt>
              <dd className="text-right">{formatDate(user?.createdAt) || 'Not available'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-muted">Session</dt>
              <dd>
                <Badge variant={isPersistentSession() ? 'success' : 'neutral'}>
                  {isPersistentSession() ? 'Persistent on this device' : 'This tab only'}
                </Badge>
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Edit your name, year, college, motto, about and links on{' '}
            <Link to={paths.profile} className="font-semibold text-lime hover:underline">
              your profile
            </Link>
            . Email changes are not supported by the backend.
          </p>
        </section>

        <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <ShieldCheck size={17} className="text-lime" aria-hidden="true" />
            Change password
          </h2>
          <form className="mt-4 space-y-4" onSubmit={submit} noValidate>
            <PasswordInput
              label="Current password"
              name="currentPassword"
              autoComplete="current-password"
              value={form.currentPassword}
              error={errors.currentPassword}
              onChange={(event) => update('currentPassword', event.target.value)}
            />
            <PasswordInput
              label="New password"
              name="newPassword"
              autoComplete="new-password"
              value={form.newPassword}
              error={errors.newPassword}
              hint="At least 8 characters with a letter and a digit."
              onChange={(event) => update('newPassword', event.target.value)}
            />
            <PasswordInput
              label="Confirm new password"
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={(event) => update('confirmPassword', event.target.value)}
            />
            {generalError ? (
              <p role="alert" className="rounded-lg border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">
                {generalError}
              </p>
            ) : null}
            <Button type="submit" loading={password.isPending}>
              Change password
            </Button>
          </form>
        </section>

        <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Export your data</h2>
          <p className="mt-2 text-sm text-muted">
            The backend produces a plain-text profile export with your name, email, year/branch,
            college, location, link, about, skills and interests. It does not include posts,
            resources, teams or the resume file.
          </p>
          <Button
            variant="outline"
            icon={Download}
            className="mt-4"
            loading={exportProfile.isPending}
            onClick={() => exportProfile.mutate()}
          >
            Download profile export
          </Button>
        </section>

        <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Saved teams on this device</h2>
          <p className="mt-2 text-sm text-muted">
            {saved.ids.length} saved team{saved.ids.length === 1 ? '' : 's'}. Saved teams are stored
            in this browser under your account id. They are not synced between devices or browsers.
          </p>
          {saved.ids.length ? (
            <Button
              variant="ghost"
              icon={Trash2}
              className="mt-3 text-red-300"
              onClick={() => setClearOpen(true)}
            >
              Clear saved teams
            </Button>
          ) : (
            <p className="mt-3 text-xs text-muted">No teams are saved on this device.</p>
          )}
        </section>

        <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Notification and privacy preferences</h2>
          <p className="mt-2 text-sm text-muted">
            <span className="flex items-start gap-2">
              <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Per-notification preferences and privacy toggles are not available: the backend has
                no endpoint that stores them. Showing switches here would be misleading. Unread
                counts and mark-as-read actions work on the{' '}
                <Link to={paths.notifications} className="font-semibold text-lime hover:underline">
                  notifications page
                </Link>
                .
              </span>
            </span>
          </p>
        </section>

        <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Session</h2>
          <p className="mt-2 text-sm text-muted">
            {isPersistentSession()
              ? 'You chose “Keep me signed in on this device”, so your session survives closing the browser.'
              : 'Your session is stored for this tab only and ends when the tab closes.'}
          </p>
          <Button variant="outline" icon={LogOut} className="mt-4" onClick={signOut}>
            Log out
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          saved.clear();
          setClearOpen(false);
          toast({ title: 'Saved teams cleared on this device', variant: 'success' });
        }}
        title="Clear saved teams"
        message="Remove every team saved in this browser? This does not affect your actual team memberships."
        confirmLabel="Clear saved teams"
      />
    </div>
  );
}
