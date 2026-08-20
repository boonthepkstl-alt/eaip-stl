import { useEffect, useState, useCallback } from 'react';
import { employeeService } from '@/services/employee-service';
import type { Asset } from '@/types/asset';
import type { Employee } from '@/types/employee';

interface UseEmployeeAssignmentsResult {
  assets: Asset[];
  loading: boolean;
  refetch: () => void;
}

/** Thin wrapper around employeeService.getEmployeeAssignments for pages/EmployeeDetail. */
export function useEmployeeAssignments(employee: Employee | null): UseEmployeeAssignmentsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (!employee) {
      setAssets([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    employeeService
      .getEmployeeAssignments(employee.id, employee.name)
      .then((result) => {
        if (!cancelled) setAssets(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depend on id/name, not the whole object reference, so a fresh `employee` object with the same identity doesn't refetch
  }, [employee?.id, employee?.name, reloadToken]);

  return { assets, loading, refetch };
}
