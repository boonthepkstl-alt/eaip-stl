import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { CreateAssetPage } from './index';

describe('CreateAssetPage', () => {
  it('blocks advancing past step 1 until required fields are filled', () => {
    renderWithProviders(<CreateAssetPage />, { route: '/assets/create', path: '/assets/create' });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Asset name is required')).toBeInTheDocument();
  });

  it('advances through all 4 steps once required fields are filled', async () => {
    renderWithProviders(<CreateAssetPage />, { route: '/assets/create', path: '/assets/create' });

    fireEvent.change(screen.getByLabelText('Asset Name'), { target: { value: 'Test Laptop' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'IT Hardware' } });
    fireEvent.change(screen.getByLabelText('Serial Number'), { target: { value: 'SN-TEST-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.change(screen.getByLabelText('Purchase Cost ($)'), { target: { value: '1200' } });
    fireEvent.change(screen.getByLabelText('Purchase Date'), { target: { value: '2026-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'Engineering' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'HQ - Floor 4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('Review & Confirm')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Laptop')).toBeInTheDocument();
  });
});
