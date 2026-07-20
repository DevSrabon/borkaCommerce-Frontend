import React from 'react';
import ProductClient from './productClient';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProductDetails(slug: string) {
  try {
    const res = await fetch(`http://localhost:8080/ecommerce/products/slug/${slug}`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 404) {
      return null;
    }
  } catch (err) {
    console.warn('Backend server down, loading fallback mockup product details.', err);
  }

  // Fallback details matching standard seed items
  return {
    id: 'mock-1',
    name: 'Classic Black Nidha Abaya',
    slug: 'classic-black-nidha-abaya',
    description: 'A premium everyday abaya made with fine Nidha fabric. Features simple classic detailing and comfortable style.',
    images: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&q=80&w=600',
    ],
    rating: { average: 4.8, count: 5 },
    variants: [
      {
        id: 'var-1a',
        sku: 'ABA-BLK-54-NID',
        price: 250.00,
        compare_price: 300.00,
        discounted_price: 212.50,
        available_stock: 50,
        attributes: [
          { name: 'Color', value: 'Black' },
          { name: 'Size', value: '54' },
          { name: 'Fabric', value: 'Nidha' },
        ],
        offer: { name: 'Eid Sale 2026', discount_value: 15, discount_type: 'PERCENTAGE' },
        images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600'],
      },
      {
        id: 'var-1b',
        sku: 'ABA-BLK-56-NID',
        price: 250.00,
        compare_price: 300.00,
        discounted_price: 212.50,
        available_stock: 35,
        attributes: [
          { name: 'Color', value: 'Black' },
          { name: 'Size', value: '56' },
          { name: 'Fabric', value: 'Nidha' },
        ],
        offer: { name: 'Eid Sale 2026', discount_value: 15, discount_type: 'PERCENTAGE' },
        images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600'],
      },
    ],
    reviews: [
      { id: 'rev-1', rating: 5, review: 'Absolutely love the Nidha fabric! Very soft and falls beautifully.', created_at: '2026-06-15T00:00:00Z', customer_name: 'Fatima A.' },
      { id: 'rev-2', rating: 4, review: 'Perfect fit, but took an extra day for delivery. Overall highly recommend!', created_at: '2026-07-02T00:00:00Z', customer_name: 'Aisha M.' },
    ],
  };
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

      {/* Reviews Section */}
      <section className="border-t border-border pt-12 space-y-8">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold tracking-tight">Customer Reviews</h2>
          <p className="text-xs text-muted">What our customers say about this masterpiece</p>
        </div>

        {product.reviews.length === 0 ? (
          <p className="text-sm text-muted font-light">No reviews have been written for this product yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {product.reviews.map((rev: any) => (
              <div key={rev.id} className="bg-card border border-border p-6 rounded-md space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground">{rev.customer_name}</span>
                  <span className="text-xs text-muted">{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-primary font-bold text-xs">
                  {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">
                  "{rev.review}"
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
