import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';
import { AssetsPage } from '@/pages/Assets';
import { AssetDetailPage } from '@/pages/AssetDetail';
import { CreateAssetPage } from '@/pages/CreateAsset';

// Route-level test for the Asset Management vertical slice (Section 16/21 of the Phase 4
// brief) — mounts the real routes App.tsx registers for /assets, /assets/create,
// /assets/:assetId and drives navigation the way a user would, rather than unit-testing
// each page in isolation.
function AssetRoutes({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/assets/create" element={<CreateAssetPage />} />
            <Route path="/assets/:assetId" element={<AssetDetailPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Asset Management routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('navigates from the asset list to an asset detail page by clicking a row', async () => {
    render(<AssetRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText('MacBook Pro 16" M3')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('MacBook Pro 16" M3'));

    await waitFor(() => {
      expect(screen.getByText('AST-0001 · C02XK1ABJGH')).toBeInTheDocument();
    });
  });

  it('navigates from the asset list to Create Asset via the New Asset button', async () => {
    render(<AssetRoutes initialRoute="/assets" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ assets/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'New Asset' })[0]);

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });
  });
});
