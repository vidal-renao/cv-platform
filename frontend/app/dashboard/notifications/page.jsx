'use client'
import { useState, useEffect } from 'react';
import { useTranslation } from '../../../lib/i18n';
import { fetchWithAuth } from '../../../lib/api';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/notifications')
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('common.notifications')}</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {loading ? (
             <li className="p-8 text-center text-gray-400">Loading...</li>
          ) : notifications.length === 0 ? (
            <li className="p-12 text-center text-gray-500 flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              No notifications found
            </li>
          ) : notifications.map(notif => (
            <li key={notif.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {notif.type} sent to {notif.client_name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Package: <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-700">{notif.package_tracking_id}</span>
                </p>
              </div>
              <div className="flex-shrink-0 text-sm text-gray-400 mt-1">
                {new Date(notif.sent_at).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
