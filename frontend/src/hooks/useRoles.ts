import { useEffect, useState, useCallback } from 'react';
import { roleService } from '@/services/role-service';
import type { Role } from '@/types/role';

interface UseRolesResult {
  roles: Role[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    roleService
      .listRoles()
      .then((result) => {
        if (cancelled) return;
        setRoles(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load roles. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { roles, total, loading, error, refetch };
}
