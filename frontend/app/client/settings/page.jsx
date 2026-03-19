'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '../../../lib/api';

export default function ClientSettings() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword !== form.confirm) {
      return setError('Las contraseñas no coinciden.');
    }
    setSaving(true);
    try {
      await fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      setSuccess('Contraseña actualizada correctamente.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>

      <h1 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</div>}
        {success && <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-100 p-3 rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Contraseña actual', placeholder: '••••••••' },
            { key: 'newPassword', label: 'Nueva contraseña', placeholder: 'Mínimo 6 caracteres' },
            { key: 'confirm', label: 'Confirmar nueva contraseña', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="password"
                required
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
