import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '@/context/ToastContext';

function Trigger() {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        toast({ title: 'Saved successfully', description: 'Toast body', variant: 'success', duration: 1000 })
      }
    >
      Show toast
    </button>
  );
}

function renderToasts() {
  return render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  it('shows a toast and dismisses it from the close button', async () => {
    const user = userEvent.setup();
    renderToasts();

    await user.click(screen.getByRole('button', { name: 'Show toast' }));

    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Toast body');

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
  });

  it('auto-dismisses after the configured duration', () => {
    vi.useFakeTimers();
    renderToasts();

    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
  });
});
