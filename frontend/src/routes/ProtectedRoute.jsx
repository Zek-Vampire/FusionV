import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AUTH_STATUS, useAuth } from '@/context/AuthContext';
import BootScreen from '@/components/common/BootScreen';
import ErrorScreen from '@/components/common/ErrorScreen';
import { paths } from '@/routes/paths';

/**
 * Gate for authenticated routes.
 * - token being validated  -> session check screen
 * - server unreachable     -> error screen with a real retry (never a silent logout)
 * - anonymous              -> /login?next=<intended path>, matching the old app
 */
export default function ProtectedRoute() {
  const { status, error, retrySession } = useAuth();
  const location = useLocation();

  if (status === AUTH_STATUS.idle || status === AUTH_STATUS.checking) {
    return <BootScreen label="Checking your session…" />;
  }

  if (status === AUTH_STATUS.error) {
    return (
      <ErrorScreen
        title="Could not check your session"
        message={error?.message}
        onRetry={retrySession}
      />
    );
  }

  if (status !== AUTH_STATUS.authenticated) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`${paths.login}?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
