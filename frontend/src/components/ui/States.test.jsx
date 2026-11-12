import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';
import { EmptyState, ErrorState, LoadingState } from './States';

describe('states', () => {
  it('renders a loading state in a status region', () => {
    render(<LoadingState label="Loading teams…" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading teams…');
  });

  it('renders an empty state with an action', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No saved teams"
        description="Save a team to find it here."
        action={<Button onClick={onClick}>Browse teams</Button>}
      />,
    );

    expect(screen.getByText('No saved teams')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Browse teams' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders an error state with a working retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="The API is unreachable." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('The API is unreachable.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
