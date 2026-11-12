import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import ClickSpark from '@/components/reactbits/ClickSpark';
import AuthNoticeBridge from '@/components/common/AuthNoticeBridge';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { router } from '@/routes/router';
import '@/styles/tokens.css';

/**
 * Server-state defaults. Polling intervals used by the existing app
 * (chat 8s, notifications 60s) are configured per query in later phases.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AuthNoticeBridge />
          <ClickSpark
            sparkColor={['#75ff43', '#42c91d', '#c7d0ca']}
            sparkSize={9}
            sparkRadius={26}
            sparkCount={7}
            sparkWidth={1.6}
            duration={520}
            easing="ease-out"
            glow={0.7}
            className="min-h-screen"
          >
            <RouterProvider router={router} />
          </ClickSpark>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
