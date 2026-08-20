import { useEffect, useState, useCallback } from 'react';
import { employeeService } from '@/services/employee-service';
import type { Employee, EmployeeListQuery } from '@/types/employee';

interface UseEmployeesResult {
  employees: Employee[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEmployees(query: EmployeeListQuery): UseEmployeesResult {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    employeeService
      .listEmployees(query)
      .then((result) => {
        if (cancelled) return;
        setEmployees(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load employees. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on any query field change or explicit refetch
  }, [query.search, query.department, query.location, query.status, reloadToken]);

  return { employees, total, loading, error, refetch };
}
