import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function makeAuthValue(overrides = {}) {
  return {
    status: 'anonymous',
    user: null,
    error: null,
    notice: null,
    isAuthenticated: false,
    signIn: async () => null,
    signUp: async () => null,
    logout: () => {},
    retrySession: () => {},
    clearNotice: () => {},
    updateUser: () => {},
    ...overrides,
  };
}

/**
 * Renders a page with the real QueryClient, toast and auth providers.
 * `ui` should contain its own <Routes> when the test asserts navigation.
 */
export function renderWithProviders(
  ui,
  { initialEntries = ['/'], auth = {}, client = createTestQueryClient() } = {},
) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <AuthContext.Provider value={makeAuthValue(auth)}>
            <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
          </AuthContext.Provider>
        </ToastProvider>
      </QueryClientProvider>,
    ),
  };
}
