import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { SettingsPage } from './index';

describe('SettingsPage', () => {
  it('renders the General section with the seeded organization name', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings', path: '/settings' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('RAISE Corporation')).toBeInTheDocument();
    });
  });

  it('switches to the Notifications section and shows the seeded toggle state', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings', path: '/settings' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('RAISE Corporation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));

    await waitFor(() => {
      expect(screen.getByText('Assignment updates')).toBeInTheDocument();
    });
  });

  it('saving a change persists it (Save Changes actually mutates, unlike the legacy toast-only button)', async () => {
    renderWithProviders(<SettingsPage />, { route: '/settings', path: '/settings' });

    await waitFor(() => {
      expect(screen.getByDisplayValue('RAISE Corporation')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('RAISE Corporation'), { target: { value: 'Acme Corp' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(screen.getByText('Settings saved')).toBeInTheDocument();
    });

    const { settingsService } = await import('@/services/settings-service');
    const persisted = await settingsService.getSettings();
    expect(persisted.organizationName).toBe('Acme Corp');
  });
});
