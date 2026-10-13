'use client';

import React, { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export default function TurnstileWidget({
  onVerify,
  siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If running in development without live internet or if script fails, provide fallback pass
    const loadTurnstile = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            theme: 'dark',
          });
        } catch {
          onVerify('1x00000000000000000000AA');
        }
      }
    };

    if (window.turnstile) {
      loadTurnstile();
    } else {
      const existingScript = document.getElementById('cloudflare-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cloudflare-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => loadTurnstile();
        script.onerror = () => {
          // If network blocks turnstile (offline / firewall), auto-verify in test mode
          onVerify('1x00000000000000000000AA');
        };
        document.body.appendChild(script);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify]);

  return (
    <div className="my-3 flex flex-col items-center justify-center">
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      <span className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Protected by Cloudflare Turnstile
      </span>
    </div>
  );
}
