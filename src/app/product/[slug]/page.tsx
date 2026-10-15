import { API_BASE_URL } from '@/config/api';
import React from 'react';
import type { Metadata } from 'next';
import ProductClient from './productClient';
import ReviewSection from '../../../components/ReviewSection';
import { PriceDisplay } from '../../../components/PriceDisplay';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Crown, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function cleanDescription(text?: string | null): string {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

async function getProductDetails(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/products/slug/${slug}`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404) {
      return null;
    }
  } catch (err) {}
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductDetails(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Product Not Found | Saba Al Wadi',
    };
  }

  const title = product.seo_title || `${product.name} | Saba Al Wadi Luxury Abayas`;
  const desc =
    product.seo_description ||
    product.short_description ||
    cleanDescription(product.description).substring(0, 160) ||
    'Handcrafted luxury abayas from Saba Al Wadi, Dubai.';
  const images = (product.images || []).map((img: any) =>
    typeof img === 'string' ? img : img.image_url || img.image || ''
  ).filter(Boolean);

  return {
    title,
    description: desc,
    keywords:
      product.seo_keywords || product.tags || `${product.name}, luxury abaya, dubai abaya, modest wear`,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title,
      description: desc,
      url: `/product/${product.slug}`,
      siteName: 'Saba Al Wadi',
      type: 'website',
      images: images.length > 0 ? [{ url: images[0] }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: images.length > 0 ? [images[0]] : undefined,
    },
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getProductDetails(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: (product.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.image_url || img.image || ''
    ).filter(Boolean),
    description:
      product.seo_description ||
      product.short_description ||
      cleanDescription(product.description).substring(0, 300) ||
      product.name,
    sku: product.sku_prefix || product.product_number || product.slug,
    brand: {
      '@type': 'Brand',
      name: 'Saba Al Wadi',
    },
    offers: {
      '@type': 'Offer',
      url: `https://sabaalwadi.com/product/${product.slug}`,
      priceCurrency: 'AED',
      price: Number(product.min_price || product.price || 0).toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.average_rating > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.average_rating,
            reviewCount: Math.max(product.reviews?.length || 1, 1),
          },
        }
      : {}),
  };

  // Related products fallback if not provided in response
  let relatedProducts = product.related_products || [];
  if (relatedProducts.length === 0 && product.categories && product.categories.length > 0) {
    try {
      const primaryCatId = product.categories[0].id;
      const res = await fetch(`${API_BASE_URL}/ecommerce/products?category_id=${primaryCatId}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const catProds = await res.json();
        relatedProducts = (catProds || []).filter((p: any) => p.id !== product.id).slice(0, 4);
      }
    } catch (_) {}
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-3 sm:py-5 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-8">
      {/* Product Schema (JSON-LD) for Google Rich Snippets & Search Console */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Breadcrumbs / Back navigation */}
      <div>
        <Link href="/catalog" className="text-xs text-muted hover:text-primary transition font-medium inline-flex items-center gap-1.5">
          <span>&larr;</span> Back to Shop Catalog
        </Link>
      </div>

      <ProductClient product={product} />

      {/* Interactive Verified Customer Reviews Section */}
      <ReviewSection productId={product.id} initialReviews={product.reviews || []} />

      {/* Modern Curated Related Products Section */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="border-t border-border pt-6 sm:pt-8 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-border">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Crown size={13} className="text-primary" /> Curated Recommendations
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Related Masterpieces
              </h2>
              <p className="text-xs text-muted-foreground font-light">
                Complete your modest ensemble with matching pieces from this collection
              </p>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group self-start sm:self-auto"
            >
              <span>Explore All Abayas</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((item: any) => {
              const hasDiscount = item.min_original_price > item.min_price;
              const discountPct = hasDiscount
                ? Math.round(((item.min_original_price - item.min_price) / item.min_original_price) * 100)
                : 0;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 relative shadow-xs"
                >
                  {/* Thumbnail / Image container */}
                  <Link
                    href={`/product/${item.slug}`}
                    className="aspect-[3/4] relative w-full overflow-hidden bg-zinc-100 block"
                  >
                    <img
                      src={item.thumbnail || (item.images && item.images[0]) || '/placeholder.png'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Floating Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                      {discountPct > 0 && (
                        <span className="bg-red-600 text-white font-bold text-xs sm:text-xs px-2 py-0.5 rounded shadow-sm tracking-wider">
                          {discountPct}% OFF
                        </span>
                      )}
                      {item.is_featured && (
                        <span className="bg-black/75 backdrop-blur-sm text-primary font-bold text-xs sm:text-xs px-2 py-0.5 rounded border border-primary/30 uppercase tracking-wider">
                          Featured
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1">
                      {item.categories && item.categories.length > 0 && (
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block font-medium">
                          {item.categories[0].name}
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition line-clamp-1">
                        <Link href={`/product/${item.slug}`}>{item.name}</Link>
                      </h3>
                      {item.short_description && (
                        <p className="text-xs text-muted-foreground font-light line-clamp-1 hidden sm:block">
                          {item.short_description}
                        </p>
                      )}
                    </div>

                    {/* Price and Rating */}
                    <div className="pt-2.5 border-t border-border flex items-center justify-between">
                      <PriceDisplay
                        aedPrice={item.min_price}
                        aedCompare={hasDiscount ? item.min_original_price : undefined}
                        size="sm"
                      />
                      {item.average_rating > 0 && (
                        <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5">
                          ★ {item.average_rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
