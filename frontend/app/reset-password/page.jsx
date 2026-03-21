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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-10">

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('auth.resetPassword.success')}</h2>
            <p className="text-sm text-gray-500">{t('auth.resetPassword.successText')}</p>
            <p className="text-xs text-gray-400">{t('auth.resetPassword.redirecting')}</p>
            <Link href="/login" className="block mt-2 text-sm text-primary-600 hover:underline font-medium">
              {t('auth.resetPassword.goToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('auth.resetPassword.title')}</h2>
              <p className="text-sm text-gray-500 mt-2">{t('auth.resetPassword.subtitle')}</p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                {error}
                {!token && (
                  <div className="mt-2">
                    <Link href="/forgot-password" className="text-red-700 underline font-medium">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="password"
                    required
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-60 text-sm"
              >
                {loading ? t('auth.resetPassword.loading') : t('auth.resetPassword.submitBtn')}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              {t('auth.resetPassword.rememberPassword')}{' '}
              <Link href="/login" className="text-primary-600 hover:underline font-medium">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
