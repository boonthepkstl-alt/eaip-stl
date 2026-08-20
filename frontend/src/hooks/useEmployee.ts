import { useEffect, useState, useCallback } from 'react';
import { employeeService } from '@/services/employee-service';
import type { Employee } from '@/types/employee';

interface UseEmployeeResult {
  employee: Employee | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => void;
}

export function useEmployee(id: string | undefined): UseEmployeeResult {
  const [employee, setEmployee] = useState<Employee | null>(null);
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

    employeeService
      .getEmployee(id)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setNotFound(true);
        } else {
          setEmployee(result);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load this employee. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  return { employee, loading, error, notFound, refetch };
}
