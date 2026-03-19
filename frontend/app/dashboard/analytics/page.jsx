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

  const data = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
    datasets: [
      {
        label: 'Packages Received',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(53, 162, 235, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Packages Picked Up',
        data: [28, 48, 40, 19, 86, 27, 90],
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('common.analytics')}</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="h-96">
          <Bar options={options} data={data} />
        </div>
      </div>
    </div>
  );
}
