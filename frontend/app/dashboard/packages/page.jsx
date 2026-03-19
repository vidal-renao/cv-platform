'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n';
import { fetchWithAuth } from '../../../lib/api';

const STATUS_STYLES = {
  PICKED_UP:        'bg-green-50 text-green-700 border-green-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const STATUS_FALLBACK = 'bg-gray-50 text-gray-600 border-gray-200';

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
    </tr>
  );
}

function PackageModal({ onClose, onSaved, editPackage }) {
  const isEdit = Boolean(editPackage);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(
    isEdit
      ? {
          tracking_number: editPackage.tracking_number || '',
          client_id: editPackage.client_id || '',
          description: editPackage.description || '',
          weight: editPackage.weight ?? '',
        }
      : { tracking_number: '', client_id: '', description: '', weight: '' }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWithAuth('/clients').then(setClients).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        weight: form.weight !== '' ? Number(form.weight) : undefined,
      };
      if (isEdit) {
        await fetchWithAuth(`/packages/${editPackage.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth('/packages', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Package' : 'New Package'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number *</label>
            <input
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
              placeholder="e.g. TRK-2024-001"
              value={form.tracking_number}
              onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm bg-white"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm pr-10"
                placeholder="e.g. 2.5"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Cost is calculated automatically from pricing tiers.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
              placeholder="Optional notes about this package"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Package'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPackage, setEditPackage] = useState(null);
  const [pickingUp, setPickingUp] = useState(null);

  const loadPackages = () => {
    setLoading(true);
    fetchWithAuth('/packages')
      .then(setPackages)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPackages(); }, []);

  const handlePickup = async (id) => {
    setPickingUp(id);
    try {
      await fetchWithAuth(`/packages/${id}/pickup`, { method: 'POST' });
      setPackages((prev) =>
        prev.map((p) => p.id === id ? { ...p, status: 'PICKED_UP' } : p)
      );
    } catch (err) {
      console.error('Pickup failed:', err);
    } finally {
      setPickingUp(null);
    }
  };

  const openEdit = (pkg) => {
    setEditPackage(pkg);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditPackage(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {showModal && (
        <PackageModal
          onClose={closeModal}
          onSaved={loadPackages}
          editPackage={editPackage}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('common.packages')}</h1>
        <button
          onClick={() => { setEditPackage(null); setShowModal(true); }}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition shadow-sm font-medium text-sm flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Add Package
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight / Cost</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 text-gray-300 mb-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No packages yet. Click <strong>Add Package</strong> to get started.</p>
                  </td>
                </tr>
              ) : packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/dashboard/packages/${pkg.id}`)}
                      className="font-medium text-primary-600 hover:text-primary-800 hover:underline transition"
                    >
                      {pkg.tracking_number}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{pkg.client_name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK}`}>
                      {pkg.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pkg.weight ? `${pkg.weight} kg` : '—'}
                    {pkg.cost ? <span className="ml-2 font-medium text-gray-700">${Number(pkg.cost).toFixed(2)}</span> : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => router.push(`/dashboard/packages/${pkg.id}`)}
                      className="text-gray-500 hover:text-gray-800 transition-colors"
                      title="Ver detalle"
                    >
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="ml-1">Ver</span>
                    </button>
                    {pkg.status !== 'PICKED_UP' && (
                      <button
                        onClick={() => handlePickup(pkg.id)}
                        disabled={pickingUp === pkg.id}
                        className="text-green-600 hover:text-green-800 font-semibold transition-colors disabled:opacity-50"
                      >
                        {pickingUp === pkg.id ? 'Saving...' : 'Pickup'}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(pkg)}
                      className="text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
