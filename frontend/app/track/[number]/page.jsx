'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../../../lib/i18n';

const API_URL = '/api';

const STATUS_ORDER = { ARRIVED: 0, READY_FOR_PICKUP: 1, PICKED_UP: 2 };

export default function TrackPage() {
  const { number } = useParams();
  const router = useRouter();
  const { t }  = useTranslation();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newQuery, setNewQuery] = useState('');

  useEffect(() => {
    if (!number) return;
    setLoading(true);
    setError('');
    setPkg(null);

    fetch(`${API_URL}/track/${encodeURIComponent(number)}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || t('tracking.notFoundTitle'));
        }
        return r.json();
      })
      .then(setPkg)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [number, t]);

  const handleNewSearch = (e) => {
    e.preventDefault();
    const q = newQuery.trim();
    if (q) router.push(`/track/${encodeURIComponent(q)}`);
  };

  const currentStep = pkg ? (STATUS_ORDER[pkg.status] ?? 0) : 0;

  const STATUS_STEPS = [
    { key: 'ARRIVED',          label: t('tracking.steps.0.label'), desc: t('tracking.steps.0.desc') },
    { key: 'READY_FOR_PICKUP', label: t('tracking.steps.1.label'), desc: t('tracking.steps.1.desc') },
    { key: 'PICKED_UP',        label: t('tracking.steps.2.label'), desc: t('tracking.steps.2.desc') },
  ];

  const statusLabel = (status) =>
    t(`tracking.statusLabels.${status}`) !== `tracking.statusLabels.${status}`
      ? t(`tracking.statusLabels.${status}`)
      : status;

  const dateLocale = 'default';

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">

      {/* ── TOPBAR ─────────────────────────────────────────── */}
      <div className="bg-navy-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-display font-bold tracking-tight text-white hover:text-teal-400 transition">
            CV <span className="text-teal-400">Platform</span>
          </Link>
          <Link href="/login" className="text-sm text-white/40 hover:text-white transition font-body">
            {t('tracking.loginLink')}
          </Link>
        </div>
      </div>

      {/* ── SEARCH BAR ─────────────────────────────────────── */}
      <div className="bg-navy-900/50 border-b border-white/5 px-6 py-5 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleNewSearch}>
            <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-teal-400/50 transition-colors bg-white/[0.03]">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  placeholder={decodeURIComponent(number)}
                  className="w-full bg-transparent text-white placeholder-white/20 pl-11 pr-4 py-3 text-sm focus:outline-none font-mono tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-400 text-navy-900 font-display font-bold px-6 py-3 text-sm transition whitespace-nowrap"
              >
                {t('tracking.trackBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────── */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg className="w-9 h-9 text-teal-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-red-400/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-white mb-2">{t('tracking.notFoundTitle')}</h2>
            <p className="text-white/40 text-sm mb-6 font-body">{error}</p>
            <Link href="/" className="text-sm text-teal-400 hover:text-teal-300 font-medium transition font-body">
              {t('tracking.backHome')}
            </Link>
          </div>
        )}

        {/* Result */}
        {pkg && !loading && (
          <div className="space-y-5">

            {/* Package card */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1 font-body">
                    {t('tracking.trackingNumberLabel')}
                  </p>
                  <p className="tracking-number-display">
                    {pkg.tracking_number}
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-full text-sm font-semibold border border-teal-400/20 bg-teal-400/10 text-teal-400 font-body">
                  {statusLabel(pkg.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/40 font-body">
                {pkg.description && <span>{pkg.description}</span>}
                {pkg.weight     && <span>{pkg.weight} kg</span>}
                <span>{t('tracking.registeredLabel')} {new Date(pkg.created_at).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-white mb-7">{t('tracking.shipmentStatus')}</h3>
              <div>
                {STATUS_STEPS.map((step, index) => {
                  const done   = index <= currentStep;
                  const active = index === currentStep;
                  const isLast = index === STATUS_STEPS.length - 1;

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? 'bg-teal-400 border-teal-400' : 'bg-navy-800 border-white/10'
                        }`}>
                          {done ? (
                            <svg className="w-4 h-4 text-navy-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white/20" />
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 my-1.5 flex-1 min-h-[2rem] ${
                            done && index < currentStep ? 'bg-teal-400' : 'bg-white/10'
                          }`} />
                        )}
                      </div>

                      <div className={`${isLast ? 'pb-0' : 'pb-8'}`}>
                        <p className={`font-semibold text-sm leading-tight font-body ${done ? 'text-white' : 'text-white/30'}`}>
                          {step.label}
                        </p>
                        <p className={`text-xs mt-0.5 font-body ${done ? 'text-white/40' : 'text-white/20'}`}>
                          {step.desc}
                        </p>
                        {active && pkg.updated_at && (
                          <p className="text-xs text-teal-400 mt-1 font-medium font-body">
                            {new Date(pkg.updated_at).toLocaleString(dateLocale, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Login CTA */}
            <div className="glass-card p-6 text-center">
              <p className="text-white/40 text-sm mb-4 font-body">
                {t('tracking.loginCta')}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-900 font-display font-bold text-sm px-6 py-2.5 rounded-xl transition"
              >
                {t('tracking.loginBtn')}
              </Link>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
