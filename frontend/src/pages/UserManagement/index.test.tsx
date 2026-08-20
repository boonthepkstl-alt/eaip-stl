import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { UserManagementPage } from './index';

describe('UserManagementPage', () => {
  it('renders the seeded users', async () => {
    renderWithProviders(<UserManagementPage />, { route: '/administration/users', path: '/administration/users' });

    await waitFor(() => {
      expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    });
    expect(screen.getByText('Olivia Brown')).toBeInTheDocument();
  });
});
