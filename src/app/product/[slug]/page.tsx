import { API_BASE_URL } from '@/config/api';
import React from 'react';
import ProductClient from './productClient';
import ReviewSection from '../../../components/ReviewSection';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
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

export default async function ProductDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const product = await getProductDetails(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-16">
      {/* Breadcrumbs / Back navigation */}
      <div>
        <Link href="/catalog" className="text-xs text-muted hover:text-primary transition font-medium">
          &larr; Back to Shop Catalog
        </Link>
      </div>

      <ProductClient product={product} />

      {/* Interactive Verified Customer Reviews Section */}
      <ReviewSection productId={product.id} initialReviews={product.reviews || []} />


      {/* Related Products Section */}
      {product.related_products && product.related_products.length > 0 && (
        <section className="border-t border-border pt-12 space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold tracking-tight">Related Masterpieces</h2>
            <p className="text-xs text-muted">Complete your collection with these matching designs</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {product.related_products.map((item: any) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-square relative w-full overflow-hidden bg-zinc-100">
                  <img
                    src={item.thumbnail || (item.images && item.images[0])}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <h3 className="font-serif font-bold text-xs text-foreground group-hover:text-primary transition line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">
                      AED {item.min_price}
                    </span>
                    {item.min_original_price > item.min_price && (
                      <span className="text-[10px] text-muted line-through">
                        AED {item.min_original_price}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
