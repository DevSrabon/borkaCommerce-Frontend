import { API_BASE_URL } from '@/config/api';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PriceDisplay } from '../components/PriceDisplay';
import BannerSlider from '../components/BannerSlider';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string;
  size_type?: string;
  size_description?: string | null;
}

interface Variant {
  id: string;
  sku: string;
  price: number;
  compare_price: number | null;
  discounted_price: number;
  available_stock: number;
  offer: { name: string; discount_value: number } | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  thumbnail: string;
  min_price: number;
  min_original_price: number;
  average_rating?: number;
  review_count?: number;
}

async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/banners`, {
      next: { revalidate: 60 },
    });
    if (res.ok) return await res.json();
  } catch (_) {}
  return [];
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/products?is_featured=true`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return [];
}

export default async function HomePage() {
  const [products, banners] = await Promise.all([
    getFeaturedProducts(),
    getBanners(),
  ]);

  const heroBanners = banners.filter((b) => (b.size_type || 'HERO') === 'HERO');
  const smallBanners = banners.filter((b) => b.size_type === 'SMALL');

  const categories = [
    { name: 'Abayas', slug: 'abaya', desc: 'Premium UAE Designs', img: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&q=80&w=400' },
    { name: 'Shaylas', slug: 'shayla', desc: 'Flowing Silk & Chiffon', img: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Niqabs', slug: 'niqab', desc: 'Comfort & Elegance', img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Dynamic Hero Banner Slider (1920x800) */}
      <BannerSlider serverBanners={heroBanners} />

      {/* Promos Section */}
      <section className="bg-card py-6 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-sm font-medium">
          <Link href="/offers" className="hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer">
            🔥 Flash Sale Active: <span className="text-primary font-bold">20% OFF</span> selected abayas with code <span className="font-bold border border-primary/50 px-2 py-0.5 rounded text-xs bg-primary/10">WELCOME10</span> →
          </Link>
          <div className="text-muted-foreground">✈ Free Express Shipping across the UAE on orders above 500 AED</div>
        </div>
      </section>

      {/* Small Size Banners Spotlight Grid */}
      {smallBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 pb-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-primary text-[10px] uppercase font-bold tracking-widest block">Limited Seasonal Offers</span>
              <h2 className="font-serif text-2xl font-bold tracking-tight">Promotional Spotlights</h2>
            </div>
            <Link href="/catalog" className="text-xs font-semibold text-primary hover:underline">
              View All Offers →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {smallBanners.map((banner) => (
              <div
                key={banner.id}
                className="group relative rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-lg transition duration-300 flex flex-col justify-between h-72"
              >
                {/* Background Image */}
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-60 group-hover:brightness-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

                {/* Top Badge */}
                <div className="relative z-10 p-5 flex items-start justify-between">
                  {banner.size_description ? (
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider bg-black/60 backdrop-blur-sm text-primary px-2.5 py-1 rounded border border-primary/30">
                      {banner.size_description}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-1 rounded">
                      Promo
                    </span>
                  )}
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 p-5 space-y-2 text-white">
                  <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-primary transition-colors">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-zinc-300 font-light line-clamp-2">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.cta_text && banner.cta_link && (
                    <div className="pt-2">
                      <Link
                        href={banner.cta_link}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-white transition uppercase tracking-wider"
                      >
                        {banner.cta_text} →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Shop by Category</h2>
          <div className="h-0.5 w-16 bg-primary mx-auto"></div>
          <p className="text-xs sm:text-sm text-muted">Browse our premium custom items</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/catalog?category=${cat.slug}`} className="group relative h-60 sm:h-80 md:h-96 overflow-hidden rounded-md border border-border shadow-sm flex items-end">
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75 group-hover:brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>
              <div className="relative z-10 p-4 sm:p-6 text-white w-full flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg sm:text-2xl font-bold">{cat.name}</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-300 font-light">{cat.desc}</p>
                </div>
                <span className="text-xs sm:text-sm border-b border-primary text-primary font-medium tracking-wider group-hover:pl-2 transition-all">Shop Now &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid - 2 columns on mobile for modern eCommerce experience */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Featured Masterpieces</h2>
          <div className="h-0.5 w-16 bg-primary mx-auto"></div>
          <p className="text-xs sm:text-sm text-muted">Curated selections of our finest work</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {products.map((prod) => (
            <div key={prod.id} className="group flex flex-col border border-border bg-card rounded-md overflow-hidden relative shadow-xs hover:shadow-md transition">
              {/* Product Image */}
              <Link href={`/product/${prod.slug}`} className="relative h-44 sm:h-64 md:h-[22rem] overflow-hidden bg-zinc-100 flex items-center justify-center">
                <img
                  src={prod.thumbnail}
                  alt={prod.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                />
                {prod.min_price < prod.min_original_price && (
                  <span className="absolute left-2 top-2 sm:left-3 sm:top-3 bg-red-600 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded shadow-md tracking-wider">
                    {Math.round(((prod.min_original_price - prod.min_price) / prod.min_original_price) * 100)}% OFF
                  </span>
                )}
              </Link>

              {/* Product Info */}
              <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-2">
                <div className="space-y-1">
                  <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition">
                    <Link href={`/product/${prod.slug}`}>{prod.name}</Link>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted line-clamp-2 leading-relaxed font-light hidden sm:block">{prod.short_description}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 pt-1 border-t border-border/40">
                  <PriceDisplay
                    aedPrice={prod.min_price}
                    aedCompare={prod.min_price < prod.min_original_price ? prod.min_original_price : null}
                  />
                  <Link href={`/product/${prod.slug}`} className="text-[11px] sm:text-xs text-primary font-medium hover:text-foreground transition underline sm:no-underline sm:border-b sm:border-primary">
                    Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
