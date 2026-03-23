'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchWithAuth } from '../../../../lib/api';
import { useTranslation } from '../../../../lib/i18n';

const STATUS_STYLES = {
  PICKED_UP:        'bg-green-50 text-green-700 border-green-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const STATUS_FALLBACK = 'bg-gray-50 text-gray-600 border-gray-200';

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export default function ClientProfilePage() {
  const { t } = useTranslation();
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
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <p className="font-medium">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-gray-500 hover:underline">
          {t('clientsDetail.goBack')}
        </button>
      </div>
    );
  }

  const { name, email, phone, address, total_packages, total_spent, packages } = profile;

  return (
    <div className="space-y-8 animate-fade-in-up">

      <div>
        <Link href="/dashboard/clients" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {t('clientsDetail.allClients')}
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
            {name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-500 text-sm">{email} {phone ? `· ${phone}` : ''} {address ? `· ${address}` : ''}</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('clientsDetail.packageHistory')}</h2>
        </div>
        {!packages || packages.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-400">{t('clientsDetail.noPackages')}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('clientsDetail.tracking')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('clientsDetail.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('clientsDetail.weight')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('clientsDetail.cost')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('clientsDetail.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/dashboard/packages/${pkg.id}`} className="font-medium text-primary-600 hover:text-primary-800 hover:underline transition">
                      {pkg.tracking_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK}`}>
                      {t(`packages.status.${pkg.status}`) !== `packages.status.${pkg.status}` ? t(`packages.status.${pkg.status}`) : pkg.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{pkg.weight ? `${pkg.weight} kg` : '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                    {pkg.cost ? `$${Number(pkg.cost).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
