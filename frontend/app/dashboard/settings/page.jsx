'use client'
import { useState, useEffect } from 'react';
import { useTranslation } from '../../../lib/i18n';
import { fetchWithAuth } from '../../../lib/api';
import { clearCurrencyCache } from '../../../lib/currency';

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD — Dólar estadounidense' },
  { code: 'EUR', symbol: '€',  label: 'EUR — Euro' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF — Franco suizo' },
  { code: 'GBP', symbol: '£',  label: 'GBP — Libra esterlina' },
  { code: 'MXN', symbol: '$',  label: 'MXN — Peso mexicano' },
  { code: 'COP', symbol: '$',  label: 'COP — Peso colombiano' },
  { code: 'PEN', symbol: 'S/', label: 'PEN — Sol peruano' },
  { code: 'CRC', symbol: '₡',  label: 'CRC — Colón costarricense' },
  { code: 'GTQ', symbol: 'Q',  label: 'GTQ — Quetzal guatemalteco' },
  { code: 'HNL', symbol: 'L',  label: 'HNL — Lempira hondureño' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [costPerKg, setCostPerKg]       = useState('5.00');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.currency_code) setCurrencyCode(data.currency_code);
        if (data.cost_per_kg)   setCostPerKg(String(parseFloat(data.cost_per_kg).toFixed(2)));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    const selected = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          currency_code:   selected.code,
          currency_symbol: selected.symbol,
          cost_per_kg:     parseFloat(costPerKg) || 5.00,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(text).error || msg; } catch { msg = text.slice(0, 150) || msg; }
        setError(msg);
        return;
      }
      clearCurrencyCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('common.settings')}</h1>

      {/* Currency & pricing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('settings.currencyTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.currencySubtitle')}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('settings.currencyLabel')}</label>
            <select
              value={currencyCode}
              onChange={e => setCurrencyCode(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Símbolo: <span className="font-bold">{CURRENCIES.find(c => c.code === currencyCode)?.symbol}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('settings.costPerKgLabel')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                {CURRENCIES.find(c => c.code === currencyCode)?.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPerKg}
                onChange={e => setCostPerKg(e.target.value)}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">{t('settings.costPerKgHint')}</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved  && <p className="text-sm text-green-600">{t('settings.savedOk')}</p>}

        <div className="pt-6 border-t border-gray-100 flex justify-end space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 border border-transparent text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition shadow-sm font-medium text-sm disabled:opacity-60"
          >
            {saving ? 'Guardando…' : t('common.save')}
          </button>
        </div>
      </div>

      {/* Profile section (placeholder) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('settings.profileTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('settings.profileSubtitle')}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('settings.companyNameLabel')}</label>
            <input type="text" className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-shadow" defaultValue="CV Logistics Main" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('settings.adminEmailLabel')}</label>
            <input type="email" className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-shadow" defaultValue="admin@cvplatform.com" />
          </div>
        </div>
      </div>
    </div>
  );
}
