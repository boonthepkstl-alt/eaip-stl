import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, CheckCheck, UserCheck, GitPullRequestArrow, Wrench } from 'lucide-react';
import { Card, Button, EmptyState, Skeleton, useToast } from '@/components/ui';
import { notificationAPI } from '@/services/notification';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationCategory, NotificationItem } from '@/types/notification';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/cn';

interface NotificationCenterProps {
  onNavigate: (id: string) => void;
}

const categoryIcons: Record<NotificationCategory, React.ReactNode> = {
  assignment: <UserCheck className="h-4 w-4" />,
  approval: <GitPullRequestArrow className="h-4 w-4" />,
  it_request: <Wrench className="h-4 w-4" />,
};

const categoryColors: Record<NotificationCategory, string> = {
  assignment: 'bg-brand-50 text-brand-600',
  approval: 'bg-error-50 text-error-600',
  it_request: 'bg-warning-50 text-warning-600',
};

// FR-34, FR-36, FR-37 (Notification) — real data from notificationAPI (ported in Step 1)
// keyed by the signed-in employee (user.employeeId, per Phase E's Employee id namespace),
// replacing Bolt's @/data/mockData import. `it_request` category is kept for forward-compat
// with Phase F (IT Request) but nothing produces it yet, so deep-link only handles
// entityType 'assignment' for now.
export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { user } = useAuth();
  const { push } = useToast();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.employeeId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await notificationAPI.list(user.employeeId));
    } catch (err) {
      push({ variant: 'error', title: 'ไม่สามารถโหลดการแจ้งเตือนได้', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.employeeId]);

  const filtered = filter === 'all' ? items : items.filter((n) => !n.isRead);
  const unreadCount = items.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await notificationAPI.markRead(id);
    } catch (err) {
      push({ variant: 'error', title: 'ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้', message: err instanceof Error ? err.message : String(err) });
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((n) => !n.isRead);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await Promise.all(unread.map((n) => notificationAPI.markRead(n.id)));
    } catch (err) {
      push({ variant: 'error', title: 'ไม่สามารถทำเครื่องหมายว่าอ่านแล้วทั้งหมดได้', message: err instanceof Error ? err.message : String(err) });
      fetchNotifications();
    }
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationAPI.deleteNotification(id);
    } catch (err) {
      push({ variant: 'error', title: 'ไม่สามารถลบการแจ้งเตือนได้', message: err instanceof Error ? err.message : String(err) });
      fetchNotifications();
    }
  };

  const openItem = (n: NotificationItem) => {
    if (!n.isRead) markRead(n.id);
    if (n.entityType === 'assignment') {
      onNavigate('assignment');
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Bell className="h-5 w-5" /></div>
            <div>
              <p className="text-title font-semibold text-surface-900">Notifications</p>
              <p className="text-caption text-surface-500">{unreadCount} unread of {items.length} total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
              <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-md text-body font-medium transition-colors', filter === 'all' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600')}>All</button>
              <button onClick={() => setFilter('unread')} className={cn('px-3 py-1.5 rounded-md text-body font-medium transition-colors', filter === 'unread' ? 'bg-white text-surface-900 shadow-xs' : 'text-surface-600')}>Unread</button>
            </div>
            <Button variant="outline" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} disabled={unreadCount === 0} onClick={markAllRead}>Mark all read</Button>
          </div>
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            description={filter === 'unread' ? 'You are all caught up.' : 'Notifications will appear here when there is activity.'}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={cn('p-4 transition-all hover:shadow-sm', !n.isRead && 'border-l-4 border-l-brand-500')}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => openItem(n)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openItem(n); } }}
                className="flex items-start gap-3 cursor-pointer"
              >
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', categoryColors[n.category])}>
                  {categoryIcons[n.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body font-semibold text-surface-900">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />}
                  </div>
                  <p className="text-body text-surface-600 mt-0.5">{n.message}</p>
                  <p className="text-caption text-surface-400 mt-1.5">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button onClick={(e) => { e.stopPropagation(); markRead(n.id); }} title="Mark as read" className="h-8 w-8 flex items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); remove(n.id); }} title="Delete" className="h-8 w-8 flex items-center justify-center rounded-md text-surface-400 hover:bg-error-50 hover:text-error-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
