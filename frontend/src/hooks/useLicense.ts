import { useEffect, useState, useCallback } from 'react';
import { licenseService } from '@/services/license-service';
import type { SoftwareLicense } from '@/types/license';

interface UseLicenseResult {
  license: SoftwareLicense | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => void;
}

export function useLicense(idOrCode: string | undefined): UseLicenseResult {
  const [license, setLicense] = useState<SoftwareLicense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (!idOrCode) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    licenseService
      .getLicense(idOrCode)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setNotFound(true);
        } else {
          setLicense(result);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load this license. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idOrCode, reloadToken]);

  return { license, loading, error, notFound, refetch };
}
