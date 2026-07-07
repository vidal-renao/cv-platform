'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n';

const API_URL = '/api';

const DEMO_BANNER_KEY = 'cv_demo_banner_dismissed';

const DEMO_CREDENTIALS = [
  { role: 'Admin',  email: 'admin@demo.ch'  },
  { role: 'Staff',  email: 'staff@demo.ch'  },
  { role: 'Client', email: 'client@demo.ch' },
];

const SERVICES = [
  {
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    titleKey: 'services.items.0.title',
    descKey: 'services.items.0.desc',
    tag: 'popular',
  },
  {
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    titleKey: 'services.items.1.title',
    descKey: 'services.items.1.desc',
  },
  {
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    titleKey: 'services.items.2.title',
    descKey: 'services.items.2.desc',
  },
  {
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    titleKey: 'services.items.3.title',
    descKey: 'services.items.3.desc',
  },
  {
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    titleKey: 'services.items.4.title',
    descKey: 'services.items.4.desc',
    tag: 'new',
  },
  {
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    titleKey: 'services.items.5.title',
    descKey: 'services.items.5.desc',
  },
];

const STATS = [
  { value: '10K+', key: 'packages' },
  { value: '98%', key: 'satisfaction' },
  { value: '48h', key: 'deliveryTime' },
  { value: '24/7', key: 'support' },
];



