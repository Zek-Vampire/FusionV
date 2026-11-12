import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { paths } from '@/routes/paths';

export function useSignOut() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useCallback(() => {
    // Commit the public route before clearing auth state. Otherwise the
    // ProtectedRoute redirect can win and send logout to /login?next=<page>.
    navigate(paths.home, { replace: true, flushSync: true });
    logout();
    toast({
      title: 'Signed out',
      description: 'Your session was cleared on this device.',
      variant: 'success',
    });
  }, [logout, toast, navigate]);
}
