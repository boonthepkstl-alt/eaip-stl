import React from 'react';

export const DashboardStats: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-2 text-lg font-semibold text-gray-800">Card 1</h3>
        <p className="text-gray-600">รายละเอียดเพิ่มเติม</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-2 text-lg font-semibold text-gray-800">Card 2</h3>
        <p className="text-gray-600">รายละเอียดเพิ่มเติม</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-2 text-lg font-semibold text-gray-800">Card 3</h3>
        <p className="text-gray-600">รายละเอียดเพิ่มเติม</p>
      </div>
    </div>
  );
};
