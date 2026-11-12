import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Tabs from './Tabs';

const tabs = [
  { id: 'alpha', label: 'Alpha', content: <p>Alpha panel</p> },
  { id: 'beta', label: 'Beta', content: <p>Beta panel</p> },
  { id: 'gamma', label: 'Gamma', content: <p>Gamma panel</p> },
];

describe('Tabs', () => {
  it('selects the first tab by default and switches on click', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);

    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Alpha panel')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Beta' }));

    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Beta panel')).toBeInTheDocument();
    expect(screen.queryByText('Alpha panel')).not.toBeInTheDocument();
  });

  it('moves selection and focus with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Tabs tabs={tabs} />);

    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    alpha.focus();
    await user.keyboard('{ArrowRight}');

    const beta = screen.getByRole('tab', { name: 'Beta' });
    expect(beta).toHaveAttribute('aria-selected', 'true');
    expect(beta).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps a single tab stop with roving tabindex', () => {
    render(<Tabs tabs={tabs} />);

    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1');
  });
});
