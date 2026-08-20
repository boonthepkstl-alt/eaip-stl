import React from 'react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'กำลังโหลด...' }) => {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
