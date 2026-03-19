'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '../../../lib/api';

const STATUS_STYLES = {
  PICKED_UP:        'bg-green-50 text-green-700 border-green-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const STATUS_FALLBACK = 'bg-gray-50 text-gray-600 border-gray-200';

export default function ClientDashboard() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState(null);

  useEffect(() => {
    fetchWithAuth('/client/me').then(setClientInfo).catch(() => {});
    fetchWithAuth('/client/packages')
      .then(setPackages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = packages.filter(p => p.status !== 'PICKED_UP').length;
  const totalSpent = packages.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido{clientInfo?.name ? `, ${clientInfo.name}` : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Aquí puedes seguir el estado de tus paquetes en tiempo real.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{packages.length}</p>
          <p className="text-xs text-gray-400 mt-1">paquetes</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase">Activos</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">{active}</p>
          <p className="text-xs text-gray-400 mt-1">sin retirar</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total</p>
          <p className="text-3xl font-black text-green-600 mt-1">${totalSpent.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">gastado</p>
        </div>
      </div>

      {/* Package list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Mis Paquetes</h2>
        </div>

        {loading ? (
          <div className="divide-y">
            {[0,1,2].map(i => (
              <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-5 bg-gray-200 rounded-full w-24" />
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-400 text-sm">
            No tienes paquetes registrados aún.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {packages.map(pkg => (
              <button
                key={pkg.id}
                onClick={() => router.push(`/client/packages/${pkg.id}`)}
                className="w-full text-left px-6 py-4 hover:bg-gray-50 transition flex items-center justify-between group"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{pkg.tracking_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(pkg.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                    {pkg.weight ? ` · ${pkg.weight} kg` : ''}
                    {pkg.cost ? ` · $${Number(pkg.cost).toFixed(2)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs leading-5 font-semibold rounded-full border ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK}`}>
                    {pkg.status?.replace(/_/g, ' ')}
                  </span>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Change password link */}
      <div className="text-center">
        <button
          onClick={() => router.push('/client/settings')}
          className="text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Cambiar contraseña
        </button>
      </div>
    </div>
  );
}
