import { useEffect, useState, useCallback } from 'react';
import { userService } from '@/services/user-service';
import type { User, UserListQuery } from '@/types/user';

interface UseUsersResult {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsers(query: UserListQuery): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    userService
      .listUsers(query)
      .then((result) => {
        if (cancelled) return;
        setUsers(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load users. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on any query field change or explicit refetch
  }, [query.search, query.status, reloadToken]);

  return { users, total, loading, error, refetch };
}
