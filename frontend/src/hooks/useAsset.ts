import { useEffect, useState, useCallback } from 'react';
import { assetService } from '@/services/asset-service';
import type { Asset } from '@/types/asset';

interface UseAssetResult {
  asset: Asset | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => void;
}

export function useAsset(id: string | undefined): UseAssetResult {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    assetService
      .getAsset(id)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setNotFound(true);
        } else {
          setAsset(result);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load this asset. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  return { asset, loading, error, notFound, refetch };
}
