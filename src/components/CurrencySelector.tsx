'use client';

import React, { useState } from 'react';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { ChevronDown } from 'lucide-react';

const CURRENCIES: { value: Currency; label: string; flag: string }[] = [
  { value: 'AED', label: 'AED د.إ', flag: '🇦🇪' },
  { value: 'USD', label: 'USD $', flag: '🇺🇸' },
  { value: 'GBP', label: 'GBP £', flag: '🇬🇧' },
];

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const selected = CURRENCIES.find((c) => c.value === currency)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded px-2 py-1 transition-all duration-200 cursor-pointer"
        aria-label="Select currency"
      >
        <span>{selected.flag}</span>
        <span>{selected.value}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden">
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setCurrency(c.value);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  currency === c.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span>{c.label}</span>
                {currency === c.value && (
                  <span className="ml-auto text-primary text-[10px]">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
