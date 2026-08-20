import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { AssetsPage } from './index';

describe('AssetsPage', () => {
  it('renders the seeded assets, e.g. the first fixture asset by name', async () => {
    renderWithProviders(<AssetsPage />, { route: '/assets', path: '/assets' });

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16" M3')).toBeInTheDocument();
    });
  });

  it('renders the asset count badge', async () => {
    renderWithProviders(<AssetsPage />, { route: '/assets', path: '/assets' });
    await waitFor(() => {
      expect(screen.getByText(/^\d+ assets$/)).toBeInTheDocument();
    });
  });
});
