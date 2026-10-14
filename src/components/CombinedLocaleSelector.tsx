'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';
import { useCurrency, Currency } from '../context/CurrencyContext';

const LANGUAGES: { value: Language; label: string; native: string; flag: string }[] = [
  { value: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { value: 'ar', label: 'Arabic', native: 'العربية', flag: '🇦🇪' },
];

const CURRENCIES: { value: Currency; label: string; flag: string; symbol: string }[] = [
  { value: 'AED', label: 'AED (د.إ)', flag: '🇦🇪', symbol: 'د.إ' },
  { value: 'USD', label: 'USD ($)', flag: '🇺🇸', symbol: '$' },
  { value: 'GBP', label: 'GBP (£)', flag: '🇬🇧', symbol: '£' },
  { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺', symbol: '€' },
];

interface CombinedLocaleSelectorProps {
  variant?: 'desktop' | 'mobile';
  onSelect?: () => void;
}

export default function CombinedLocaleSelector({ variant = 'desktop', onSelect }: CombinedLocaleSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLang = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
  const selectedCurr = CURRENCIES.find((c) => c.value === currency) || CURRENCIES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Mobile Drawer Full View (embedded controls)
  if (variant === 'mobile') {
    return (
      <div className="space-y-3 p-3 rounded-xl bg-card border border-border">
        {/* Currency Switcher */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Currency</span>
            <span className="text-primary font-mono font-bold">{selectedCurr.value}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {CURRENCIES.map((curr) => {
              const active = currency === curr.value;
              return (
                <button
                  key={curr.value}
                  type="button"
                  onClick={() => {
                    setCurrency(curr.value);
                    if (onSelect) onSelect();
                  }}
                  className={`py-1.5 px-1 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer border ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background hover:bg-accent text-foreground border-border'
                  }`}
                >
                  <span className="text-xs">{curr.flag}</span>
                  <span className="text-xs mt-0.5">{curr.value}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Switcher */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Language</span>
            <span className="text-primary font-bold">{selectedLang.native}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => {
              const active = language === lang.value;
              return (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.value);
                    if (onSelect) onSelect();
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer border ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background hover:bg-accent text-foreground border-border'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{lang.flag}</span>
                    <span>{lang.native}</span>
                  </span>
                  {active && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Dropdown Popover
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-lg px-2.5 py-1.5 transition-all duration-150 cursor-pointer"
        aria-label="Select currency and language"
        aria-expanded={open}
      >
        <span className="text-xs">{selectedCurr.flag}</span>
        <span className="font-bold text-foreground">{selectedCurr.value}</span>
        <span className="text-border mx-0.5">/</span>
        <span className="uppercase text-muted-foreground font-semibold">{selectedLang.value}</span>
        <ChevronDown size={11} className={`transition-transform duration-200 text-muted-foreground ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl z-50 p-3 space-y-3 text-card-foreground animate-in fade-in slide-in-from-top-1">
          {/* Currency Selection */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
              <span>Select Currency</span>
              <span className="text-primary font-mono">{selectedCurr.value}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {CURRENCIES.map((curr) => {
                const active = currency === curr.value;
                return (
                  <button
                    key={curr.value}
                    type="button"
                    onClick={() => setCurrency(curr.value)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      active
                        ? 'bg-primary/10 border-primary/50 text-primary font-bold'
                        : 'border-border/60 hover:bg-accent text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{curr.flag}</span>
                      <span>{curr.value}</span>
                    </span>
                    {active && <Check size={12} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selection */}
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Globe size={11} /> Language
              </span>
              <span className="text-primary">{selectedLang.native}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGUAGES.map((lang) => {
                const active = language === lang.value;
                return (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium transition cursor-pointer border ${
                      active
                        ? 'bg-primary/10 border-primary/50 text-primary font-bold'
                        : 'border-border/60 hover:bg-accent text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{lang.flag}</span>
                      <span>{lang.native}</span>
                    </span>
                    {active && <Check size={12} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
