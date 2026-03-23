'use client'
import { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { login } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEMO_ACCOUNTS = [
  { label: 'Admin',  email: 'admin@demo.com',  password: '123456', role: 'ADMIN'  },
  { label: 'Staff',  email: 'staff@demo.com',  password: '123456', role: 'STAFF'  },
  { label: 'Client', email: 'client@demo.com', password: '123456', role: 'CLIENT' },
];

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // stores which demo is loading

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      if (data.user?.role === 'CLIENT') {
        router.push('/client/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setDemoLoading(account.role);
    setError('');
    try {
      const data = await login(account.email, account.password);
      if (data.user?.role === 'CLIENT') {
        router.push('/client/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Demo account not available. Contact the administrator.');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 border-t-4 border-primary-600">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl transition-all border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 tracking-tight">
            CV Platform
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('common.login')} to your account &mdash;{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Create account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email o Teléfono</label>
              <input
                name="email"
                type="text"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
                placeholder="name@company.com o 0779726299"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : t('common.login')}
            </button>
          </div>
        </form>

        {/* Quick Demo Login */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400 font-medium tracking-wide uppercase">
              or try the live demo
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => handleDemoLogin(account)}
              disabled={demoLoading !== null}
              className="w-full flex items-center justify-between gap-2.5 py-2.5 px-4 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-sm font-semibold text-gray-700 disabled:opacity-60 group"
            >
              <span className="flex items-center gap-2">
                <span className="text-base group-hover:scale-110 transition-transform">
                  {demoLoading === account.role ? '⏳' : '⚡'}
                </span>
                {demoLoading === account.role ? 'Entering demo…' : `Demo — ${account.label}`}
              </span>
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {account.email}
              </span>
            </button>
          ))}
          <p className="text-center text-xs text-gray-400">Password: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">123456</span></p>
        </div>
      </div>
    </div>
  );
}
