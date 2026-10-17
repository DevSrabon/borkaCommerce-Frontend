'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WifiOff, Wifi, RefreshCw, ServerCrash, MessageCircle, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

// Custom WhatsApp SVG Icon for pristine luxury aesthetic
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [serverDown, setServerDown] = useState<boolean>(false);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('+971 55 642 4758');

  // Track failure count to avoid flashing on a single transient abort
  const failureCountRef = useRef(0);

  // Load WhatsApp contact from site settings or cached localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_site_whatsapp');
      if (cached) {
        setWhatsappNumber(cached);
      }
    } catch (_) {}

    const fetchWhatsapp = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/site-settings/public`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          const phone =
            data.whatsapp_order_number ||
            data.whatsapp_number ||
            data.site_phone ||
            data.SITE_PHONE ||
            '+971 55 642 4758';
          setWhatsappNumber(phone);
          try {
            localStorage.setItem('cached_site_whatsapp', phone);
          } catch (_) {}
        }
      } catch (_) {
        // Fallback to default luxury number
      }
    };

    fetchWhatsapp();
  }, []);

  // Heartbeat verification test
  const verifyServerHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${API_BASE_URL}/health?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res && res.status < 500) {
        // Server is healthy
        failureCountRef.current = 0;
        if (serverDown) {
          setServerDown(false);
          setShowRestored(true);
          setTimeout(() => setShowRestored(false), 3500);
        }
        setIsOnline(true);
        return true;
      } else {
        failureCountRef.current += 1;
        if (failureCountRef.current >= 1) {
          setServerDown(true);
        }
        return false;
      }
    } catch {
      // Network failure / Connection Refused / Server is Down
      failureCountRef.current += 1;
      if (failureCountRef.current >= 1) {
        setServerDown(true);
      }
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [serverDown]);

  // Periodic heartbeat monitor
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check browser online flag
    const handleBrowserOffline = () => {
      setIsOnline(false);
    };

    const handleBrowserOnline = () => {
      setIsOnline(true);
      verifyServerHealth();
    };

    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('online', handleBrowserOnline);

    // Initial check after 2 seconds
    const initialTimer = setTimeout(() => {
      verifyServerHealth();
    }, 2500);

    // Standing heartbeat check every 7 seconds if down, or 25 seconds if normal
    const heartbeatInterval = setInterval(() => {
      verifyServerHealth();
    }, serverDown ? 5000 : 25000);

    return () => {
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('online', handleBrowserOnline);
      clearTimeout(initialTimer);
      clearInterval(heartbeatInterval);
    };
  }, [verifyServerHealth, serverDown]);

  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '') || '971556424758';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hello Saba Al Wadi Luxury Concierge, I was browsing the online boutique and the server seems temporarily unavailable. I would like assistance with an inquiry/order.',
  )}`;

  // 1. FULLSCREEN SERVER DOWN / MAINTENANCE OVERLAY (User requirement)
  if (serverDown) {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-live="assertive"
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-[#090807]/95 backdrop-blur-2xl text-stone-100 overflow-y-auto animate-in fade-in duration-300"
      >
        {/* Luxury Gold Ambient Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[500px] sm:h-[500px] bg-gradient-to-tr from-[#d4af37]/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-lg bg-[#141210] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.15)] text-center space-y-6 overflow-hidden">
          {/* Top Decorative Gold Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

          {/* Animated Server Down Icon Badge */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-inner relative">
            <ServerCrash className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-[#141210]" />
            </span>
          </div>

          {/* Titles & Message */}
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Temporary Server Maintenance
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
              Server is Currently Down
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-md mx-auto">
              Our backend server is currently unresponsive or undergoing essential maintenance. Please visit after a few moments.
            </p>
            <p className="text-xs text-[#d4af37]/90 font-medium">
              Please check back shortly or connect with our luxury concierge team below
            </p>
          </div>

          {/* WhatsApp Direct Concierge Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1c1916] border border-[#d4af37]/30 text-left space-y-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-100">
                  Contact Us on WhatsApp
                </h4>
                <p className="text-[11px] text-stone-400">
                  Reach our 24/7 dedicated concierge desk for immediate assistance
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              If you have an urgent inquiry or wish to complete an order, our WhatsApp concierge is active 24/7 at{' '}
              <strong className="text-emerald-400 font-mono">{whatsappNumber}</strong>.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/40 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 text-white" />
              <span>Message on WhatsApp ({whatsappNumber})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Retry Connection Button */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={verifyServerHealth}
              disabled={isChecking}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 hover:border-[#d4af37] text-stone-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[#d4af37]' : ''}`} />
              <span>{isChecking ? 'Checking Connection...' : 'Retry Server Connection'}</span>
            </button>
          </div>

          <p className="text-[10px] text-stone-500 uppercase tracking-widest">
            Auto-reconnecting every 5 seconds • Saba Al Wadi Couture
          </p>
        </div>
      </div>
    );
  }

  // 2. OFFLINE BROWSER BANNER
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-2rem)] max-w-lg pointer-events-auto"
      >
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-950 via-red-950/90 to-stone-950 border border-red-500/50 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-inner">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold tracking-wide text-red-200">
                  No Internet Connection
                </h4>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-xs uppercase font-semibold bg-red-900/60 text-red-300 border border-red-700/60">
                  Offline
                </span>
              </div>
              <p className="text-xs text-stone-300 truncate sm:whitespace-normal">
                No internet connection detected • Please check your network settings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={verifyServerHealth}
            disabled={isChecking}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow-lg cursor-pointer disabled:opacity-50 border border-red-400/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Retry'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. RESTORED ONLINE TOAST
  if (showRestored) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-2rem)] max-w-lg pointer-events-auto"
      >
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-950 via-emerald-950/90 to-stone-950 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold tracking-wide text-emerald-200">
                  Server Connected &amp; Online
                </h4>
                <span className="px-1.5 py-0.5 rounded text-xs uppercase font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                  Online
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Connection restored • All boutique systems are fully operational
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
