import type { ReactElement } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';

// AppShell (used by every migrated page) reads useAuth()/useToast(), so component tests need
// both providers even when auth/toast behavior isn't what's under test.
//
// `path` lets a test render a page that reads route params (useParams) by mounting it under a
// real <Route>, e.g. renderWithProviders(<AssetDetailPage/>, { path: '/assets/:assetId', route: '/assets/a1' }).
export function renderWithProviders(ui: ReactElement, { route = '/', path = '/' }: { route?: string; path?: string } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}
