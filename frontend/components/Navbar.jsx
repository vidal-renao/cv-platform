'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '../lib/api';
import { useTranslation, LANGUAGES } from '../lib/i18n';

const ROLE_STYLES = {
  SUPERADMIN: 'bg-amber-400/15 text-amber-400 border-amber-400/20',
  ADMIN:      'bg-purple-400/15 text-purple-400 border-purple-400/20',
  STAFF:      'bg-teal-400/15 text-teal-400 border-teal-400/20',
  CLIENT:     'bg-white/10 text-white/60 border-white/10',
};

function LangDropdown() {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition"
        aria-label="Select language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline font-mono text-xs tracking-wider">{current.code.toUpperCase()}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 overflow-hidden z-50 glass-card !p-1">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                onClick={() => { setLocale(lang.code); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 rounded-lg transition font-body ${
                  locale === lang.code
                    ? 'font-semibold text-teal-400 bg-teal-400/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
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

  const hidden = pathname?.startsWith('/track');

  const NAV_LINKS = [
    { label: t('nav.home'),      href: '/#hero' },
    { label: t('nav.servicios'), href: '/#servicios' },
    { label: t('nav.nosotros'),  href: '/#nosotros' },
    { label: t('nav.contacto'),  href: '/#contacto' },
  ];

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!mounted || hidden) return null;

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.push('/');
  };

  const panelHref = user?.role === 'CLIENT' ? '/client/dashboard' : '/dashboard';
  const isLanding  = pathname === '/';
  const isInPanel  = pathname?.startsWith('/dashboard') || pathname?.startsWith('/client');

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-navy-900/80 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
        : isLanding
          ? 'bg-transparent'
          : 'bg-navy-900 border-b border-white/5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-display font-bold tracking-tight text-white"
        >
          CV <span className="text-teal-400">Platform</span>
        </Link>

        {/* Desktop nav links (landing only) */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 text-sm font-medium text-white/40 hover:text-white rounded-lg transition font-body hover:bg-white/5"
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">

          <LangDropdown />

          {user ? (
            <>
              {!isInPanel && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${ROLE_STYLES[user.role] || 'bg-white/10 text-white/60 border-white/10'}`}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_STYLES[user.role] || 'bg-white/10 text-white/60 border-white/10'}`}>
                    {user.role}
                  </span>
                </div>
              )}

              {!isInPanel && (
                <Link
                  href={panelHref}
                  className="text-sm bg-teal-500 hover:bg-teal-400 text-navy-900 px-4 py-2 rounded-xl font-display font-bold transition flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                  {t('nav.panel')}
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-sm font-medium text-white/30 hover:text-white transition font-body"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-white/40 hover:text-white transition hidden sm:block font-body"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/login"
                className="text-sm bg-teal-500 hover:bg-teal-400 text-navy-900 px-4 py-2 rounded-xl font-display font-bold transition"
              >
                {t('nav.access')}
              </Link>
            </>
          )}

          {/* Mobile hamburger (landing only) */}
          {isLanding && (
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="md:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
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
      {isLanding && (
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          } bg-navy-900/95 backdrop-blur-xl border-t border-white/5`}
          aria-hidden={!menuOpen}
        >
          <div className="px-6 py-4 space-y-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition font-body"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
