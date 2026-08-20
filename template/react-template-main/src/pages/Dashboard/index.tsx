import React from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from './_components/DashboardHeader';
import { DashboardStats } from './_components/DashboardStats';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader user={user} />
        <DashboardStats />
      </div>
    </div>
  );
};

export default Dashboard;
