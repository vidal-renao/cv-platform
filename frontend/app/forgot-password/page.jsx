'use client'

import { useState } from 'react';
import { useTranslation } from '../../lib/i18n';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('auth.forgotPassword.loading'));
      setSent(true);
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
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white transition mb-8 font-body">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {t('auth.forgotPassword.backToLogin')}
        </Link>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-white">{t('auth.forgotPassword.emailSent')}</h2>
            <p className="text-sm text-white/40 font-body">
              {t('auth.forgotPassword.emailSentText')}
            </p>
            <p className="text-xs text-white/20 font-body">{t('auth.forgotPassword.linkExpiry')}</p>
            <Link href="/login" className="block mt-4 text-sm text-teal-400 hover:text-teal-300 font-medium transition font-body">
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-white">{t('auth.forgotPassword.title')}</h2>
              <p className="text-sm text-white/40 mt-2 font-body">{t('auth.forgotPassword.subtitle')}</p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-xl font-body">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('auth.forgotPassword.emailLabel')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.forgotPassword.emailPlaceholder')}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-navy-900 font-display font-bold rounded-xl transition text-sm"
              >
                {loading ? t('auth.forgotPassword.loading') : t('auth.forgotPassword.submitBtn')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
