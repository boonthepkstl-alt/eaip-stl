import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { LicenseDetailPage } from './index';

describe('LicenseDetailPage', () => {
  it('loads and displays a known license by route param', async () => {
    renderWithProviders(<LicenseDetailPage />, { route: '/licenses/l1', path: '/licenses/:licenseId' });

    await waitFor(() => {
      expect(screen.getAllByText('Microsoft 365 Enterprise').length).toBeGreaterThan(0);
    });
  });

  it('shows a not-found state for an unknown license id', async () => {
    renderWithProviders(<LicenseDetailPage />, { route: '/licenses/does-not-exist', path: '/licenses/:licenseId' });

    await waitFor(() => {
      expect(screen.getByText('License not found')).toBeInTheDocument();
    });
  });
});
