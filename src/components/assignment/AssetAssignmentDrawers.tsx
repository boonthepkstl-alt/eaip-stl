import { Controller, type UseFormReturn } from 'react-hook-form';
import { ArrowRightLeft } from 'lucide-react';
import { Button, Drawer, Select, Input } from '@/components/ui';
import type { AssignAssetFormValues, TransferAssetFormValues } from '@/schemas/assignment.schema';
import type { Employee } from '@/types/organization';

// Shared by pages/AssetList.tsx and pages/AssetDetail.tsx — paired with the hooks in
// hooks/useAssetAssignmentForms.ts. See that file's header comment for why Assignment.tsx keeps
// its own separate Transfer drawer/form instead of using this one.

interface AssignAssetDrawerProps {
  open: boolean;
  onClose: () => void;
  form: UseFormReturn<AssignAssetFormValues>;
  onSubmit: (values: AssignAssetFormValues) => void;
  employees: Employee[];
}

export function AssignAssetDrawer({ open, onClose, form, onSubmit, employees }: AssignAssetDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Assign Asset" description="Select an employee to assign this asset to — this submits for manager approval" footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={form.formState.isSubmitting} onClick={form.handleSubmit(onSubmit)}>Confirm Assignment</Button>
      </>
    }>
      <div className="flex flex-col gap-4">
        <Controller control={form.control} name="employeeId" render={({ field }) => (
          <Select label="Employee" error={form.formState.errors.employeeId?.message} value={field.value} onChange={field.onChange}
            options={[{ value: '', label: 'Select employee' }, ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))]} />
        )} />
        <Input label="Assignment Date" type="date" error={form.formState.errors.assignedDate?.message} {...form.register('assignedDate')} />
        <Input label="Expected Return Date" type="date" helpText="Optional" {...form.register('expectedReturnDate')} />
      </div>
    </Drawer>
  );
}

interface TransferAssetDrawerProps {
  open: boolean;
  onClose: () => void;
  form: UseFormReturn<TransferAssetFormValues>;
  onSubmit: (values: TransferAssetFormValues) => void;
  employees: Employee[];
  currentHolderName: string;
  currentHolderEmployeeId?: string;
  title?: string;
  description?: string;
}

export function TransferAssetDrawer({
  open, onClose, form, onSubmit, employees, currentHolderName, currentHolderEmployeeId,
  title = 'Transfer Asset', description = 'Transfer to a new employee — this submits for manager approval',
}: TransferAssetDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title={title} description={description} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={form.formState.isSubmitting} onClick={form.handleSubmit(onSubmit)}>Confirm Transfer</Button>
      </>
    }>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 border border-surface-200">
          <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><ArrowRightLeft className="h-5 w-5" /></div>
          <div>
            <p className="text-body font-medium text-surface-900">Currently held by</p>
            <p className="text-caption text-surface-500">{currentHolderName || '—'}</p>
          </div>
        </div>
        <Controller control={form.control} name="toEmployeeId" render={({ field }) => (
          <Select label="Transfer To" error={form.formState.errors.toEmployeeId?.message} value={field.value} onChange={field.onChange}
            options={[{ value: '', label: 'Select new holder' }, ...employees.filter((e) => e.id !== currentHolderEmployeeId).map((e) => ({ value: e.id, label: `${e.name} (${e.department})` }))]} />
        )} />
        <Input label="Transfer Date" type="date" error={form.formState.errors.transferDate?.message} {...form.register('transferDate')} />
        <Input label="Reason" placeholder="e.g. Department reorganization" helpText="Optional" {...form.register('reason')} />
      </div>
    </Drawer>
  );
}
