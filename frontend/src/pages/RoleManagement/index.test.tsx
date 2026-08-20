import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { RoleManagementPage } from './index';

describe('RoleManagementPage', () => {
  it('renders the seeded roles and a permission matrix for the first role', async () => {
    renderWithProviders(<RoleManagementPage />, { route: '/administration/roles', path: '/administration/roles' });

    await waitFor(() => {
      expect(screen.getAllByText('System Administrator').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Asset Manager')).toBeInTheDocument();
    expect(screen.getByText('Module')).toBeInTheDocument();
  });
});
