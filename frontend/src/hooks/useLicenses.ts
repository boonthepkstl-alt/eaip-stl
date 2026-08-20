import { useEffect, useState, useCallback } from 'react';
import { licenseService } from '@/services/license-service';
import type { LicenseListQuery, SoftwareLicense } from '@/types/license';

interface UseLicensesResult {
  licenses: SoftwareLicense[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLicenses(query: LicenseListQuery): UseLicensesResult {
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    licenseService
      .listLicenses(query)
      .then((result) => {
        if (cancelled) return;
        setLicenses(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load software licenses. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on any query field change or explicit refetch
  }, [query.search, query.category, query.status, query.vendor, reloadToken]);

  return { licenses, total, loading, error, refetch };
}
