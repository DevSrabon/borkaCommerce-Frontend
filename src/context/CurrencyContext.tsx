'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { API_BASE_URL } from '@/config/api';

export type Currency = 'AED' | 'USD' | 'GBP' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  symbol: string;
  formatPrice: (aedPrice: number | string) => string;
  convertPrice: (aedPrice: number | string) => number;
  rates: Record<Currency, number>;
}

// Fallback conversion rates from AED (Base AED = 1)
const DEFAULT_RATES: Record<Currency, number> = {
  AED: 1,
  USD: 0.2723,
  GBP: 0.2132,
  EUR: 0.2520,
};

const SYMBOLS: Record<Currency, string> = {
  AED: 'AED ',
  USD: '$',
  GBP: '£',
  EUR: '€',
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'AED',
  setCurrency: () => {},
  symbol: 'AED',
  formatPrice: (p) => `AED ${Number(p || 0).toFixed(2)}`,
  convertPrice: (p) => Number(p || 0),
  rates: DEFAULT_RATES,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('AED');
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);

  // Load preferred currency and dynamic exchange rates from site settings
  useEffect(() => {
    // 1. Restore cached rates if available
    try {
      const cached = localStorage.getItem('cached_currency_rates');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setRates({
            AED: 1, // Fixed base AED
            USD: Number(parsed.USD) || DEFAULT_RATES.USD,
            GBP: Number(parsed.GBP) || DEFAULT_RATES.GBP,
            EUR: Number(parsed.EUR) || DEFAULT_RATES.EUR,
          });
        }
      }
    } catch {}

    // 2. Fetch fresh dynamic rates from backend site-settings
    fetch(`${API_BASE_URL}/ecommerce/site-settings`)
      .then((res) => res.json())
      .then((settings) => {
        if (settings) {
          const freshRates: Record<Currency, number> = {
            AED: 1, // Fixed base AED
            USD: Number(settings.currency_rate_usd) || DEFAULT_RATES.USD,
            GBP: Number(settings.currency_rate_gbp) || DEFAULT_RATES.GBP,
            EUR: Number(settings.currency_rate_eur) || DEFAULT_RATES.EUR,
          };
          setRates(freshRates);
          localStorage.setItem('cached_currency_rates', JSON.stringify(freshRates));
        }
      })
      .catch(() => {});

    // 3. Persist currency preference across page loads
    const stored = localStorage.getItem('preferred_currency') as Currency | null;
    if (stored && stored !== ('SAR' as any) && (stored === 'AED' || stored === 'USD' || stored === 'GBP' || stored === 'EUR')) {
      setCurrencyState(stored);
    } else {
      setCurrencyState('AED');
      localStorage.setItem('preferred_currency', 'AED');
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('preferred_currency', c);
  };

  const convertPrice = (aedPrice: number | string): number => {
    const rate = rates[currency] || 1;
    return Number(aedPrice || 0) * rate;
  };

  const formatPrice = (aedPrice: number | string): string => {
    const converted = convertPrice(aedPrice);
    const sym = SYMBOLS[currency] || 'AED';
    if (currency === 'AED') {
      return `AED ${converted.toFixed(2)}`;
    }
    return `${sym}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol: SYMBOLS[currency], formatPrice, convertPrice, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
