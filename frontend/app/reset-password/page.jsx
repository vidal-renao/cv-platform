'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n';
import Link from 'next/link';

function ResetPasswordForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError(t('auth.resetPassword.invalidLink'));
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirm) {
      return setError(t('auth.resetPassword.passwordsMismatch'));
    }
    if (form.newPassword.length < 6) {
      return setError(t('auth.resetPassword.passwordMinLength'));
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.resetPassword.loading'));
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
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
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-white">{t('auth.resetPassword.success')}</h2>
            <p className="text-sm text-white/40 font-body">{t('auth.resetPassword.successText')}</p>
            <p className="text-xs text-white/20 font-body">{t('auth.resetPassword.redirecting')}</p>
            <Link href="/login" className="block mt-2 text-sm text-teal-400 hover:text-teal-300 font-medium transition font-body">
              {t('auth.resetPassword.goToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-white">{t('auth.resetPassword.title')}</h2>
              <p className="text-sm text-white/40 mt-2 font-body">{t('auth.resetPassword.subtitle')}</p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl font-body">
                {error}
                {!token && (
                  <div className="mt-2">
                    <Link href="/forgot-password" className="text-teal-400 hover:text-teal-300 underline font-medium font-body">
                      {t('auth.resetPassword.requestNewLink')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { key: 'newPassword', label: t('auth.resetPassword.newPasswordLabel'), placeholder: t('auth.resetPassword.newPasswordPlaceholder') },
                { key: 'confirm',     label: t('auth.resetPassword.confirmPasswordLabel'), placeholder: '••••••••' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-white/50 mb-1.5 font-body">{label}</label>
                  <input
                    type="password"
                    required
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-navy-900 font-display font-bold rounded-xl transition text-sm"
              >
                {loading ? t('auth.resetPassword.loading') : t('auth.resetPassword.submitBtn')}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-white/20 font-body">
              {t('auth.resetPassword.rememberPassword')}{' '}
              <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition font-body">
                {t('auth.resetPassword.signIn')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
