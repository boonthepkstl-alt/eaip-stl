import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { AssetDetailPage } from './index';

describe('AssetDetailPage', () => {
  it('loads and displays a known asset by route param', async () => {
    renderWithProviders(<AssetDetailPage />, { route: '/assets/a1', path: '/assets/:assetId' });

    await waitFor(() => {
      expect(screen.getByText('AST-0001 · C02XK1ABJGH')).toBeInTheDocument();
    });
  });

  it('shows a not-found state for an unknown asset id', async () => {
    renderWithProviders(<AssetDetailPage />, { route: '/assets/does-not-exist', path: '/assets/:assetId' });

    await waitFor(() => {
      expect(screen.getByText('Asset not found')).toBeInTheDocument();
    });
  });
});
