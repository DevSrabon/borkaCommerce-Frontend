'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string;
  mobile_image_url?: string | null;
}

interface Props {
  serverBanners: Banner[];
}

// Static fallback hero if no banners exist
const FALLBACK: Banner = {
  id: 'fallback',
  title: 'Elegance in Modesty',
  subtitle: 'Discover handcrafted abayas made with premium UAE fabrics. Timeless designs tailored for special celebrations.',
  cta_text: 'Explore Shop',
  cta_link: '/catalog',
  image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1920',
};

export default function BannerSlider({ serverBanners }: Props) {
  const banners = serverBanners.length > 0 ? serverBanners : [FALLBACK];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length, paused]);

  const slide = banners[current];

  return (
    <section
      className="relative w-full h-[62vh] sm:h-[75vh] md:h-[85vh] bg-neutral-900 overflow-hidden flex items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background images — crossfade with separate mobile image support */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          {b.mobile_image_url ? (
            <>
              {/* Mobile device image (Portrait / Square optimized) */}
              <img
                src={b.mobile_image_url}
                alt={b.title}
                className="w-full h-full object-cover object-center brightness-50 md:hidden"
              />
              {/* Desktop landscape banner */}
              <img
                src={b.image_url}
                alt={b.title}
                className="w-full h-full object-cover object-center brightness-50 hidden md:block"
              />
            </>
          ) : (
            <img
              src={b.image_url}
              alt={b.title}
              className="w-full h-full object-cover object-center brightness-50"
            />
          )}
        </div>
      ))}

      {/* Bottom gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl space-y-3 sm:space-y-5">
          <span className="text-primary font-medium tracking-widest text-[10px] sm:text-xs uppercase block animate-fade-in">
            {current === 0 && serverBanners.length === 0 ? 'Eid Collection 2026' : `Slide ${current + 1} of ${banners.length}`}
          </span>
          <h1
            key={slide.id + '-title'}
            className="font-serif text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight"
            style={{ animation: 'slideUp 0.6s ease-out' }}
          >
            {slide.title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-primary font-serif">{slide.title.split(' ').slice(-1)}</span>
          </h1>
          {slide.subtitle && (
            <p
              key={slide.id + '-sub'}
              className="text-zinc-300 text-xs sm:text-base md:text-lg leading-relaxed max-w-lg font-light line-clamp-3 sm:line-clamp-none"
              style={{ animation: 'slideUp 0.7s ease-out' }}
            >
              {slide.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5 sm:gap-4 pt-1 sm:pt-2">
            {slide.cta_text && slide.cta_link && (
              <Link href={slide.cta_link} className="px-5 py-2.5 sm:px-8 sm:py-3.5 btn-luxury rounded-sm tracking-wider uppercase text-xs sm:text-sm font-semibold">
                {slide.cta_text}
              </Link>
            )}
            <Link
              href="/catalog"
              className="px-5 py-2.5 sm:px-8 sm:py-3.5 border border-white text-white hover:bg-white hover:text-black rounded-sm tracking-wider uppercase text-xs sm:text-sm font-medium transition duration-300"
            >
              Browse All
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows — hide on small screens to avoid covering text */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center transition cursor-pointer backdrop-blur-sm"
            aria-label="Previous banner"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white items-center justify-center transition cursor-pointer backdrop-blur-sm"
            aria-label="Next banner"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                i === current ? 'h-2 w-8 bg-primary' : 'h-2 w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
