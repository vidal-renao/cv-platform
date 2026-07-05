'use client'
import { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import { register } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError(t('auth.register.passwordsMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.register.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      router.push('/login?registered=1');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md glass-card p-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-display font-bold tracking-tight text-white">
              CV <span className="text-teal-400">Platform</span>
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-display font-bold text-white">
            {t('auth.register.title')}
          </h2>
          <p className="mt-2 text-sm text-white/40 font-body">
            {t('auth.register.haveAccount')}{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleRegister}>
          {error && (
            <div className="text-sm p-3 rounded-lg border text-center bg-red-400/10 border-red-400/20 text-red-400 font-body">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('auth.register.emailLabel')}</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                placeholder={t('auth.register.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('auth.register.passwordLabel')}</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('auth.register.confirmPasswordLabel')}</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-navy-900 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition font-display"
          >
            {loading ? t('auth.register.loading') : t('auth.register.submitBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
