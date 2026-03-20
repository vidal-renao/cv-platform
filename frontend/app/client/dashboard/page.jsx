'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '../../../lib/api';
import { useTranslation } from '../../../lib/i18n';

const STATUS_STYLES = {
  PICKED_UP:        'bg-green-50 text-green-700 border-green-200',
  READY_FOR_PICKUP: 'bg-blue-50 text-blue-700 border-blue-200',
  ARRIVED:          'bg-yellow-50 text-yellow-700 border-yellow-200',
};
const STATUS_FALLBACK = 'bg-gray-50 text-gray-600 border-gray-200';

export default function ClientDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState(null);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    fetchWithAuth('/client/me').then(setClientInfo).catch(() => {});
    fetchWithAuth('/client/packages')
      .then(setPackages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active = packages.filter(p => p.status !== 'PICKED_UP').length;
  const totalSpent = packages.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);

  /* ─── PDF Export ─────────────────────────────────────────── */
  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const blue = [37, 99, 235];
      const dark = [15, 23, 42];
      const gray = [100, 116, 139];

      // Header band
      doc.setFillColor(...blue);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CV Platform', 14, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(t('export.reportTitle'), 14, 20);

      // Meta info
      doc.setTextColor(...dark);
      doc.setFontSize(9);
      doc.text(`${t('export.client')}: ${clientInfo?.name || clientInfo?.email || '—'}`, 14, 36);
      doc.text(`${t('export.date')}: ${new Date().toLocaleDateString()}`, 14, 42);
      doc.text(`${t('export.totalPackages')}: ${packages.length}`, 14, 48);
      doc.text(`${t('export.totalSpent')}: $${totalSpent.toFixed(2)}`, 80, 48);

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.line(14, 53, 196, 53);

      // Table header
      let y = 60;
      const cols = [14, 60, 110, 145, 175];
      const headers = [t('clientsDetail.tracking'), t('clientsDetail.status'), t('clientsDetail.weight'), t('clientsDetail.cost'), t('clientsDetail.date')];

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      headers.forEach((h, i) => doc.text(h.toUpperCase(), cols[i], y));
      y += 8;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      packages.forEach((pkg, idx) => {
        if (y > 270) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(14, y - 4, 182, 7, 'F');
        }
        doc.setTextColor(...dark);
        doc.text(pkg.tracking_number ?? '—', cols[0], y);
        doc.text(pkg.status?.replace(/_/g, ' ') ?? '—', cols[1], y);
        doc.text(pkg.weight ? `${pkg.weight} kg` : '—', cols[2], y);
        doc.text(pkg.cost ? `$${Number(pkg.cost).toFixed(2)}` : '—', cols[3], y);
        doc.text(new Date(pkg.created_at).toLocaleDateString(), cols[4], y);
        y += 8;
      });

      // Footer
      doc.setTextColor(...gray);
      doc.setFontSize(8);
      doc.text(`CV Platform · ${t('export.generatedOn')} ${new Date().toLocaleString()}`, 14, 287);

      doc.save(`cv-platform-packages-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting('');
    }
  };

  /* ─── Excel Export ───────────────────────────────────────── */
  const exportExcel = async () => {
    setExporting('excel');
    try {
      const XLSX = await import('xlsx');
      const rows = packages.map(pkg => ({
        [t('clientsDetail.tracking')]: pkg.tracking_number,
        [t('clientsDetail.status')]:   pkg.status?.replace(/_/g, ' '),
        [t('clientsDetail.weight')]:   pkg.weight ?? '',
        [t('clientsDetail.cost')]:     pkg.cost ? Number(pkg.cost).toFixed(2) : '',
        [t('clientsDetail.date')]:     new Date(pkg.created_at).toLocaleDateString(),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      // Column widths
      ws['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('export.sheetName'));
      XLSX.writeFile(wb, `cv-platform-packages-${Date.now()}.xlsx`);
    } catch (err) {
      console.error('Excel export error:', err);
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('clientPortal.welcome')}{clientInfo?.name ? `, ${clientInfo.name}` : ''}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('clientPortal.subtitle')}</p>
        </div>

        {/* Export buttons */}
        {packages.length > 0 && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={exportExcel}
              disabled={!!exporting}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
            >
              {exporting === 'excel' ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {exporting === 'excel' ? t('export.generating') : t('export.excel')}
            </button>
            <button
              onClick={exportPDF}
              disabled={!!exporting}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
            >
              {exporting === 'pdf' ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              {exporting === 'pdf' ? t('export.generating') : t('export.pdf')}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase">{t('clientPortal.stats.total')}</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{packages.length}</p>
          <p className="text-xs text-gray-400 mt-1">{t('clientPortal.stats.packages')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase">{t('clientPortal.stats.active')}</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">{active}</p>
          <p className="text-xs text-gray-400 mt-1">{t('clientPortal.stats.notPickedUp')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase">{t('clientPortal.stats.total')}</p>
          <p className="text-3xl font-black text-green-600 mt-1">${totalSpent.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-1">{t('clientPortal.stats.spent')}</p>
        </div>
      </div>

      {/* Package list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('clientPortal.myPackages')}</h2>
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
            {t('clientPortal.empty')}
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
                    {new Date(pkg.created_at).toLocaleDateString([], {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                    {pkg.weight ? ` · ${pkg.weight} kg` : ''}
                    {pkg.cost ? ` · $${Number(pkg.cost).toFixed(2)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs leading-5 font-semibold rounded-full border ${STATUS_STYLES[pkg.status] || STATUS_FALLBACK}`}>
                    {t(`packages.status.${pkg.status}`) !== `packages.status.${pkg.status}` ? t(`packages.status.${pkg.status}`) : pkg.status?.replace(/_/g, ' ')}
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
          {t('clientPortal.changePassword')}
        </button>
      </div>
    </div>
  );
}
