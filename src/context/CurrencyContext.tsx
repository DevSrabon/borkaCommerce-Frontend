'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'AED' | 'USD' | 'GBP' | 'EUR' | 'SAR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  symbol: string;
  formatPrice: (aedPrice: number | string) => string;
  convertPrice: (aedPrice: number | string) => number;
}

// Static conversion rates from AED (base currency)
const RATES: Record<Currency, number> = {
  AED: 1,
  USD: 1 / 3.67,
  GBP: 1 / 4.70,
  EUR: 1 / 4.00,
  SAR: 1.02,
};

const SYMBOLS: Record<Currency, string> = {
  AED: 'AED ',
  USD: '$',
  GBP: '£',
  EUR: '€',
  SAR: 'SAR ',
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'AED',
  setCurrency: () => {},
  symbol: 'AED',
  formatPrice: (p) => `AED ${Number(p || 0).toFixed(2)}`,
  convertPrice: (p) => Number(p || 0),
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('AED');

  // Persist currency preference across page loads
  useEffect(() => {
    const stored = localStorage.getItem('preferred_currency') as Currency | null;
    if (stored && RATES[stored]) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('preferred_currency', c);
  };

  const convertPrice = (aedPrice: number | string): number => {
    return Number(aedPrice || 0) * (RATES[currency] || 1);
  };

  const formatPrice = (aedPrice: number | string): string => {
    const converted = convertPrice(aedPrice);
    const sym = SYMBOLS[currency] || 'AED';
    // AED shows prefix, USD/GBP show symbol prefix
    if (currency === 'AED') {
      return `AED ${converted.toFixed(2)}`;
    }
    return `${sym}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol: SYMBOLS[currency], formatPrice, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
