import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-10 relative overflow-hidden py-16">
      {/* Decorative gradient blur */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* 404 numeral */}
      <div className="relative">
        <p
          className="font-serif font-black text-[12rem] leading-none select-none"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, transparent 70%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full border border-primary/20 bg-primary/5" />
        </div>
      </div>

      {/* Message */}
      <div className="space-y-3 relative z-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Explore our latest collections instead.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
        <Link
          href="/"
          className="px-8 py-3.5 btn-luxury rounded-sm tracking-widest uppercase text-sm font-semibold"
        >
          Back to Home
        </Link>
        <Link
          href="/catalog"
          className="px-8 py-3.5 border border-border rounded-sm tracking-widest uppercase text-sm font-semibold hover:bg-accent transition"
        >
          Browse Catalog
        </Link>
      </div>

      {/* Subtle collection links */}
      <div className="relative z-10 border-t border-border pt-8 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
        <Link href="/catalog?category=abaya-casual" className="hover:text-primary transition">Casual Abayas</Link>
        <Link href="/catalog?category=abaya-luxury" className="hover:text-primary transition">Luxury Abayas</Link>
        <Link href="/catalog?category=abaya-eid-collection" className="hover:text-primary transition">Eid Collection</Link>
        <Link href="/catalog?category=shayla" className="hover:text-primary transition">Shaylas</Link>
      </div>
    </div>
  );
}
