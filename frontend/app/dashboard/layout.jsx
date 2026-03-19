'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from "next/link";
import { fetchWithAuth, logout } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await fetchWithAuth(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
        setOpen(true);
      } catch (_) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToClient = (id) => {
    setQuery('');
    setOpen(false);
    router.push(`/dashboard/clients/${id}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-72">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('nav.searchClients')}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition"
        />
        {loading && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {results.map((client) => (
            <li key={client.id}>
              <button
                onClick={() => goToClient(client.id)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {client.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                  <p className="text-xs text-gray-400">
                    {client.active_packages} {t('dashboard.topbar.activePackages')}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query && results.length === 0 && !loading && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-sm text-gray-400">
          {t('nav.noClientsFound')} &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

const NAV_LINK_DEFS = [
  { href: '/dashboard',          key: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', adminOnly: false },
  { href: '/dashboard/clients',  key: 'clients',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', adminOnly: false },
  { href: '/dashboard/packages', key: 'packages',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', adminOnly: false },
  { href: '/dashboard/users',    key: 'users',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true },
];

const ROLE_BADGE = {
  SUPERADMIN: 'bg-amber-100 text-amber-700',
  ADMIN:      'bg-purple-100 text-purple-700',
  STAFF:      'bg-teal-100 text-teal-700',
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (stored) {
      const parsed = JSON.parse(stored);
      // Only CLIENT role uses the client portal
      if (parsed.role === 'CLIENT') {
        setRedirecting(true);
        router.replace('/client/dashboard');
        return;
      }
      // SUPERADMIN, ADMIN, STAFF — all allowed in the dashboard
      setUser(parsed);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">{t('dashboard.topbar.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-gray-50 min-h-[calc(100vh-64px)]">

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 p-6 flex-shrink-0 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-white tracking-tight">CV Platform</h2>
        <nav className="space-y-0.5 flex-1">
          {NAV_LINK_DEFS
            .filter(({ adminOnly }) => {
              if (!adminOnly) return true;
              return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
            })
            .map(({ href, key, icon }) => {
              const isActive = href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                  </svg>
                  {t(`dashboard.sidebar.${key}`)}
                </Link>
              );
            })}
        </nav>
        {/* Ver sitio web */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t('dashboard.sidebar.viewSite')}
          </Link>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOP BAR — sticky below the global Navbar (top-16 = 64px) */}
        <header className="bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between sticky top-16 z-40">
          <GlobalSearch />
          <div className="flex items-center gap-3">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${ROLE_BADGE[user.role] || 'bg-purple-100 text-purple-700'}`}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-600 hidden md:block">{user.email}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role] || 'bg-purple-100 text-purple-700'}`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-red-600 font-medium transition"
                >
                  {t('dashboard.topbar.logout')}
                </button>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