export default function Home() {
  const router = useRouter();
  const { t }  = useTranslation();
  const [showDemoBanner, setShowDemoBanner] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [contactForm, setContactForm]     = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle');
  const [contactError, setContactError]   = useState('');

  useEffect(() => {
    setShowDemoBanner(!localStorage.getItem(DEMO_BANNER_KEY));
  }, []);

  const dismissDemoBanner = () => {
    localStorage.setItem(DEMO_BANNER_KEY, 'true');
    setShowDemoBanner(false);
  };

  const handleTrack = (e) => {
    e.preventDefault();
    const num = trackingInput.trim();
    if (num) router.push(`/track/${encodeURIComponent(num)}`);
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setContactStatus('loading');
    setContactError('');
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('contact.sending'));
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      setContactStatus('error');
      setContactError(err.message);
    }
  };

  return (
    <main className="flex-1 flex flex-col">

      {/* ── DEMO BANNER ─────────────────────────────────────── */}
      {showDemoBanner && (
        <div className="relative z-20 bg-teal-500/10 border-b border-teal-500/20 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-teal-300 font-body">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{t('hero.demoBanner')}</span>
              <span className="hidden sm:inline text-white/40 mx-1">—</span>
              <span className="hidden sm:inline text-white/40">
                {DEMO_CREDENTIALS.map((c, i) => (
                  <span key={c.role}>
                    {i > 0 && <span className="mx-1.5 text-white/20">|</span>}
                    <span className="font-mono text-xs text-teal-300/80">{c.email}</span>
                    <span className="text-white/30 mx-1">/</span>
                    <span className="font-mono text-xs text-teal-300/80">demo1234</span>
                  </span>
                ))}
              </span>
            </div>
            <button
              onClick={dismissDemoBanner}
              className="text-white/30 hover:text-white/70 transition flex-shrink-0"
              aria-label={t('common.close')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 sm:py-40 min-h-[88vh] overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 inline-flex items-center gap-2 bg-teal-400/10 text-teal-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-teal-400/20 font-body">
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-tracking-pulse" />
          {t('hero.badge')}
        </div>

        <h1 className="relative z-10 text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white tracking-tight max-w-4xl leading-[1.1] mb-5">
          {t('hero.title1')}{' '}
          <span className="gradient-text">{t('hero.title2')}</span>
        </h1>

        <p className="relative z-10 text-white/50 text-lg max-w-2xl mb-14 leading-relaxed font-body">
          {t('hero.subtitle')}
        </p>

        <div className="relative z-10 w-full max-w-2xl space-y-3">
          {/* Tracking bar — the signature element */}
          <form onSubmit={handleTrack}>
            <div className="flex rounded-2xl overflow-hidden border border-white/10 focus-within:border-teal-400/50 transition-colors bg-white/[0.03] backdrop-blur-sm">
              <div className="relative flex-1">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder={t('hero.placeholder')}
                  className="w-full bg-transparent text-white placeholder-white/30 pl-14 pr-4 py-5 text-base focus:outline-none font-mono tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={!trackingInput.trim()}
                className="bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-navy-900 font-display font-bold px-8 py-5 text-base transition flex items-center gap-2 whitespace-nowrap"
              >
                {t('hero.trackBtn')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </form>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-xs text-white/25 font-body">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('hero.trustSecure')}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('hero.trustRealTime')}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t('hero.trustNoAccount')}
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/40 font-body">
          <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition flex items-center gap-1.5">
            {t('hero.loginCtaPre')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <span className="hidden sm:inline text-white/10">|</span>
          <Link href="/register" className="hover:text-white/60 transition">
            {t('hero.registerCta')}
          </Link>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="border-y border-white/5 px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, key }) => (
            <div key={key}>
              <p className="text-3xl sm:text-4xl font-display font-bold gradient-text">{value}</p>
              <p className="text-white/40 text-sm mt-1 font-body">{t(`stats.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS ───────────────────────────────────────── */}
      <section id="servicios" className="px-6 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest font-body">{t('services.label')}</span>
            <h2 className="text-4xl font-display font-bold text-white mt-2 mb-4 tracking-tight">
              {t('services.title')}
            </h2>
            <p className="text-white/40 max-w-xl mx-auto font-body">
              {t('services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(({ icon, titleKey, descKey, tag }) => (
              <div
                key={titleKey}
                className="glass-card p-7 hover:bg-white/[0.05] transition group"
              >
                {tag && (
                  <span className="inline-flex text-[10px] font-bold bg-teal-400/10 text-teal-400 border border-teal-400/20 px-2 py-0.5 rounded-full mb-4 uppercase tracking-wider font-body">
                    {tag === 'popular' ? t('services.tagPopular') : t('services.tagNew')}
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl bg-teal-400/10 group-hover:bg-teal-400/15 flex items-center justify-center transition mb-4">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base mb-1.5">{t(titleKey)}</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-body">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="px-6 py-24 scroll-mt-16 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest font-body">{t('howItWorks.label')}</span>
            <h2 className="text-4xl font-display font-bold text-white mt-2 mb-4 tracking-tight">{t('howItWorks.title')}</h2>
            <p className="text-white/40 max-w-lg mx-auto font-body">{t('howItWorks.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
                titleKey: 'howItWorks.step1.title',
                descKey:  'howItWorks.step1.desc',
              },
              {
                step: '02',
                icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                titleKey: 'howItWorks.step2.title',
                descKey:  'howItWorks.step2.desc',
              },
              {
                step: '03',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                titleKey: 'howItWorks.step3.title',
                descKey:  'howItWorks.step3.desc',
              },
            ].map(({ step, icon, titleKey, descKey }, i) => (
              <div key={step} className="relative glass-card p-8 text-center group hover:bg-white/[0.05] transition">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-px bg-white/10 z-10" />
                )}
                <div className="w-14 h-14 rounded-2xl bg-teal-400/10 flex items-center justify-center mb-5 group-hover:bg-teal-400/15 transition mx-auto">
                  <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                  </svg>
                </div>
                <span className="text-xs font-mono text-teal-400/50 tracking-widest mb-2 block">{step}</span>
                <h3 className="font-display font-bold text-white text-base mb-2">{t(titleKey)}</h3>
                <p className="text-sm text-white/40 leading-relaxed font-body">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest font-body">{t('testimonials.label')}</span>
            <h2 className="text-4xl font-display font-bold text-white mt-2 tracking-tight">{t('testimonials.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="glass-card p-7 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/50 text-sm leading-relaxed italic font-body">&ldquo;{t(`testimonials.items.${i}.text`)}&rdquo;</p>
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                  <div className="w-9 h-9 rounded-full bg-teal-400/10 text-teal-400 flex items-center justify-center text-sm font-bold flex-shrink-0 font-display">
                    {t(`testimonials.items.${i}.name`).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-body">{t(`testimonials.items.${i}.name`)}</p>
                    <p className="text-xs text-white/30 font-body">{t(`testimonials.items.${i}.company`)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO ────────────────────────────────────────── */}
      <section id="contacto" className="px-6 py-24 scroll-mt-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Info */}
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest font-body">{t('contact.label')}</span>
            <h2 className="text-4xl font-display font-bold text-white mt-2 mb-6 tracking-tight">
              {t('contact.title')}
            </h2>
            <p className="text-white/40 mb-10 leading-relaxed font-body">
              {t('contact.subtitle')}
            </p>

            <div className="space-y-5">
              {[
                {
                  icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                  labelKey: 'contact.emailLabel',
                  value: 'soporte@cvplatform.com',
                  href: 'mailto:soporte@cvplatform.com',
                },
                {
                  icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                  labelKey: 'contact.phoneLabel',
                  value: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '+507 000-0000',
                  href: `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '').replace(/\D/g, '')}`,
                },
              ].map(({ icon, labelKey, value, href }) => (
                <a key={labelKey} href={href} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-400/10 transition">
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 font-medium font-body">{t(labelKey)}</p>
                    <p className="text-white font-semibold group-hover:text-teal-400 transition font-body">{value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Mini map */}
            <div className="mt-10 rounded-2xl overflow-hidden border border-white/5 h-52">
              <iframe
                title="Ubicación"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-79.5730%2C8.9400%2C-79.4730%2C9.0100&layer=mapnik&marker=8.9936%2C-79.5197"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="glass-card p-8">
              <h3 className="text-xl font-display font-bold text-white mb-6">{t('contact.formTitle')}</h3>

              {contactStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 bg-teal-400/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-display font-bold text-white mb-1">{t('contact.successTitle')}</h4>
                  <p className="text-sm text-white/40 mb-6 font-body">{t('contact.successText')}</p>
                  <button
                    onClick={() => setContactStatus('idle')}
                    className="text-sm text-teal-400 hover:text-teal-300 font-medium transition font-body"
                  >
                    {t('contact.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  {contactStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5 font-body">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {contactError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('contact.nameLabel')}</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t('contact.namePlaceholder')}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('contact.emailFieldLabel')}</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                      placeholder={t('contact.emailPlaceholder')}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition font-body"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-white/50 mb-1.5 font-body">{t('contact.messageLabel')}</label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                      placeholder={t('contact.messagePlaceholder')}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-teal-400/50 transition resize-none font-body"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={contactStatus === 'loading'}
                    className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-navy-900 font-display font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {contactStatus === 'loading' ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        {t('contact.sending')}
                      </>
                    ) : (
                      <>
                        {t('contact.sendBtn')}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="lg:col-span-2">
              <p className="text-xl font-display font-bold tracking-tight mb-3">CV Platform</p>
              <p className="text-white/30 text-sm leading-relaxed max-w-xs font-body">
                {t('footer.tagline')}
              </p>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 font-body">{t('footer.servicesTitle')}</p>
              <ul className="space-y-2.5 text-sm text-white/30">
                {[0, 1, 2, 3, 4].map(i => (
                  <li key={i}>
                    <Link href="/#servicios" className="hover:text-white transition font-body">{t(`footer.serviceLinks.${i}`)}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 font-body">{t('footer.contactTitle')}</p>
              <ul className="space-y-3 text-sm text-white/30">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:soporte@cvplatform.com" className="hover:text-white transition font-body">
                    soporte@cvplatform.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-body">Ciudad de Panamá, Panamá</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/20">
            <p className="font-body">© {new Date().getFullYear()} Vidal Ecosystem. {t('footer.copyright')}</p>
            <div className="flex gap-5 font-body">
              <a href="#" className="hover:text-white/50 transition">{t('footer.terms')}</a>
              <a href="#" className="hover:text-white/50 transition">{t('footer.privacy')}</a>
              <Link href="/login" className="hover:text-white/50 transition">{t('footer.staffAccess')}</Link>
            </div>
          </div>

        </div>
      </footer>

    </main>
  );
}
