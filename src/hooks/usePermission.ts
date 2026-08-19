import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permission';

export function usePermission() {
  const { permissions } = useAuth();

  const can = (required: string): boolean => hasPermission(permissions, required);

  return { permissions, can };
}
