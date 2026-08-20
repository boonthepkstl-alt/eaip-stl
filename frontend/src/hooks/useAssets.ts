import { useEffect, useState, useCallback } from 'react';
import { assetService } from '@/services/asset-service';
import type { Asset, AssetListQuery } from '@/types/asset';

interface UseAssetsResult {
  assets: Asset[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Domain state (assets, loading, error) lives here, separate from the UI state
// (search input value, filter panel open/closed, selected row) that pages/Assets/index.tsx
// owns locally — see ASSET-MANAGEMENT-MIGRATION.md section on state management.
export function useAssets(query: AssetListQuery): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    assetService
      .listAssets(query)
      .then((result) => {
        if (cancelled) return;
        setAssets(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load assets. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on any query field change or explicit refetch
  }, [query.search, query.status, query.department, reloadToken]);

  return { assets, total, loading, error, refetch };
}
