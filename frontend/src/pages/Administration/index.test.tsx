import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { AdministrationPage } from './index';

describe('AdministrationPage', () => {
  it('renders module cards, recent users, and roles overview from the seeded fixtures', async () => {
    renderWithProviders(<AdministrationPage />, { route: '/administration', path: '/administration' });

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
    expect(screen.getByText('Role Management')).toBeInTheDocument();
    expect(screen.getByText('Departments')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Alex Morgan').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('System Administrator').length).toBeGreaterThan(0);
  });
});
