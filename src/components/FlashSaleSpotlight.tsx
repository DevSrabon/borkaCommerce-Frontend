'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, Sparkles, ArrowRight, ShoppingBag } from 'lucide-react';
import { PriceDisplay } from './PriceDisplay';

interface FlashSaleSpotlightProps {
  initialOffers?: any[];
  initialProducts?: any[];
  enabled?: boolean;
}

export default function FlashSaleSpotlight({
  initialOffers = [],
  initialProducts = [],
  enabled = true,
}: FlashSaleSpotlightProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [mounted, setMounted] = useState(false);

  // Pick top priority active flash sale offer (shows exactly ONE)
  const activeOffer = initialOffers.find(
    (o) => o.status === 'ACTIVE' || o.type === 'FLASH_SALE'
  ) || initialOffers[0] || {
    name: 'Exclusive Flash Sale',
    discount_value: 25,
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const targetDateStr = activeOffer?.end_date || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  useEffect(() => {
    setMounted(true);
    const target = new Date(targetDateStr).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (!enabled) return null;

  // Showcase up to 4 discounted products
  const displayProducts = initialProducts.slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <div className="relative rounded-2xl overflow-hidden border border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-black p-6 sm:p-10 shadow-lg text-foreground">
        {/* Soft luxury ambient background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-300/20 dark:bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-300/20 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with Title and Real-time Countdown */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-rose-200/60 dark:border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Flame size={14} className="animate-bounce text-rose-600 dark:text-rose-400" />
              <span>Limited Time Flash Sale</span>
              <span className="bg-rose-600 text-white text-xs px-1.5 py-0.2 rounded-sm font-black shadow-xs">
                {activeOffer?.discount_value ? `${activeOffer.discount_value}% OFF` : 'DEAL'}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white">
              {activeOffer?.name || 'Exclusive Flash Sale'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-300 font-light max-w-xl">
              Hand-selected luxury modest couture at exclusive flash discounts. Grab yours before the countdown reaches zero.
            </p>
          </div>

          {/* Real-time Countdown Cards */}
          <div className="flex items-center gap-2 sm:gap-3 self-start md:self-auto">
            <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-20 bg-white/95 dark:bg-black/60 border border-rose-200/80 dark:border-white/10 rounded-xl backdrop-blur-md shadow-sm">
              <span className="text-xl sm:text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
                {mounted ? String(timeLeft.days).padStart(2, '0') : '00'}
              </span>
              <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-semibold">Days</span>
            </div>
            <span className="text-lg font-bold text-stone-400 dark:text-white/40">:</span>

            <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-20 bg-white/95 dark:bg-black/60 border border-rose-200/80 dark:border-white/10 rounded-xl backdrop-blur-md shadow-sm">
              <span className="text-xl sm:text-2xl font-mono font-black text-stone-900 dark:text-white">
                {mounted ? String(timeLeft.hours).padStart(2, '0') : '00'}
              </span>
              <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-semibold">Hours</span>
            </div>
            <span className="text-lg font-bold text-stone-400 dark:text-white/40">:</span>

            <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-20 bg-white/95 dark:bg-black/60 border border-rose-200/80 dark:border-white/10 rounded-xl backdrop-blur-md shadow-sm">
              <span className="text-xl sm:text-2xl font-mono font-black text-stone-900 dark:text-white">
                {mounted ? String(timeLeft.minutes).padStart(2, '0') : '00'}
              </span>
              <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-semibold">Mins</span>
            </div>
            <span className="text-lg font-bold text-stone-400 dark:text-white/40">:</span>

            <div className="flex flex-col items-center justify-center w-14 sm:w-16 h-16 sm:h-20 bg-rose-50 dark:bg-red-950/80 border border-rose-300 dark:border-red-500/40 rounded-xl backdrop-blur-md shadow-sm">
              <span className="text-xl sm:text-2xl font-mono font-black text-rose-600 dark:text-rose-400 animate-pulse">
                {mounted ? String(timeLeft.seconds).padStart(2, '0') : '00'}
              </span>
              <span className="text-xs uppercase tracking-wider text-rose-600 dark:text-red-300 font-semibold">Secs</span>
            </div>
          </div>
        </div>

        {/* Product Deals Grid */}
        <div className="relative z-10 pt-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {displayProducts.map((prod) => (
              <div
                key={prod.id}
                className="group relative flex flex-col bg-white dark:bg-zinc-900/90 border border-rose-100 dark:border-white/10 hover:border-rose-400 dark:hover:border-red-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-xs"
              >
                {/* Image */}
                <Link href={`/product/${prod.slug}`} className="relative h-44 sm:h-60 overflow-hidden bg-stone-100 dark:bg-black flex items-center justify-center">
                  <img
                    src={prod.thumbnail}
                    alt={prod.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white font-black text-xs px-2 py-0.5 rounded shadow-md uppercase tracking-wider">
                    Flash Deal
                  </div>
                </Link>

                {/* Details */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-2 bg-card">
                  <div>
                    <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition">
                      <Link href={`/product/${prod.slug}`}>{prod.name}</Link>
                    </h3>
                    <p className="text-xs sm:text-xs text-muted-foreground line-clamp-1 mt-0.5 font-light">
                      {prod.short_description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <PriceDisplay
                      aedPrice={prod.min_price}
                      aedCompare={prod.min_original_price > prod.min_price ? prod.min_original_price : Math.round(prod.min_price * 1.25)}
                    />
                    <Link
                      href={`/product/${prod.slug}`}
                      className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded text-xs uppercase tracking-wider text-center transition shadow-xs"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/offers"
              className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-primary hover:text-stone-900 dark:hover:text-white uppercase tracking-wider border-b border-rose-300 dark:border-primary/50 pb-0.5 transition"
            >
              Explore All Flash Sale &amp; Promotional Offers <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
