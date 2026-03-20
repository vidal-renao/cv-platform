'use client'
import { useTranslation } from '../../../lib/i18n';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('common.settings')}</h1>
      
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

        <div className="pt-6 border-t border-gray-100 flex justify-end space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm">
            {t('common.cancel')}
          </button>
          <button className="bg-primary-600 border border-transparent text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition shadow-sm font-medium text-sm">
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
