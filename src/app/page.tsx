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
}

async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch('http://localhost:8080/ecommerce/banners', {
      next: { revalidate: 60 },
    });
    if (res.ok) return await res.json();
  } catch (_) {}
  return [];
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch('http://localhost:8080/ecommerce/products?is_featured=true', {
      next: { revalidate: 60 }, // ISR cache for 60 seconds
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend server down, loading fallback mockup products.', err);
  }

  // High-end fallback mockup data matching seed file if backend is offline
  return [
    {
      id: 'mock-1',
      name: 'Classic Black Nidha Abaya',
      slug: 'classic-black-nidha-abaya',
      short_description: 'Classic black Nidha abaya for daily wear.',
      thumbnail: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600',
      min_price: 212.50, // flash sale 15% applied
      min_original_price: 250.00,
    },
    {
      id: 'mock-2',
      name: 'Luxury Silk Embroidered Abaya',
      slug: 'luxury-silk-embroidered-abaya',
      short_description: 'Luxury embroidered silk abaya for special occasions.',
      thumbnail: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&q=80&w=600',
      min_price: 382.50, // eid sale 15% applied
      min_original_price: 450.00,
    },
  ];
}

export default async function HomePage() {
  const [products, banners] = await Promise.all([
    getFeaturedProducts(),
    getBanners(),
  ]);

  const categories = [
    { name: 'Abayas', slug: 'abaya', desc: 'Premium UAE Designs', img: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&q=80&w=400' },
    { name: 'Shaylas', slug: 'shayla', desc: 'Flowing Silk & Chiffon', img: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Niqabs', slug: 'niqab', desc: 'Comfort & Elegance', img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Dynamic Banner Slider */}
      <BannerSlider serverBanners={banners} />

      {/* Promos Section */}
      <section className="bg-card py-6 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-sm font-medium">
          <div>🔥 Flash Sale Active: <span className="text-primary font-bold">20% OFF</span> selected abayas with code <span className="font-bold border border-primary/50 px-2 py-0.5 rounded text-xs bg-primary/10">WELCOME10</span></div>
          <div className="text-muted-foreground">✈ Free Express Shipping across the UAE on orders above 500 AED</div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl font-bold tracking-tight">Shop by Category</h2>
          <div className="h-0.5 w-16 bg-primary mx-auto"></div>
          <p className="text-sm text-muted">Browse our premium custom items</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/catalog?category=${cat.slug}`} className="group relative h-96 overflow-hidden rounded-md border border-border shadow-sm flex items-end">
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75 group-hover:brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="relative z-10 p-6 text-white w-full flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold">{cat.name}</h3>
                  <p className="text-xs text-zinc-300 font-light">{cat.desc}</p>
                </div>
                <span className="text-sm border-b border-primary text-primary font-medium tracking-wider group-hover:pl-2 transition-all">Shop Now &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl font-bold tracking-tight">Featured Masterpieces</h2>
          <div className="h-0.5 w-16 bg-primary mx-auto"></div>
          <p className="text-sm text-muted">Curated selections of our finest work</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((prod) => (
            <div key={prod.id} className="group flex flex-col border border-border bg-card rounded-md overflow-hidden relative shadow-sm hover:shadow-md transition">
              {/* Product Image */}
              <Link href={`/product/${prod.slug}`} className="relative h-[22rem] overflow-hidden bg-zinc-100 flex items-center justify-center">
                <img
                  src={prod.thumbnail}
                  alt={prod.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                />
                {prod.min_price < prod.min_original_price && (
                  <span className="absolute left-3 top-3 bg-red-600 text-white font-bold text-[10px] px-2 py-1 rounded">
                    SALE
                  </span>
                )}
              </Link>

              {/* Product Info */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition">
                    <Link href={`/product/${prod.slug}`}>{prod.name}</Link>
                  </h3>
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed font-light">{prod.short_description}</p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <PriceDisplay
                    aedPrice={prod.min_price}
                    aedCompare={prod.min_price < prod.min_original_price ? prod.min_original_price : null}
                  />
                  <Link href={`/product/${prod.slug}`} className="text-xs text-primary font-medium border-b border-primary hover:text-foreground hover:border-foreground transition">
                    View Details
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
