import { API_BASE_URL } from '@/config/api';
import React from 'react';
import Link from 'next/link';
import { PriceDisplay } from '../../components/PriceDisplay';
import { Tag, Sparkles, Clock, Percent, ShieldCheck } from 'lucide-react';

interface OfferProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  thumbnail: string;
  min_price: number;
  min_original_price: number;
  discount_percentage?: number;
  active_offer_name?: string;
  categories: { id: string; name: string; slug: string }[];
}

interface CampaignOffer {
  id: string;
  name: string;
  type: string;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
}

async function getSaleProducts(): Promise<OfferProduct[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/products?on_sale=true`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}
  return [];
}

export default async function OffersPage() {
  const saleProducts = await getSaleProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-12">
      {/* Hero Banner Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-950 via-zinc-900 to-neutral-900 border border-border p-8 sm:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> Active Seasonal Promotions
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Exclusive <span className="text-primary font-serif">Flash Sale</span> & Festive Offers
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
            Save up to 20% on selected handcrafted abayas made with pure UAE Nidha and Silk fabrics. Use coupon code <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">WELCOME10</span> at checkout for additional savings.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" /> Verified Authenticity
            </span>
            <span className="flex items-center gap-1.5">
              ✈ Free Express Shipping above 500 AED
            </span>
          </div>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl space-y-3 shadow-sm hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Percent size={14} /> Flash Sale Campaign
            </span>
            <span className="text-xs font-mono bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-bold">
              20% OFF
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold">Eid Eve Flash Sale</h3>
          <p className="text-xs text-muted-foreground font-light">
            Limited-time 20% discount on select signature black Nidha and bisht abayas. Automatically applied on variants.
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl space-y-3 shadow-sm hover:border-primary/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Tag size={14} /> Seasonal Special
            </span>
            <span className="text-xs font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
              15% OFF
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold">Eid Collection 2026</h3>
          <p className="text-xs text-muted-foreground font-light">
            Enjoy 15% off our exclusive silk-embroidered festive abayas. Tailored for elegance and festive celebrations.
          </p>
        </div>
      </div>

      {/* Sale Products Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold">Discounted Abayas & Items</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {saleProducts.length} items with active promotional pricing.
            </p>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-primary hover:underline">
            Browse Full Catalog &rarr;
          </Link>
        </div>

        {saleProducts.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-16 text-center text-xs text-muted-foreground space-y-3">
            <p>No active sale products at this moment.</p>
            <Link href="/catalog" className="px-4 py-2 btn-luxury rounded text-xs font-semibold uppercase inline-block">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {saleProducts.map((prod) => {
              const discountPct =
                prod.discount_percentage ||
                (prod.min_original_price > prod.min_price
                  ? Math.round(
                      ((prod.min_original_price - prod.min_price) / prod.min_original_price) * 100
                    )
                  : 0);

              return (
                <div
                  key={prod.id}
                  className="group flex flex-col border border-border bg-card rounded-md overflow-hidden relative shadow-sm hover:shadow-lg transition duration-300"
                >
                  {/* Image */}
                  <Link href={`/product/${prod.slug}`} className="relative h-96 overflow-hidden bg-zinc-100 block">
                    <img
                      src={prod.thumbnail}
                      alt={prod.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                    />
                    {discountPct > 0 && (
                      <span className="absolute left-3 top-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded shadow-md tracking-wider">
                        {discountPct}% OFF
                      </span>
                    )}
                    {prod.active_offer_name && (
                      <span className="absolute right-3 top-3 bg-black/75 backdrop-blur-sm text-primary font-bold text-[10px] px-2 py-0.5 rounded border border-primary/30">
                        {prod.active_offer_name}
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition">
                        <Link href={`/product/${prod.slug}`}>{prod.name}</Link>
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-light">
                        {prod.short_description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <PriceDisplay
                        aedPrice={prod.min_price}
                        aedCompare={prod.min_original_price}
                      />
                      <Link
                        href={`/product/${prod.slug}`}
                        className="text-xs text-primary font-semibold hover:underline uppercase tracking-wider"
                      >
                        Claim Offer &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
