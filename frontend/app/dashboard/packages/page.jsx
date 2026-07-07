'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n';
import { fetchWithAuth } from '../../../lib/api';
import { useCurrency } from '../../../lib/currency';
import Button from '../../../components/ui/Button';

const STATUS_STYLES = {
  PICKED_UP:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-amber-50 text-amber-700 border-amber-200',
};
const STATUS_FALLBACK = 'bg-stone-50 text-stone-600 border-stone-200';

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-stone-200 rounded w-32" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-stone-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-5 bg-stone-200 rounded-full w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-stone-200 rounded w-12" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-stone-200 rounded w-16 ml-auto" /></td>
    </tr>
  );
}

function PackageModal({ onClose, onSaved, editPackage }) {
  const { t } = useTranslation();
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-navy-900">{isEdit ? t('packages.modal.editTitle') : t('packages.modal.newTitle')}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-navy-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('packages.modal.trackingLabel')}</label>
            <input
              required
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition text-sm"
              placeholder={t('packages.modal.trackingPlaceholder')}
              value={form.tracking_number}
              onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('packages.modal.clientLabel')}</label>
            <select
              required
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition text-sm bg-white"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
            >
              <option value="">{t('packages.modal.clientPlaceholder')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('packages.modal.weightLabel')}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition text-sm pr-10"
                placeholder={t('packages.modal.weightPlaceholder')}
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">kg</span>
            </div>
            <p className="mt-1 text-xs text-stone-400 font-body">{t('packages.modal.weightHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('packages.modal.descLabel')}</label>
            <input
              className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition text-sm"
              placeholder={t('packages.modal.descPlaceholder')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? t('packages.modal.saving') : isEdit ? t('packages.modal.saveBtn') : t('packages.modal.createBtn')}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const { t } = useTranslation();
  const { symbol: currencySymbol } = useCurrency();
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
        <PackageModal onClose={closeModal} onSaved={loadPackages} editPackage={editPackage} />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-navy-900">{t('packages.title')}</h1>
        </div>
        <Button onClick={() => { setEditPackage(null); setShowModal(true); }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {t('packages.addBtn')}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('packages.table.trackingId')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('packages.table.client')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('packages.table.status')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('packages.table.weightCost')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('packages.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-stone-400">
                    <svg className="w-12 h-12 text-stone-300 mb-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm">{t('packages.empty')}</p>
                  </td>
                </tr>
              ) : packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/dashboard/packages/${pkg.id}`)}
                      className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition font-mono text-sm"
                    >
                      {pkg.tracking_number}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-body">{pkg.client_name || '\u2014'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK}`}>
                      {t(`packages.status.${pkg.status}`) !== `packages.status.${pkg.status}` ? t(`packages.status.${pkg.status}`) : pkg.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-body">
                    {pkg.weight ? `${pkg.weight} kg` : '\u2014'}
                    {pkg.cost ? <span className="ml-2 font-medium text-navy-900">{currencySymbol}{Number(pkg.cost).toFixed(2)}</span> : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => router.push(`/dashboard/packages/${pkg.id}`)}
                      className="text-stone-400 hover:text-navy-700 transition-colors"
                      title={t('common.view')}
                    >
                      <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {pkg.status !== 'PICKED_UP' && (
                      <button
                        onClick={() => handlePickup(pkg.id)}
                        disabled={pickingUp === pkg.id}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold transition-colors disabled:opacity-50 text-sm"
                      >
                        {pickingUp === pkg.id ? t('packages.pickupSaving') : t('packages.pickup')}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(pkg)}
                      className="text-teal-600 hover:text-teal-800 transition-colors text-sm"
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
