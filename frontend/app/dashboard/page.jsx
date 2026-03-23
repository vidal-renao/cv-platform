'use client'

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "../../lib/i18n";
import { fetchWithAuth } from "../../lib/api";

const MonthlyChart = dynamic(() => import("../../components/MonthlyChart"), { ssr: false });

export default function DashboardPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    fetchWithAuth("/dashboard/metrics").then(setMetrics).catch(console.error);
    fetchWithAuth("/dashboard/monthly").then(setMonthly).catch(console.error);
  }, []);

  if (!metrics) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0,1,2].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('dashboard.kpi.totalClients')}</h3>
          <p className="text-4xl font-black mt-2">{metrics.totalClients}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('dashboard.kpi.packages')}</h3>
          <p className="text-4xl font-black mt-2">{metrics.totalPackages}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('dashboard.kpi.pendingNotifications')}</h3>
          <p className="text-4xl font-black mt-2">{metrics.pendingNotifications}</p>
        </div>
      </div>

      {/* Monthly Volume Chart */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{t('dashboard.chart.monthlyVolume')}</h2>
        <MonthlyChart data={monthly} />
      </div>

    </div>
  );
}
