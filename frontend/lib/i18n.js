'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const LANGUAGES = [
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
];

const DEFAULT_LOCALE = 'es';
const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState({});

  // Load messages when locale changes
  useEffect(() => {
    import(`../messages/${locale}.json`)
      .then((m) => setMessages(m.default))
      .catch((err) => console.error(`Could not load translations for ${locale}`, err));
  }, [locale]);

  // Restore saved language on first mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLocaleState(code);
    localStorage.setItem('lang', code);
  }, []);

  const t = useCallback((key) => {
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), messages) ?? key;
  }, [messages]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
