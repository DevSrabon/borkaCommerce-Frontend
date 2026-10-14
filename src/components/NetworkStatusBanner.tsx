'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Manual ping test to verify actual connectivity beyond browser flag
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      // Ping backend or public asset with cache bust
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${API_BASE_URL}/health?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(async () => {
        // Fallback ping to local favicon if backend is on separate port
        return fetch(`/favicon.ico?_t=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);

      if (res && (res.ok || res.status < 500)) {
        setIsOnline(true);
        if (wasOffline) {
          setShowRestored(true);
          setTimeout(() => setShowRestored(false), 3500);
        }
      } else {
        setIsOnline(false);
        setWasOffline(true);
      }
    } catch {
      setIsOnline(false);
      setWasOffline(true);
    } finally {
      setIsChecking(false);
    }
  }, [wasOffline]);

  useEffect(() => {
    // Set initial client status after hydration
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setWasOffline(true);
      }
    }

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Periodic lightweight check if currently offline
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setWasOffline(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  // If online and not showing the temporary "restored" toast, render nothing
  if (isOnline && !showRestored) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-2rem)] max-w-lg pointer-events-auto"
    >
      {!isOnline ? (
        /* OFFLINE STATE BANNER */
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-950 via-red-950/90 to-stone-950 border border-red-500/50 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            {/* Animated Warning Icon */}
            <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-inner">
              <WifiOff className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            </div>

            {/* Message info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold tracking-wide text-red-200">
                  No Internet Connection
                </h4>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-xs uppercase font-semibold bg-red-900/60 text-red-300 border border-red-700/60">
                  Offline
                </span>
              </div>
              <p className="text-xs sm:text-xs text-stone-300 truncate sm:whitespace-normal">
                ইন্টারনেট সংযোগ নেই • Please check your network connection
              </p>
            </div>
          </div>

          {/* Action Retry Button */}
          <button
            type="button"
            onClick={checkConnection}
            disabled={isChecking}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 active:bg-red-700 text-white transition shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Retry'}</span>
          </button>
        </div>
      ) : (
        /* BACK ONLINE RESTORED BANNER */
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-950 via-emerald-950/90 to-stone-950 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold tracking-wide text-emerald-200">
                  Connection Restored
                </h4>
                <span className="px-1.5 py-0.5 rounded text-xs uppercase font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                  Online
                </span>
              </div>
              <p className="text-xs sm:text-xs text-stone-300">
                ইন্টারনেট সংযোগ পুনরায় চালু হয়েছে • You are back online
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
