'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAuth } from '../../../../lib/api';
import { useTranslation } from '../../../../lib/i18n';
import { useCurrency } from '../../../../lib/currency';

const STATUS_STYLES = {
  PICKED_UP:        'bg-green-50 text-green-700 border-green-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const STATUS_FALLBACK = 'bg-gray-50 text-gray-600 border-gray-200';

function StatCard({ label, value }) {
  return (
    <div className="relative bg-white rounded-2xl border border-stone-200 p-6 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-bl-[100px] group-hover:bg-teal-400/10 transition-colors" />
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{label}</p>
      <p className="text-3xl font-black text-navy-900 mt-1 font-display">{value}</p>
      <div className="mt-3 h-1 w-12 bg-teal-400 rounded-full" />
    </div>
  );
}

export default function ClientProfilePage() {
  const { t } = useTranslation();
  const { symbol: currencySymbol } = useCurrency();
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithAuth(`/clients/${id}/profile`)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0,1,2].map(i => <div key={i} className="h-28 bg-stone-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <p className="font-medium">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-stone-500 hover:underline">
          {t('clientsDetail.goBack')}
        </button>
      </div>
    );
  }

  const { name, email, phone, address, total_packages, total_spent, packages } = profile;

  return (
    <div className="space-y-8 animate-fade-in-up">

      <div>
        <Link href="/dashboard/clients" className="text-sm text-stone-400 hover:text-stone-600 flex items-center gap-1 mb-4 transition-colors w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {t('clientsDetail.allClients')}
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-2xl font-bold font-display">
            {name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-navy-900">{name}</h1>
            <p className="text-stone-500 text-sm font-body">{email} {phone ? `· ${phone}` : ''} {address ? `· ${address}` : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t('clientsDetail.totalPackages')} value={total_packages ?? 0} />
        <StatCard label={t('clientsDetail.totalSpent')} value={`$${(parseFloat(total_spent) || 0).toFixed(2)}`} />
        <StatCard
          label={t('clientsDetail.activePackages')}
          value={packages?.filter(p => p.status !== 'PICKED_UP').length ?? 0}
        />
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-display font-bold text-navy-900">{t('clientsDetail.packageHistory')}</h2>
        </div>
        {!packages || packages.length === 0 ? (
          <p className="px-6 py-10 text-center text-stone-400 text-sm">{t('clientsDetail.noPackages')}</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clientsDetail.tracking')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clientsDetail.status')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clientsDetail.weight')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clientsDetail.cost')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider font-body">{t('clientsDetail.date')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link href={`/dashboard/packages/${pkg.id}`} className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition font-mono">
                      {pkg.tracking_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK}`}>
                      {t(`packages.status.${pkg.status}`) !== `packages.status.${pkg.status}` ? t(`packages.status.${pkg.status}`) : pkg.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 font-body">{pkg.weight ? `${pkg.weight} kg` : '\u2014'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-700 font-medium font-body">
                    {pkg.cost ? `${currencySymbol}${Number(pkg.cost).toFixed(2)}` : '\u2014'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-400 font-body">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
