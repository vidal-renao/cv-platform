'use client';

import { useState, useEffect } from 'react';

const CACHE_KEY = 'cv_currency';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

const DEFAULTS = { symbol: '$', code: 'USD', costPerKg: 5.00 };

export function useCurrency() {
  const [currency, setCurrency] = useState(DEFAULTS);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) { setCurrency(data); return; }
      }
    } catch {}

    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const parsed = {
          symbol:    data.currency_symbol || '$',
          code:      data.currency_code   || 'USD',
          costPerKg: parseFloat(data.cost_per_kg) || 5.00,
        };
        setCurrency(parsed);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: parsed, ts: Date.now() })); } catch {}
      })
      .catch(() => {});
  }, []);

  return currency;
}

export function clearCurrencyCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch {}
}
