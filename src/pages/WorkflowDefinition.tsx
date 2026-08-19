import { useEffect, useState } from 'react';
import { AlertCircle, GitBranch, User } from 'lucide-react';
import { Button, Card, CardHeader, Badge, EmptyState, Skeleton } from '@/components/ui';
import { workflowAPI } from '@/services/workflow';
import { WorkflowDefinition as WorkflowDefinitionEntity } from '@/types/workflow';

interface WorkflowDefinitionProps {
  onNavigate: (id: string) => void;
}

// FR-38..FR-44 (Workflow & Approval) — new admin page, no Bolt reference existed for this route
// either. Read-only for this wave (create/edit workflow definitions is out of scope) — Sequential
// Approval supports only 1 step in this wave, so each definition only ever shows one step.
export function WorkflowDefinition({ onNavigate }: WorkflowDefinitionProps) {
  void onNavigate;
  const [definitions, setDefinitions] = useState<WorkflowDefinitionEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinitions = () => {
    setLoading(true);
    setError(null);
    workflowAPI.listDefinitions()
      .then((result) => setDefinitions(result))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="เกิดข้อผิดพลาด"
          description={error}
          action={<Button size="sm" onClick={fetchDefinitions}>ลองใหม่</Button>}
        />
      </Card>
    );
  }

  if (definitions.length === 0) {
    return (
      <Card>
        <EmptyState icon={<GitBranch className="h-6 w-6" />} title="No workflow definitions" description="No approval workflows have been configured yet." />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {definitions.map((def) => (
        <Card key={def.id}>
          <CardHeader
            title={def.name}
            description={`Entity: ${def.entityType}`}
            action={<Badge variant={def.isActive ? 'success' : 'neutral'} dot>{def.isActive ? 'Active' : 'Inactive'}</Badge>}
          />
          <div className="p-5 flex flex-col gap-3">
            {def.steps.map((step) => (
              <div key={step.order} className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 border border-surface-200">
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-caption font-semibold shrink-0">
                  {step.order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-surface-900">{step.name}</p>
                  <p className="text-caption text-surface-500 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {step.approverType === 'direct_manager' ? "Requester's Direct Manager" : `Role: ${step.roleId ?? '—'}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
