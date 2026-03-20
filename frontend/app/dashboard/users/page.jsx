'use client'

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n';

const ROLE_STYLES = {
  SUPERADMIN: 'bg-amber-50 text-amber-700 border-amber-200',
  ADMIN:      'bg-purple-50 text-purple-700 border-purple-200',
  STAFF:      'bg-teal-50 text-teal-700 border-teal-200',
  CLIENT:     'bg-blue-50 text-blue-700 border-blue-200',
};

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
      <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-32 ml-auto" /></td>
    </tr>
  );
}

const ROLE_OPTIONS = ['ADMIN', 'STAFF', 'CLIENT'];

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(null);
  const [toast, setToast] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Create user modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'STAFF' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    fetchWithAuth('/users')
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleRoleChange = async (userId, newRole) => {
    setChanging(userId);
    try {
      const updated = await fetchWithAuth(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      showToast(`${t('users.roleUpdated')} ${newRole}`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setChanging(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await fetchWithAuth('/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowCreate(false);
      setForm({ email: '', password: '', role: 'STAFF' });
      showToast(t('users.createSuccess'));
      loadUsers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Staff-restricted role options (cannot assign above STAFF)
  const availableRoles = currentUser?.role === 'SUPERADMIN'
    ? ['SUPERADMIN', 'ADMIN', 'STAFF', 'CLIENT']
    : ROLE_OPTIONS;

  const THRESHOLD = 5 * 60 * 1000;
  const isOnline = (lastSeen) => lastSeen && Date.now() - new Date(lastSeen).getTime() < THRESHOLD;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('users.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {t('users.createBtn')}
        </button>
      </div>

      {/* CREATE USER MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t('users.createTitle')}</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('users.form.emailLabel')}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder={t('users.form.emailPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('users.form.passwordLabel')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('users.form.passwordPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('users.form.roleLabel')}</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition"
                >
                  {creating ? t('users.creating') : t('users.createBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.table.email')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.table.currentRole')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.table.registered')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.table.status')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('users.table.changeRole')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">
                    {t('users.table.empty')}
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">
                          {u.email?.charAt(0).toUpperCase()}
                        </div>
                        {isOnline(u.last_seen) && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${ROLE_STYLES[u.role] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(u.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOnline(u.last_seen) ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        {t('users.online')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {u.last_seen
                          ? new Date(u.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : t('users.never')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <select
                      value={u.role}
                      disabled={changing === u.id || u.id === currentUser?.id}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {availableRoles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">{t('users.footer')}</p>
    </div>
  );
}
