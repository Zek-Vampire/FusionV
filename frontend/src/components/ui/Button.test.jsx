import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Button, { ButtonLink, buttonClasses } from './Button';

describe('Button', () => {
  it('renders the primary variant by default and fires clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save changes</Button>);

    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button.className).toContain('bg-lime');

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables itself and reports busy while loading', () => {
    render(<Button loading>Saving</Button>);

    const button = screen.getByRole('button', { name: /Saving/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('merges variant and size classes', () => {
    expect(buttonClasses({ variant: 'danger', size: 'lg' })).toContain('bg-red-500');
    expect(buttonClasses({ variant: 'ghost', size: 'sm' })).toContain('h-9');
    expect(buttonClasses({ variant: 'unknown' })).toContain('bg-lime');
  });

  it('renders a router link with button styling', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/design-system" variant="outline">
          Open gallery
        </ButtonLink>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'Open gallery' });
    expect(link).toHaveAttribute('href', '/design-system');
    expect(link.className).toContain('border-line');
  });
});
