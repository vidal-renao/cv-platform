'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/* ─── Service icons (order matches translations items array) ─── */
const SERVICE_ICONS = [
  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  'M13 10V3L4 14h7v7l9-11h-7z',
  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
];

/* index 4 = Express (New tag), index 0 = Mailbox (Popular tag) */
const SERVICE_TAG_INDICES = { 0: 'popular', 4: 'new' };

const STATS_KEYS = [
  { value: '10K+', key: 'packages' },
  { value: '98%',  key: 'satisfaction' },
  { value: '48h',  key: 'deliveryTime' },
  { value: '24/7', key: 'support' },
];

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: '#',
    icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  },
  {
    name: 'Instagram',
    href: '#',
    icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 20.5h11A3 3 0 0020.5 17.5v-11A3 3 0 0017.5 3h-11A3 3 0 003.5 6.5v11A3 3 0 006.5 20.5z',
    strokeOnly: true,
  },
  {
    name: 'WhatsApp',
    href: `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '').replace(/\D/g, '')}`,
    icon: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
    filled: true,
  },
];

/* ─── Component ─────────────────────────────────────────────────────── */

export default function Home() {
  const router = useRouter();
  const { t }  = useTranslation();
  const [trackingInput, setTrackingInput] = useState('');
  const [contactForm, setContactForm]     = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle');
  const [contactError, setContactError]   = useState('');

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

  /* Translated services array — items from locale, icons from constant */
  const services = SERVICE_ICONS.map((icon, i) => ({
    icon,
    title: t(`services.items.${i}.title`),
    desc:  t(`services.items.${i}.desc`),
    tag:   SERVICE_TAG_INDICES[i] === 'popular'
             ? t('services.tagPopular')
             : SERVICE_TAG_INDICES[i] === 'new'
               ? t('services.tagNew')
               : null,
  }));

  const footerServiceLinks = Array.from({ length: 5 }, (_, i) => t(`footer.serviceLinks.${i}`));

  return (
    <main className="flex-1 flex flex-col">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        id="hero"
        className="bg-slate-900 flex flex-col items-center justify-center text-center px-6 py-28 sm:py-40 min-h-[88vh]"
      >
        <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-blue-500/25">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          {t('hero.badge')}
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-3xl leading-tight mb-5">
          {t('hero.title1')}{' '}
          <span className="text-blue-400">{t('hero.title2')}</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-lg mb-14 leading-relaxed">
          {t('hero.subtitle')}
        </p>

        {/* Tracking bar */}
        <form onSubmit={handleTrack} className="w-full max-w-2xl">
          <div className="flex rounded-2xl overflow-hidden shadow-2xl shadow-blue-950/60 border border-slate-700 focus-within:border-blue-500 transition-colors">
            <div className="relative flex-1">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder={t('hero.placeholder')}
                className="w-full bg-slate-800 text-white placeholder-slate-500 pl-14 pr-4 py-5 text-base focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!trackingInput.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-5 text-base transition flex items-center gap-2 whitespace-nowrap"
            >
              {t('hero.trackBtn')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-slate-500">
          {t('hero.loginCtaPre')}{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
            {t('hero.loginLink')}
          </Link>
          {' '}{t('hero.loginCtaPost')}
        </p>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section className="bg-blue-600 px-6 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
          {STATS_KEYS.map(({ value, key }) => (
            <div key={key}>
              <p className="text-3xl sm:text-4xl font-extrabold">{value}</p>
              <p className="text-blue-200 text-sm mt-1">{t(`stats.${key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS ───────────────────────────────────────── */}
      <section id="servicios" className="bg-white px-6 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('services.label')}</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-2 mb-4">
              {t('services.title')}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {t('services.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ icon, title, desc, tag }) => (
              <div
                key={title}
                className="relative flex flex-col gap-4 p-7 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition group bg-white"
              >
                {tag && (
                  <span className="absolute top-4 right-4 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ───────────────────────────────────── */}
      <section id="nosotros" className="bg-slate-50 px-6 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('about.label')}</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-2 mb-6 leading-tight">
              {t('about.title')}
            </h2>
            <p className="text-slate-600 mb-5 leading-relaxed">{t('about.p1')}</p>
            <p className="text-slate-600 mb-8 leading-relaxed">{t('about.p2')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { icon: '🏢', labelKey: 'about.badge1', subKey: 'about.badge1sub' },
                { icon: '🌎', labelKey: 'about.badge2', subKey: 'about.badge2sub' },
              ].map(({ icon, labelKey, subKey }) => (
                <div key={labelKey} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t(labelKey)}</p>
                    <p className="text-xs text-slate-500">{t(subKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-slate-900 rounded-3xl p-10 text-white space-y-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">{t('about.missionTitle')}</p>
                  <p className="text-slate-400 text-sm">{t('about.missionSub')}</p>
                </div>
              </div>
              <hr className="border-slate-700" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{t(`about.bullets.${i}`)}</p>
                </div>
              ))}
            </div>
            {/* Decorative blur */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          </div>

        </div>
      </section>

      {/* ── CONTACTO ────────────────────────────────────────── */}
      <section id="contacto" className="bg-white px-6 py-24 scroll-mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Info */}
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('contact.label')}</span>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-2 mb-6">
              {t('contact.title')}
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
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
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">{t(labelKey)}</p>
                    <p className="text-slate-900 font-semibold group-hover:text-blue-600 transition">{value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Mini map */}
            <div className="mt-10 rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-52">
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
            <div className="bg-slate-50 rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">{t('contact.formTitle')}</h3>

              {contactStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{t('contact.successTitle')}</h4>
                  <p className="text-sm text-slate-500 mb-6">{t('contact.successText')}</p>
                  <button
                    onClick={() => setContactStatus('idle')}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                  >
                    {t('contact.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  {contactStatus === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {contactError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.nameLabel')}</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t('contact.namePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.emailFieldLabel')}</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                      placeholder={t('contact.emailPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.messageLabel')}</label>
                    <textarea
                      required
                      rows={5}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                      placeholder={t('contact.messagePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={contactStatus === 'loading'}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
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
      <footer className="bg-slate-900 text-white px-6 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="lg:col-span-2">
              <p className="text-xl font-extrabold tracking-tight mb-3">CV Platform</p>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                {t('footer.tagline')}
              </p>
              {/* Social */}
              <div className="flex gap-3 mt-6">
                {SOCIAL_LINKS.map(({ name, href, icon, filled, strokeOnly }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={name}
                    className="w-9 h-9 bg-slate-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition"
                  >
                    <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke={strokeOnly ? 'currentColor' : (filled ? 'none' : 'currentColor')} strokeWidth={strokeOnly ? '2' : undefined} viewBox="0 0 24 24">
                      <path d={icon} strokeLinecap={strokeOnly ? 'round' : undefined} strokeLinejoin={strokeOnly ? 'round' : undefined} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('footer.servicesTitle')}</p>
              <ul className="space-y-2.5 text-sm text-slate-400">
                {footerServiceLinks.map((s) => (
                  <li key={s}>
                    <a href="/#servicios" className="hover:text-white transition">{s}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('footer.contactTitle')}</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:soporte@cvplatform.com" className="hover:text-white transition">
                    soporte@cvplatform.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a
                    href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition"
                  >
                    {process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '+507 000-0000'}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Ciudad de Panamá, Panamá</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} CV Platform. {t('footer.copyright')}</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-slate-300 transition">{t('footer.terms')}</a>
              <a href="#" className="hover:text-slate-300 transition">{t('footer.privacy')}</a>
              <Link href="/login" className="hover:text-slate-300 transition">{t('footer.staffAccess')}</Link>
            </div>
          </div>

        </div>
      </footer>

    </main>
  );
}
