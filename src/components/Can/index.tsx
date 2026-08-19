import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface CanProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children when the current user has the given
 * placeholder permission string (e.g. "asset:read"). See usePermission.ts.
 */
const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { can } = usePermission();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Can;
