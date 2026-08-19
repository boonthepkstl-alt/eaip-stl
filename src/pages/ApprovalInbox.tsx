import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Inbox, ChevronRight, Check, X, History } from 'lucide-react';
import { Card, Badge, Button, Drawer, Textarea, EmptyState, Skeleton, useToast } from '@/components/ui';
import { workflowAPI } from '@/services/workflow';
import { assignmentAPI } from '@/services/assignment';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalAction, ApprovalInboxItem } from '@/types/workflow';
import { approvalActionSchema, type ApprovalActionFormValues } from '@/schemas/assignment.schema';

interface ApprovalInboxProps {
  onNavigate: (id: string) => void;
}

// FR-38..FR-44 (Workflow & Approval) — new page, esaps_bolt-main only ever shipped a
// non-functional "ApprovalsPlaceholder" for this route. Sequential Approval supports only 1
// step in this wave (no escalation) — ห้ามสมมติว่ามี step >= 2 เสมอ.
export function ApprovalInbox({ onNavigate }: ApprovalInboxProps) {
  void onNavigate;
  const { user } = useAuth();
  const { push } = useToast();
  const [items, setItems] = useState<ApprovalInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApprovalInboxItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchInbox = async () => {
    if (!user?.employeeId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await workflowAPI.listInboxForCurrentUser(user.employeeId));
    } catch (err) {
      push({ variant: 'error', title: 'Could not load approval inbox', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.employeeId]);

  const openItem = (item: ApprovalInboxItem) => {
    setSelected(item);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-surface-500">{items.length} item{items.length === 1 ? '' : 's'} waiting for your approval</p>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={<Inbox className="h-6 w-6" />} title="No pending approvals" description="You don't have anything to review right now." />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.step.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" >
              <button type="button" onClick={() => openItem(item)} className="w-full flex items-center justify-between gap-4 text-left">
                <div className="min-w-0">
                  <p className="text-body font-semibold text-surface-900 truncate">{item.entitySummary.title}</p>
                  <p className="text-caption text-surface-500 mt-0.5">
                    Requested by {item.entitySummary.requestedBy}
                    {item.entitySummary.requestedAt && ` · ${item.entitySummary.requestedAt.slice(0, 10)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="warning" dot>Pending</Badge>
                  <ChevronRight className="h-4 w-4 text-surface-400" />
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      <ApprovalDetailDrawer open={drawerOpen} item={selected} onClose={() => setDrawerOpen(false)} onDecided={fetchInbox} />
    </div>
  );
}

interface ApprovalDetailDrawerProps {
  open: boolean;
  item: ApprovalInboxItem | null;
  onClose: () => void;
  onDecided: () => void;
}

function ApprovalDetailDrawer({ open, item, onClose, onDecided }: ApprovalDetailDrawerProps) {
  const { push } = useToast();
  const [auditTrail, setAuditTrail] = useState<ApprovalAction[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<ApprovalActionFormValues>({
    resolver: zodResolver(approvalActionSchema),
    defaultValues: { action: 'approve', comment: '' },
  });

  useEffect(() => {
    if (!open || !item) return;
    reset({ action: 'approve', comment: '' });

    let cancelled = false;
    setLoadingAudit(true);
    workflowAPI.getAuditTrail(item.entityType, item.step.entityId)
      .then((trail) => { if (!cancelled) setAuditTrail(trail); })
      .catch((err) => {
        if (cancelled) return;
        push({ variant: 'error', title: 'Could not load audit trail', message: err instanceof Error ? err.message : String(err) });
      })
      .finally(() => { if (!cancelled) setLoadingAudit(false); });
    return () => { cancelled = true; };
  }, [open, item, reset, push]);

  if (!item) return null;

  const decide = async (values: ApprovalActionFormValues) => {
    try {
      await workflowAPI.action(item.step.id, values.action, values.comment);

      // Reacts to the workflow engine's decision — not approve/reject logic itself. See
      // services/assignment.ts `applyApprovalDecision` for why this stays entity-agnostic.
      if (item.entityType === 'assignment') {
        await assignmentAPI.applyApprovalDecision(item.step.entityId, values.action === 'approve');
      }

      push({ variant: values.action === 'approve' ? 'success' : 'info', title: values.action === 'approve' ? 'Approved' : 'Rejected', message: item.entitySummary.title });
      onDecided();
      onClose();
    } catch (err) {
      push({ variant: 'error', title: 'Could not save decision', message: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={item.entitySummary.title}
      description={`Requested by ${item.entitySummary.requestedBy}`}
      footer={
        <>
          <Button
            variant="outline"
            className="text-error-600 hover:bg-error-50 border-error-200"
            leftIcon={<X className="h-4 w-4" />}
            disabled={isSubmitting}
            onClick={() => { setValue('action', 'reject'); handleSubmit(decide)(); }}
          >
            Reject
          </Button>
          <Button
            leftIcon={<Check className="h-4 w-4" />}
            loading={isSubmitting}
            onClick={() => { setValue('action', 'approve'); handleSubmit(decide)(); }}
          >
            Approve
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Controller control={control} name="comment" render={({ field }) => (
          <Textarea label="Comment" helpText="Optional" value={field.value ?? ''} onChange={field.onChange} />
        )} />

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-wide text-surface-500">
            <History className="h-3.5 w-3.5" /> Audit Trail
          </h3>
          {loadingAudit ? (
            <p className="text-body text-surface-400">Loading...</p>
          ) : auditTrail.length === 0 ? (
            <p className="text-body text-surface-400">No approval history yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {auditTrail.map((action) => (
                <li key={action.id} className="rounded-md border border-surface-200 p-3 text-body">
                  <p className="font-medium text-surface-900">{action.action === 'approve' ? 'Approved' : 'Rejected'} by {action.actionedBy}</p>
                  <p className="text-caption text-surface-500">{action.actionedAt.slice(0, 19).replace('T', ' ')}</p>
                  {action.comment && <p className="mt-1 text-caption text-surface-600">{action.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}
