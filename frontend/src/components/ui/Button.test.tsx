import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

// Smoke test proving the ported design system + Vitest are wired up correctly
// (Definition of Done: "Tests pass if configured" — see FRONTEND-SCAFFOLD-RESULT.md).
describe('Button', () => {
  it('renders children and responds to click', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables the button while loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
