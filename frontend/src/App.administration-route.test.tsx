import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui';
import { AdministrationPage } from '@/pages/Administration';
import { UserManagementPage } from '@/pages/UserManagement';
import { RoleManagementPage } from '@/pages/RoleManagement';

// Route-level test for the Administration vertical slice (Phase 6). Mounts the real routes
// App.tsx registers for /administration, /administration/users, /administration/roles and
// drives navigation the way a user would, following the same pattern as App.route.test.tsx.
function AdministrationRoutes({ initialRoute }: { initialRoute: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/administration" element={<AdministrationPage />} />
            <Route path="/administration/users" element={<UserManagementPage />} />
            <Route path="/administration/roles" element={<RoleManagementPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Administration routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('navigates from the Administration landing page to User Management via the module card', async () => {
    render(<AdministrationRoutes initialRoute="/administration" />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('User Management'));

    await waitFor(() => {
      expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    });
  });

  it('navigates from the Administration landing page to Role Management via the module card', async () => {
    render(<AdministrationRoutes initialRoute="/administration" />);

    await waitFor(() => {
      expect(screen.getByText('Role Management')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Role Management'));

    await waitFor(() => {
      expect(screen.getByText('Module')).toBeInTheDocument();
    });
    expect(screen.getAllByText('System Administrator').length).toBeGreaterThan(0);
  });

  it('navigates from Role Management to User Management via "Manage Users"', async () => {
    render(<AdministrationRoutes initialRoute="/administration/roles" />);

    await waitFor(() => {
      expect(screen.getByText('Module')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Manage Users' }));

    await waitFor(() => {
      expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    });
  });
});
