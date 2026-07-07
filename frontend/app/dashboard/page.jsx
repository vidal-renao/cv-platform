'use client'

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "../../lib/i18n";
import { fetchWithAuth } from "../../lib/api";
import Card from "../../components/ui/Card";

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
        <div className="h-7 w-44 bg-stone-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0,1,2].map(i => <div key={i} className="h-32 bg-stone-200 rounded-2xl" />)}
        </div>
        <div className="h-80 bg-stone-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">

      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-navy-900">{t('dashboard.title')}</h1>
        <p className="text-stone-400 text-sm mt-1 font-body">
          {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative bg-white p-6 rounded-2xl border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-bl-[100px] group-hover:bg-teal-400/10 transition-colors" />
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider font-body">{t('dashboard.kpi.totalClients')}</h3>
          <p className="text-4xl font-black mt-2 text-navy-900 font-display">{metrics.totalClients}</p>
          <div className="mt-3 h-1 w-12 bg-teal-400 rounded-full" />
        </div>
        <div className="relative bg-white p-6 rounded-2xl border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-bl-[100px] group-hover:bg-teal-400/10 transition-colors" />
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider font-body">{t('dashboard.kpi.packages')}</h3>
          <p className="text-4xl font-black mt-2 text-navy-900 font-display">{metrics.totalPackages}</p>
          <div className="mt-3 h-1 w-12 bg-teal-400 rounded-full" />
        </div>
        <div className="relative bg-white p-6 rounded-2xl border border-stone-200 overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/5 rounded-bl-[100px] group-hover:bg-teal-400/10 transition-colors" />
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider font-body">{t('dashboard.kpi.pendingNotifications')}</h3>
          <p className="text-4xl font-black mt-2 text-navy-900 font-display">{metrics.pendingNotifications}</p>
          <div className="mt-3 h-1 w-12 bg-teal-400 rounded-full" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="text-base font-display font-bold text-navy-900 mb-4">{t('dashboard.chart.monthlyVolume')}</h2>
        <MonthlyChart data={monthly} />
      </div>

    </div>
  );
}
