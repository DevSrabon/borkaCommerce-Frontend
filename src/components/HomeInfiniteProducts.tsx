'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';
import { PriceDisplay } from './PriceDisplay';
import { Sparkles, Loader2, Check, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  thumbnail: string;
  min_price: number;
  min_original_price: number;
  on_sale?: boolean;
}

interface HomeInfiniteProductsProps {
  initialProducts?: Product[];
}

const MAX_HOME_PRODUCTS = 24;
const PAGE_SIZE = 8;

export default function HomeInfiniteProducts({
  initialProducts = [],
}: HomeInfiniteProductsProps) {
  const [products, setProducts] = useState<Product[]>(() => initialProducts.slice(0, MAX_HOME_PRODUCTS));
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(initialProducts.length < MAX_HOME_PRODUCTS);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(initialProducts.length > 0);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  // If no initial products were passed, load first batch on mount
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetch(`${API_BASE_URL}/ecommerce/products?page=1&limit=${PAGE_SIZE}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            const capped = data.slice(0, MAX_HOME_PRODUCTS);
            setProducts(capped);
            if (capped.length >= MAX_HOME_PRODUCTS || data.length < PAGE_SIZE) {
              setHasMore(false);
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setInitialLoaded(true);
        });
    }
  }, [initialLoaded]);

  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMore || products.length >= MAX_HOME_PRODUCTS) {
      setHasMore(false);
      return;
    }
    setLoading(true);

    const nextPage = page + 1;
    try {
      const res = await fetch(
        `${API_BASE_URL}/ecommerce/products?page=${nextPage}&limit=${PAGE_SIZE}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Avoid duplicate products by ID and cap at 24 total
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = data.filter((item) => !existingIds.has(item.id));
            const merged = [...prev, ...newItems].slice(0, MAX_HOME_PRODUCTS);
            if (merged.length >= MAX_HOME_PRODUCTS) {
              setHasMore(false);
            }
            return merged;
          });
          setPage(nextPage);
          if (data.length < PAGE_SIZE) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (_) {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, products.length]);

  // Intersection Observer for continuous Infinite Scroll up to 24 products
  useEffect(() => {
    if (!hasMore || products.length >= MAX_HOME_PRODUCTS) return;

    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && products.length < MAX_HOME_PRODUCTS) {
          loadMoreProducts();
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [loadMoreProducts, hasMore, loading, products.length]);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6 pb-4 sm:pb-8 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <span className="text-primary text-xs uppercase font-bold tracking-widest block flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" /> Full Catalog Showcase
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Explore All Collections
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Scroll continuously to explore our entire catalog of luxury Emirati designs and accessories.
          </p>
        </div>

        <div className="text-xs text-muted-foreground bg-accent/40 border border-border px-3 py-1.5 rounded-full font-medium w-fit">
          Showing <span className="font-bold text-foreground">{products.length}</span> pieces
        </div>
      </div>

      {/* Responsive Products Grid (2 columns on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="group flex flex-col border border-border bg-card rounded-xl overflow-hidden relative shadow-xs hover:shadow-lg transition-all duration-300"
          >
            {/* Product Image */}
            <Link
              href={`/product/${prod.slug}`}
              className="relative h-48 sm:h-64 md:h-[22rem] overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
            >
              <img
                src={prod.thumbnail || '/placeholder.png'}
                alt={prod.name}
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              {prod.min_price < prod.min_original_price && (
                <span className="absolute left-2.5 top-2.5 bg-red-600 text-white font-bold text-xs sm:text-xs px-2 py-0.5 rounded shadow-md tracking-wider">
                  {Math.round(
                    ((prod.min_original_price - prod.min_price) /
                      prod.min_original_price) *
                      100
                  )}
                  % OFF
                </span>
              )}
            </Link>

            {/* Product Info */}
            <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-2">
              <div className="space-y-1">
                <h3 className="font-medium text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition">
                  <Link href={`/product/${prod.slug}`}>{prod.name}</Link>
                </h3>
                {prod.short_description && (
                  <p className="text-xs sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed font-light hidden sm:block">
                    {prod.short_description}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pt-2 border-t border-border/40">
                <PriceDisplay
                  aedPrice={prod.min_price}
                  aedCompare={
                    prod.min_price < prod.min_original_price
                      ? prod.min_original_price
                      : null
                  }
                />
                <Link
                  href={`/product/${prod.slug}`}
                  className="text-xs sm:text-xs text-primary font-medium hover:text-foreground transition underline sm:no-underline sm:border-b sm:border-primary w-fit"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel, Loading Indicator, and Show More CTA */}
      <div ref={observerTarget} className="pt-2 pb-1 flex flex-col items-center justify-center space-y-2">
        {loading && (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-accent/60 border border-border text-xs text-muted-foreground animate-pulse">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span>Loading more exclusive abayas...</span>
          </div>
        )}

        {/* When reaching the 24-product homepage limit, show the "Show More" Button linking to /catalog */}
        {products.length >= MAX_HOME_PRODUCTS && (
          <div className="flex flex-col items-center gap-2 text-center py-1">
            <Link
              href="/catalog"
              className="btn-luxury px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <span>Show More &amp; Explore Full Catalog</span>
              <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-muted-foreground max-w-md">
              Showing top {products.length} featured abayas on homepage. Click above to view our entire collection in the catalog.
            </p>
          </div>
        )}

        {!hasMore && products.length < MAX_HOME_PRODUCTS && products.length > 0 && (
          <div className="flex flex-col items-center gap-1.5 text-center py-2 text-muted-foreground">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Check size={14} />
            </div>
            <p className="text-xs font-semibold text-foreground">
              You&apos;ve viewed all available products
            </p>
            <Link
              href="/catalog"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>Browse Catalog by Category &rarr;</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
