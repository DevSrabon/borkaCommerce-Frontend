import React from 'react';
import Link from 'next/link';
import { PriceDisplay } from '../../components/PriceDisplay';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  thumbnail: string;
  min_price: number;
  min_original_price: number;
  categories: { id: string; name: string; slug: string }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch('http://localhost:8080/ecommerce/categories/tree', {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to load categories tree, using default mock categories list.', err);
  }
  return [
    { id: '1', name: 'Abaya', slug: 'abaya' },
    { id: '2', name: 'Shayla', slug: 'shayla' },
    { id: '3', name: 'Niqab', slug: 'niqab' },
    { id: '4', name: 'Eid Collection', slug: 'abaya-eid-collection' },
  ];
}

async function getProducts(categorySlug?: string, search?: string): Promise<Product[]> {
  try {
    let url = 'http://localhost:8080/ecommerce/products';
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    // We fetch all products and filter in memory if categorySlug is provided, or query if backend supports categoryId
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, { next: { revalidate: 30 } });
    if (res.ok) {
      const data = await res.json();
      if (categorySlug) {
        return data.filter((p: any) =>
          p.categories.some((c: any) => c.slug === categorySlug || c.slug.includes(categorySlug))
        );
      }
      return data;
    }
  } catch (err) {
    console.warn('Backend server down, loading fallback mockup products in catalog.', err);
  }

  // Fallback data
  const fallback = [
    {
      id: 'mock-1',
      name: 'Classic Black Nidha Abaya',
      slug: 'classic-black-nidha-abaya',
      short_description: 'Classic black Nidha abaya for daily wear.',
      thumbnail: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600',
      min_price: 212.50,
      min_original_price: 250.00,
      categories: [{ id: '1', name: 'Abaya', slug: 'abaya' }, { id: '1a', name: 'Casual', slug: 'abaya-casual' }],
    },
    {
      id: 'mock-2',
      name: 'Luxury Silk Embroidered Abaya',
      slug: 'luxury-silk-embroidered-abaya',
      short_description: 'Luxury embroidered silk abaya for special occasions.',
      thumbnail: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&q=80&w=600',
      min_price: 382.50,
      min_original_price: 450.00,
      categories: [{ id: '1', name: 'Abaya', slug: 'abaya' }, { id: '1b', name: 'Luxury', slug: 'abaya-luxury' }, { id: '1c', name: 'Eid Collection', slug: 'abaya-eid-collection' }],
    },
  ];

  if (categorySlug) {
    return fallback.filter((p) => p.categories.some((c) => c.slug === categorySlug));
  }
  return fallback;
}

interface SearchParams {
  category?: string;
  search?: string;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const currentCategory = params.category;
  const currentSearch = params.search;

  const categories = await getCategories();
  const products = await getProducts(currentCategory, currentSearch);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-6 shrink-0">
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-lg font-bold">Filters</h2>
          </div>

          {/* Categories Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Categories</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/catalog"
                className={`text-sm font-medium hover:text-primary transition ${!currentCategory ? 'text-primary' : 'text-foreground/80'
                  }`}
              >
                All Collections
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog?category=${cat.slug}${currentSearch ? `&search=${currentSearch}` : ''}`}
                  className={`text-sm font-medium hover:text-primary transition ${currentCategory === cat.slug ? 'text-primary' : 'text-foreground/80'
                    }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border pb-4 gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold">
                {currentCategory
                  ? `${categories.find((c) => c.slug === currentCategory)?.name || currentCategory} Collection`
                  : 'Catalog'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Showing {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>

            {currentSearch && (
              <div className="text-xs bg-accent border border-border px-3 py-1.5 rounded flex items-center gap-2">
                <span>Search results for: <span className="font-semibold text-foreground">"{currentSearch}"</span></span>
                <Link href="/catalog" className="text-red-500 font-bold hover:underline">X</Link>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-md">
              <p className="text-muted-foreground text-sm">No items found matching your filters.</p>
              <Link href="/catalog" className="text-primary text-xs font-semibold hover:underline mt-2 inline-block">
                Clear Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((prod) => (
                <div key={prod.id} className="group flex flex-col border border-border bg-card rounded-md overflow-hidden relative shadow-sm hover:shadow-md transition">
                  {/* Image */}
                  <Link href={`/product/${prod.slug}`} className="relative h-96 overflow-hidden bg-zinc-100">
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

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition">
                        <Link href={`/product/${prod.slug}`}>{prod.name}</Link>
                      </h3>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed font-light">{prod.short_description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <PriceDisplay
                        aedPrice={prod.min_price}
                        aedCompare={prod.min_price < prod.min_original_price ? prod.min_original_price : null}
                      />
                      <Link href={`/product/${prod.slug}`} className="text-xs text-primary font-medium border-b border-primary hover:text-foreground hover:border-foreground transition">
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
