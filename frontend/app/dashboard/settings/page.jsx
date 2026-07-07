'use client'
import { useState, useEffect } from 'react';
import { useTranslation } from '../../../lib/i18n';
import { fetchWithAuth } from '../../../lib/api';
import { clearCurrencyCache } from '../../../lib/currency';
import Button from '../../../components/ui/Button';

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD \u2014 D\u00f3lar estadounidense' },
  { code: 'EUR', symbol: '\u20ac',  label: 'EUR \u2014 Euro' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF \u2014 Franco suizo' },
  { code: 'GBP', symbol: '\u00a3',  label: 'GBP \u2014 Libra esterlina' },
  { code: 'MXN', symbol: '$',  label: 'MXN \u2014 Peso mexicano' },
  { code: 'COP', symbol: '$',  label: 'COP \u2014 Peso colombiano' },
  { code: 'PEN', symbol: 'S/', label: 'PEN \u2014 Sol peruano' },
  { code: 'CRC', symbol: '\u20a1',  label: 'CRC \u2014 Col\u00f3n costarricense' },
  { code: 'GTQ', symbol: 'Q',  label: 'GTQ \u2014 Quetzal guatemalteco' },
  { code: 'HNL', symbol: 'L',  label: 'HNL \u2014 Lempira hondure\u00f1o' },
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
      await fetchWithAuth('/settings', {
        method: 'POST',
        body: JSON.stringify({
          currency_code:   selected.code,
          currency_symbol: selected.symbol,
          cost_per_kg:     parseFloat(costPerKg) || 5.00,
        }),
      });
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
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-navy-900">{t('common.settings')}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-8">
        <div>
          <h3 className="text-lg font-display font-bold text-navy-900">{t('settings.currencyTitle')}</h3>
          <p className="mt-1 text-sm text-stone-500 font-body">{t('settings.currencySubtitle')}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('settings.currencyLabel')}</label>
            <select
              value={currencyCode}
              onChange={e => setCurrencyCode(e.target.value)}
              className="block w-full border border-stone-200 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 text-sm bg-white"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-400 font-body">
              S\u00edmbolo: <span className="font-bold text-navy-700">{CURRENCIES.find(c => c.code === currencyCode)?.symbol}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('settings.costPerKgLabel')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">
                {CURRENCIES.find(c => c.code === currencyCode)?.symbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPerKg}
                onChange={e => setCostPerKg(e.target.value)}
                className="block w-full border border-stone-200 rounded-lg py-2.5 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-stone-400 font-body">{t('settings.costPerKgHint')}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            {t('settings.savedOk')}
          </div>
        )}

        <div className="pt-6 border-t border-stone-200 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando\u2026' : t('common.save')}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-8">
        <div>
          <h3 className="text-lg font-display font-bold text-navy-900">{t('settings.profileTitle')}</h3>
          <p className="mt-1 text-sm text-stone-500 font-body">{t('settings.profileSubtitle')}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('settings.companyNameLabel')}</label>
            <input type="text" className="block w-full border border-stone-200 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 text-sm transition" defaultValue="CV Logistics Main" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-700 mb-1 font-body">{t('settings.adminEmailLabel')}</label>
            <input type="email" className="block w-full border border-stone-200 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 text-sm transition" defaultValue="admin@cvplatform.com" />
          </div>
        </div>
      </div>
    </div>
  );
}
