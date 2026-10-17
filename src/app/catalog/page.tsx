import { API_BASE_URL } from '@/config/api';
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import CatalogClient, { CatalogCategory, CatalogProduct } from './CatalogClient';

export const metadata: Metadata = {
  title: 'Luxury Abayas Collection & Shop Products | Saba Al Wadi',
  description:
    'Explore our handcrafted abaya collection. From daily Japanese Crepe silhouettes to opulent crystal and bridal abayas in Dubai with worldwide delivery.',
  alternates: {
    canonical: '/catalog',
  },
  openGraph: {
    title: 'Luxury Abayas Collection & Shop Products | Saba Al Wadi',
    description:
      'Explore handcrafted luxury abayas, bridal abayas, and modest couture in Dubai.',
    url: '/catalog',
  },
};

async function getCategories(): Promise<CatalogCategory[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/categories/tree`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return [];
}

async function getProducts(search?: string): Promise<CatalogProduct[]> {
  try {
    let url = `${API_BASE_URL}/ecommerce/products`;
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, { next: { revalidate: 30 } });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return [];
}

interface SearchParams {
  category?: string;
  search?: string;
  on_sale?: string;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentCategory = params.category || '';
  const currentSearch = params.search || '';
  const isOnSale = params.on_sale === 'true';

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8 w-full">
      <Suspense
        fallback={
          <div className="py-24 text-center text-muted-foreground animate-pulse text-sm">
            Loading Catalog Collections…
          </div>
        }
      >
        <CatalogClient
          initialProducts={products}
          categories={categories}
          currentCategory={currentCategory}
          currentSearch={currentSearch}
          initialOnSale={isOnSale}
        />
      </Suspense>
    </div>
  );
}
