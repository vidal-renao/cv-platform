'use client'

import { useTranslation } from '../../lib/i18n';

export default function Error({ error, reset }) {
  const { t } = useTranslation();
  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-gray-700 font-medium">{t('common.error')}</p>
      {reset && (
        <button
          onClick={reset}
          className="text-sm text-primary-600 hover:underline"
        >
          {t('common.back')}
        </button>
      )}
    </div>
  );
}
