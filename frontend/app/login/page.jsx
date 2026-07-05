'use client'
import { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { login } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEMO_ACCOUNTS = process.env.NODE_ENV === 'development' ? [
  { label: 'Admin',  email: 'admin@demo.com',  password: 'demo1234', role: 'ADMIN'  },
  { label: 'Staff',  email: 'staff@demo.com',  password: 'demo1234', role: 'STAFF'  },
  { label: 'Client', email: 'client@demo.com', password: 'demo1234', role: 'CLIENT' },
] : [];

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

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
      setError(t('auth.login.demoUnavailable'));
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md glass-card p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-display font-bold tracking-tight text-white">
              CV <span className="text-teal-400">Platform</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-white/40 font-body">
            {t('common.login')} &mdash;{' '}
            <Link href="/register" className="text-teal-400 hover:text-teal-300 font-medium transition">
              {t('auth.login.createAccount')}
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="text-sm p-3 rounded-lg border text-center bg-red-400/10 border-red-400/20 text-red-400 font-body">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('auth.login.emailPhoneLabel')}</label>
              <input
                name="email"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-white/50 font-body">{t('auth.register.passwordLabel')}</label>
                <Link href="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300 font-medium transition font-body">
                  {t('auth.login.forgotPassword')}
                </Link>
              </div>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-navy-900 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition font-display"
          >
            {loading ? t('auth.login.loading') : t('common.login')}
          </button>
        </form>

        {/* Demo divider */}
        {DEMO_ACCOUNTS.length > 0 && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-white/20 font-medium tracking-wide uppercase font-body">
                  {t('auth.login.demoLabel')}
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
                  className="w-full flex items-center justify-between gap-2.5 py-2.5 px-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-teal-400/20 transition-all text-sm font-semibold text-white/60 disabled:opacity-40 group font-body"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base group-hover:scale-110 transition-transform">
                      {demoLoading === account.role ? (
                        <svg className="w-4 h-4 animate-spin text-teal-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </span>
                    {demoLoading === account.role ? t('auth.login.demoLoading') : `Demo — ${account.label}`}
                  </span>
                  <span className="font-mono text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                    {account.email}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
