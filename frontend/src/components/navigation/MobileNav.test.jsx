import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Users } from 'lucide-react';
import MobileNav from './MobileNav';

const groups = [
  {
    label: 'Workspace',
    items: [{ to: '/teams', label: 'Teams', icon: Users }],
  },
];

function renderNav(open = true) {
  const onClose = vi.fn();
  render(
    <MemoryRouter initialEntries={['/teams']}>
      <MobileNav
        open={open}
        onClose={onClose}
        groups={groups}
        title="Mobile navigation"
        footer={<p>Drawer footer</p>}
      />
    </MemoryRouter>,
  );
  return { onClose };
}

describe('MobileNav', () => {
  it('renders a modal drawer with links and the footer', () => {
    renderNav();

    const drawer = screen.getByRole('dialog', { name: 'Mobile navigation' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('link', { name: /Teams/ })).toHaveAttribute('href', '/teams');
    expect(screen.getByText('Drawer footer')).toBeInTheDocument();
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    const { onClose } = renderNav();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when a link is chosen', async () => {
    const user = userEvent.setup();
    const { onClose } = renderNav();

    await user.click(screen.getByRole('link', { name: /Teams/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while closed', () => {
    renderNav(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
