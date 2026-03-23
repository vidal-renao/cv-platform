'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from "next/link";
import { fetchWithAuth, logout } from '../../lib/api';
import { useTranslation } from '../../lib/i18n';

/* ─── Global Search ─────────────────────────────────────────── */
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

/* ─── Chat Panel ─────────────────────────────────────────────── */
function ChatPanel({ onClose }) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setMe(JSON.parse(stored));
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await fetchWithAuth('/chat/contacts');
      setContacts(data);
    } catch (_) {}
  };

  const loadMessages = useCallback(async (userId) => {
    try {
      const data = await fetchWithAuth(`/chat/messages/${userId}`);
      setMessages(data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(selected.id), 8000);
    return () => clearInterval(pollRef.current);
  }, [selected, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !selected || sending) return;
    setSending(true);
    try {
      await fetchWithAuth('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: selected.id, content: draft.trim() }),
      });
      setDraft('');
      await loadMessages(selected.id);
    } catch (_) {} finally {
      setSending(false);
    }
  };

  const displayName = (email) => email?.split('@')[0] ?? email;
  const THRESHOLD = 5 * 60 * 1000;
  const online = (c) => c.is_online || (c.last_seen && Date.now() - new Date(c.last_seen).getTime() < THRESHOLD);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col" style={{ top: '64px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-900">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-bold text-white">{t('chat.title')}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!selected ? (
        /* Contact list */
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm p-8">{t('chat.noContacts')}</p>
          ) : contacts.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); loadContacts(); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50"
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                  {displayName(c.email).charAt(0).toUpperCase()}
                </div>
                {online(c) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName(c.email)}</p>
                <p className="text-xs text-gray-400">{c.role}</p>
              </div>
              {c.unread > 0 && (
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        /* Message thread */
        <>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                {displayName(selected.email).charAt(0).toUpperCase()}
              </div>
              {online(selected) && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{displayName(selected.email)}</p>
              <p className="text-xs text-gray-400">{online(selected) ? t('chat.online') : t('chat.offline')}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-xs mt-8">{t('chat.noMessages')}</p>
            )}
            {messages.map(msg => {
              const isMine = msg.sender_id === me?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                  }`}>
                    <p className="break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={t('chat.placeholder')}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2 rounded-xl transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}

/* ─── Constants ─────────────────────────────────────────────── */
const NAV_LINK_DEFS = [
  { href: '/dashboard',          key: 'dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', adminOnly: false },
  { href: '/dashboard/clients',  key: 'clients',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', adminOnly: false },
  { href: '/dashboard/packages', key: 'packages',  icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', adminOnly: false },
  { href: '/dashboard/users',    key: 'users',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true },
  { href: '/dashboard/settings', key: 'settings',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', adminOnly: true },
];

const ROLE_BADGE = {
  SUPERADMIN: 'bg-amber-100 text-amber-700',
  ADMIN:      'bg-purple-100 text-purple-700',
  STAFF:      'bg-teal-100 text-teal-700',
};

/* ─── Layout ─────────────────────────────────────────────────── */
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');

    if (!token) { router.replace('/login'); return; }

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.role === 'CLIENT') {
        setRedirecting(true);
        router.replace('/client/dashboard');
        return;
      }
      setUser(parsed);
    }
  }, [router]);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    const loadUnread = () =>
      fetchWithAuth('/chat/unread').then(d => setUnread(d.unread)).catch(() => {});
    loadUnread();
    const iv = setInterval(loadUnread, 30000);
    return () => clearInterval(iv);
  }, [user]);

  const handleLogout = () => { logout(); router.push('/login'); };

  const displayName = user?.email?.split('@')[0] ?? '';

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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 p-6 flex flex-col overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:top-auto md:bottom-auto md:z-auto md:translate-x-0 md:flex-shrink-0
      `}>
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

        {/* TOP BAR */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-16 z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
            {user && (
              <p className="hidden lg:block text-sm text-gray-500">
                {t('dashboard.topbar.welcome')}, <span className="font-semibold text-gray-800 capitalize">{displayName}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Chat button */}
            {user && user.role !== 'CLIENT' && (
              <button
                onClick={() => setChatOpen(o => !o)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                title={t('chat.title')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            )}

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* CHAT PANEL */}
      {chatOpen && user && (
        <ChatPanel onClose={() => { setChatOpen(false); }} />
      )}

    </div>
  );
}
