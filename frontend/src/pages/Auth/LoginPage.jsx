import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Info, LockKeyhole } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Checkbox, Input, PasswordInput } from '@/components/ui/FormControls';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { readRememberedEmail } from '@/lib/storage';
import { isValidEmail, safeNextPath } from '@/lib/validation';
import { paths } from '@/routes/paths';

export default function LoginPage() {
  usePageTitle('Log in');
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'), paths.home);
  const navigate = useNavigate();
  const { signIn, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState(() => readRememberedEmail() || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function clearError(field) {
    setErrors((current) => (current[field] ? { ...current, [field]: '' } : current));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = {};
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const signedIn = await signIn({ email: email.trim(), password, remember });
      toast({
        title: `Welcome back, ${signedIn?.fullName?.split(' ')[0] || 'student'}!`,
        variant: 'success',
      });
      navigate(next, { replace: true });
    } catch (error) {
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
      }
      setFormError(error?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Badge variant="outline" className="gap-1.5">
        <LockKeyhole size={11} aria-hidden="true" />
        Secure session
      </Badge>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">
        Log in with the email and password you registered with.
      </p>

      {isAuthenticated ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-lime/25 bg-lime/[0.06] p-3 text-xs text-silver">
          <Info size={15} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
          <p>
            You are already signed in as <strong className="text-ink">{user?.fullName}</strong>.
            Logging in again will switch accounts.
          </p>
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError('email');
          }}
          error={errors.email}
          maxLength={150}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError('password');
          }}
          error={errors.password}
        />

        <Checkbox
          label="Keep me signed in on this device"
          description="When unchecked, you stay signed in only until this tab closes."
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />

        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/[0.07] p-3 text-sm text-red-200"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting} iconRight={ArrowRight}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        New to FusionV?{' '}
        <Link
          to={`${paths.signup}?next=${encodeURIComponent(next)}`}
          className="font-semibold text-lime hover:underline"
        >
          Create an account
        </Link>
      </p>

      <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
        Email and password only. Google/GitHub sign-in and email-based password recovery are not
        available in this version.
      </p>
    </div>
  );
}
