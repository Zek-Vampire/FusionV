import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox, Input, SearchInput, Switch } from './FormControls';

function SearchHarness() {
  const [value, setValue] = useState('');
  return <SearchInput value={value} onChange={setValue} label="Search teams" />;
}

function SwitchHarness() {
  const [on, setOn] = useState(false);
  return <Switch label="Notifications" description="Local state" checked={on} onChange={setOn} />;
}

function CheckboxHarness() {
  const [checked, setChecked] = useState(false);
  return <Checkbox label="Accept terms" checked={checked} onChange={(event) => setChecked(event.target.checked)} />;
}

describe('form controls', () => {
  it('links an input error to the control', () => {
    render(<Input label="Email" defaultValue="nope" error="Enter a valid email address." />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email address.');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
  });

  it('clears the search field', async () => {
    const user = userEvent.setup();
    render(<SearchHarness />);

    const input = screen.getByLabelText('Search teams');
    await user.type(input, 'react');
    expect(input).toHaveValue('react');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
  });

  it('toggles a switch and exposes its state', async () => {
    const user = userEvent.setup();
    render(<SwitchHarness />);

    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles a checkbox through its label', async () => {
    const user = userEvent.setup();
    render(<CheckboxHarness />);

    const checkbox = screen.getByRole('checkbox', { name: /Accept terms/ });
    await user.click(screen.getByText('Accept terms'));

    expect(checkbox).toBeChecked();
  });

  it('submits a search on Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SearchInput value="hackathon" onChange={() => {}} onSubmit={onSubmit} label="Search events" />,
    );

    await user.type(screen.getByLabelText('Search events'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('hackathon');
  });
});
