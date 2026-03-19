'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '../lib/api';
import { useTranslation, LANGUAGES } from '../lib/i18n';

const ROLE_STYLES = {
  SUPERADMIN: 'bg-amber-100 text-amber-700',
  ADMIN:      'bg-purple-100 text-purple-700',
  STAFF:      'bg-teal-100 text-teal-700',
  CLIENT:     'bg-blue-100 text-blue-700',
};

function LangDropdown({ scrolled, isLanding }) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const textColor = scrolled || !isLanding
    ? 'text-gray-600 hover:text-gray-900'
    : 'text-slate-300 hover:text-white';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-sm font-medium transition ${textColor}`}
        aria-label="Select language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                onClick={() => { setLocale(lang.code); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 transition ${
                  locale === lang.code ? 'font-semibold text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { t }    = useTranslation();
  const [user,    setUser]    = useState(null);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Only hide on the tracking page — it has its own embedded header
  const hidden = pathname?.startsWith('/track');

  const NAV_LINKS = [
    { label: t('nav.home'),      href: '/#hero' },
    { label: t('nav.servicios'), href: '/#servicios' },
    { label: t('nav.nosotros'),  href: '/#nosotros' },
    { label: t('nav.contacto'),  href: '/#contacto' },
  ];

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (_) {}
    }
    const onStorage = () => {
      const s = localStorage.getItem('user');
      setUser(s ? JSON.parse(s) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!mounted || hidden) return null;

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push('/');
  };

  const panelHref = user?.role === 'CLIENT' ? '/client/dashboard' : '/dashboard';
  const isLanding  = pathname === '/';
  const isInPanel  = pathname?.startsWith('/dashboard') || pathname?.startsWith('/client');

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
        : isLanding
          ? 'bg-slate-900/80 backdrop-blur-md'
          : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo — always goes to / */}
        <Link
          href="/"
          className={`text-lg font-bold tracking-tight transition ${
            scrolled || !isLanding ? 'text-slate-900' : 'text-white'
          }`}
        >
          CV Platform
        </Link>

        {/* Desktop nav links (landing only) */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  scrolled
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Language selector */}
          <LangDropdown scrolled={scrolled} isLanding={isLanding} />

          {user ? (
            <>
              {/* User badge — only show outside panel to avoid duplication */}
              {!isInPanel && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-700'}`}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[user.role] || 'bg-gray-100 text-gray-600'}`}>
                    {user.role}
                  </span>
                </div>
              )}

              {/* "Ir a mi Panel" — only show when not already inside the panel */}
              {!isInPanel && (
                <Link
                  href={panelHref}
                  className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                  {t('nav.panel')}
                </Link>
              )}

              {/* Logout — always visible */}
              <button
                onClick={handleLogout}
                className={`text-sm font-medium transition ${
                  scrolled || !isLanding
                    ? 'text-gray-500 hover:text-red-600'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-medium transition hidden sm:block ${
                  scrolled || !isLanding
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/login"
                className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-sm"
              >
                {t('nav.access')}
              </Link>
            </>
          )}

          {/* Mobile hamburger (landing only) */}
          {isLanding && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              className={`md:hidden p-2 rounded-lg transition ${
                scrolled || !isLanding ? 'text-gray-600 hover:bg-gray-100' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isLanding && menuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-700 px-6 py-4 space-y-1">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
