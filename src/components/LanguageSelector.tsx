'use client';

import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';

const LANGUAGES: { value: Language; label: string; native: string; flag: string }[] = [
  { value: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { value: 'ar', label: 'Arabic', native: 'العربية', flag: '🇦🇪' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const selected = LANGUAGES.find((l) => l.value === language) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded px-2 py-1 transition-all duration-200 cursor-pointer"
        aria-label="Select language"
      >
        <Globe size={13} className="opacity-70" />
        <span>{selected.flag}</span>
        <span>{selected.value.toUpperCase()}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-1 w-40 bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl z-50 overflow-hidden text-card-foreground">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.value}
                onClick={() => {
                  setLanguage(lang.value);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  language === lang.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold">{lang.native}</span>
                  <span className="text-xs text-muted opacity-70">{lang.label}</span>
                </div>
                {language === lang.value && (
                  <span className="ml-auto text-primary text-xs">✓</span>
                )}
              </button>
            ))}

            <div className="border-t border-border/60 px-3 py-1.5 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>Google Translate API</span>
              <span className="text-primary font-mono font-semibold">AR / EN</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
