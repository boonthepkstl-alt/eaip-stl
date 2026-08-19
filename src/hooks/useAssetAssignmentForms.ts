import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui';
import { assignmentAPI } from '@/services/assignment';
import { assignAssetSchema, transferAssetSchema, type AssignAssetFormValues, type TransferAssetFormValues } from '@/schemas/assignment.schema';
import type { Employee } from '@/types/organization';

// Shared by pages/AssetList.tsx, pages/AssetDetail.tsx, and (for the assign half only)
// pages/Assignment.tsx — previously each page hand-rolled its own copy of this form/submit
// logic, which had already drifted (AssetList.tsx's copy silently no-op'd instead of showing an
// error toast when no active assignment was found for the target asset). Centralizing here means
// a future workflow change (or bug fix) only needs to happen once.
//
// Assignment.tsx's own Transfer flow is intentionally NOT unified into this hook — it lets the
// user pick which asset to transfer from a list (employee-scoped or org-wide), whereas this hook
// assumes the asset is already fixed by the caller (AssetList/AssetDetail's use case). Forcing
// both shapes through one hook would need an asset-picker mode that neither of those two pages
// needs, so Assignment.tsx keeps its own form for that broader flow.

interface ActiveAssignmentRef {
  id: string;
  employeeId: string;
  department: string;
}

interface UseAssignAssetFormArgs {
  open: boolean;
  assetId: string;
  employees: Employee[];
  onSuccess: () => void | Promise<void>;
}

export function useAssignAssetForm({ open, assetId, employees, onSuccess }: UseAssignAssetFormArgs) {
  const { push } = useToast();
  const form = useForm<AssignAssetFormValues>({
    resolver: zodResolver(assignAssetSchema),
    defaultValues: { assetId, employeeId: '', assignedDate: '', expectedReturnDate: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ assetId, employeeId: '', assignedDate: '', expectedReturnDate: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (values: AssignAssetFormValues) => {
    try {
      const employee = employees.find((e) => e.id === values.employeeId);
      await assignmentAPI.assign({
        assetId,
        employeeId: values.employeeId,
        department: employee?.department ?? '',
        assignedDate: values.assignedDate,
        expectedReturnDate: values.expectedReturnDate,
      });
      push({ variant: 'success', title: 'Assignment submitted', message: 'Waiting for manager approval.' });
      await onSuccess();
    } catch (err) {
      push({ variant: 'error', title: 'Could not assign', message: err instanceof Error ? err.message : String(err) });
    }
  };

  return { form, onSubmit };
}

interface UseTransferAssetFormArgs {
  open: boolean;
  assetId: string;
  employees: Employee[];
  activeAssignment: ActiveAssignmentRef | undefined;
  onSuccess: () => void | Promise<void>;
}

export function useTransferAssetForm({ open, assetId, employees, activeAssignment, onSuccess }: UseTransferAssetFormArgs) {
  const { push } = useToast();
  const form = useForm<TransferAssetFormValues>({
    resolver: zodResolver(transferAssetSchema),
    defaultValues: { assetId, fromEmployeeId: '', toEmployeeId: '', transferDate: '', reason: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ assetId, fromEmployeeId: activeAssignment?.employeeId ?? '', toEmployeeId: '', transferDate: '', reason: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (values: TransferAssetFormValues) => {
    if (!activeAssignment) {
      push({ variant: 'error', title: 'Could not transfer', message: 'No active assignment found for this asset/employee.' });
      return;
    }
    try {
      const toEmployee = employees.find((e) => e.id === values.toEmployeeId);
      await assignmentAPI.transfer(activeAssignment.id, { toEmployeeId: values.toEmployeeId, department: toEmployee?.department ?? activeAssignment.department });
      push({ variant: 'success', title: 'Transfer submitted', message: 'Waiting for manager approval.' });
      await onSuccess();
    } catch (err) {
      push({ variant: 'error', title: 'Could not transfer', message: err instanceof Error ? err.message : String(err) });
    }
  };

  return { form, onSubmit };
}
