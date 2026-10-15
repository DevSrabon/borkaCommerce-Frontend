import type { MetadataRoute } from 'next';
import { API_BASE_URL } from '@/config/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sabaalwadi.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/offers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 1. Dynamic Products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/products?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items || [];
      productRoutes = items
        .filter((p: any) => p.slug)
        .map((p: any) => ({
          url: `${siteUrl}/product/${p.slug}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.85,
        }));
    }
  } catch {
    // non-blocking
  }

  // 2. Dynamic Categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/categories`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const categories = await res.json();
      if (Array.isArray(categories)) {
        categoryRoutes = categories
          .filter((c: any) => c.slug)
          .map((c: any) => ({
            url: `${siteUrl}/category/${c.slug}`,
            lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          }));
      }
    }
  } catch {
    // non-blocking
  }

  // 3. Dynamic Blogs
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE_URL}/blogs`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const blogs = Array.isArray(data) ? data : data.blogs || [];
      blogRoutes = blogs
        .filter((b: any) => b.slug)
        .map((b: any) => ({
          url: `${siteUrl}/blogs/${b.slug}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        }));
    }
  } catch {
    // non-blocking
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
