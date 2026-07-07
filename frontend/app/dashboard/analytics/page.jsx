'use client'
import { useTranslation } from '../../../lib/i18n';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { t } = useTranslation();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const months = t('analytics.months');
  const data = {
    labels: Array.isArray(months) ? months.slice(0, 7) : ['Jan','Feb','Mar','Apr','May','Jun','Jul'],
    datasets: [
      {
        label: t('analytics.packagesReceived'),
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(53, 162, 235, 0.7)',
        borderRadius: 4,
      },
      {
        label: t('analytics.packagesPickedUp'),
        data: [28, 48, 40, 19, 86, 27, 90],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-navy-900">{t('common.analytics')}</h1>
        <p className="text-sm text-stone-400 mt-1 font-body">{t('analytics.subtitle')}</p>
      </div>
      <div className="bg-white p-8 rounded-xl border border-stone-200">
        <div className="h-96">
          <Bar options={options} data={data} />
        </div>
      </div>
    </div>
  );
}
