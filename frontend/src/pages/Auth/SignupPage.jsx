import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Info, UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Checkbox, Input, PasswordInput } from '@/components/ui/FormControls';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { isStrongPassword, isValidEmail, safeNextPath } from '@/lib/validation';
import { paths } from '@/routes/paths';

export default function SignupPage() {
  usePageTitle('Create account');
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'), paths.home);
  const navigate = useNavigate();
  const { signUp, isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
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
    if (fullName.trim().length < 2) nextErrors.fullName = 'Enter your full name (at least 2 characters).';
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Choose a password.';
    else if (!isStrongPassword(password)) {
      nextErrors.password = 'Use at least 8 characters including a letter and a digit.';
    }
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const created = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        remember,
      });
      toast({
        title: `Account created. Welcome, ${created?.fullName?.split(' ')[0] || 'student'}!`,
        variant: 'success',
      });
      navigate(next, { replace: true });
    } catch (error) {
      if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
      }
      setFormError(error?.message || 'The account could not be created. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Badge variant="outline" className="gap-1.5">
        <UserPlus size={11} aria-hidden="true" />
        New account
      </Badge>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        Join FusionV and start building with students from other colleges.
      </p>

      {isAuthenticated ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-lime/25 bg-lime/[0.06] p-3 text-xs text-silver">
          <Info size={15} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
          <p>
            You are currently signed in as <strong className="text-ink">{user?.fullName}</strong>.
            Creating a new account will switch this browser to the new session.
          </p>
        </div>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="e.g. Priya Nair"
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            clearError('fullName');
          }}
          error={errors.fullName}
          maxLength={100}
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError('password');
          }}
          error={errors.password}
          hint="Use at least 8 characters including a letter and a digit."
        />

        <Checkbox
          label="Keep me signed in on this device"
          description="When unchecked, your session ends when this tab closes."
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
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link
          to={`${paths.login}?next=${encodeURIComponent(next)}`}
          className="font-semibold text-lime hover:underline"
        >
          Log in
        </Link>
      </p>

      <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
        FusionV does not offer Google/GitHub sign-in, email verification or password recovery in
        this version. Your password is hashed by the backend and never returned.
      </p>
    </div>
  );
}
