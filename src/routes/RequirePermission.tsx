import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import { usePermission } from '@/hooks/usePermission';

interface RequirePermissionProps {
  permission: string;
}

/**
 * Route guard that checks a single placeholder permission string before
 * rendering the nested route (Outlet). Redirects to /403 when missing.
 */
const RequirePermission: React.FC<RequirePermissionProps> = ({ permission }) => {
  const { can } = usePermission();

  return can(permission) ? <Outlet /> : <Navigate to={ROUTES.ACCESS_DENIED} replace />;
};

export default RequirePermission;
