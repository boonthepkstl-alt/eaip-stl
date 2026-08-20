import React from 'react';
import { User } from '@/types/auth';

interface DashboardHeaderProps {
  user: User | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">ยินดีต้อนรับ, {user?.username}</p>
    </div>
  );
};
