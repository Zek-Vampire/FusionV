import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

/** Shows session notices (expired, logged out elsewhere) once, as a toast. */
export default function AuthNoticeBridge() {
  const { notice, clearNotice } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!notice) return;
    toast({
      title: notice,
      variant: 'warning',
      duration: 7000,
    });
    clearNotice();
  }, [notice, toast, clearNotice]);

  return null;
}
