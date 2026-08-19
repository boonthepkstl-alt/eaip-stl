import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/constants';
import Loading from '@/components/Loading';

// Inverse of ProtectedRoute — keeps an already-authenticated session from reopening /login
// (e.g. via browser back after Sign Out, or bookmarking /login while still logged in).
const RedirectIfAuthenticated: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Outlet />;
};

export default RedirectIfAuthenticated;
