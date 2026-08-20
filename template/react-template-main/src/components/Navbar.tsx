import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-500">React Template</h1>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-700">
                  สวัสดี, <span className="font-medium">{user.username}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  ออกจากระบบ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
