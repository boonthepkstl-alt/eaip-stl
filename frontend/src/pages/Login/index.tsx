import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { ROUTES } from '@/config/constants';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
      navigate(ROUTES.DASHBOARD);
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg border border-surface-200">
        <div className="mb-6 flex items-center gap-2.5 justify-center">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center text-white font-bold shadow-sm">
            R
          </div>
          <span className="text-title font-bold text-surface-900">RAISE</span>
        </div>

        {error && <div className="mb-4 rounded bg-error-50 p-3 text-body text-error-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-caption font-medium text-surface-700">
              Username
            </label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-caption font-medium text-surface-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
