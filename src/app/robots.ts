import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sabaalwadi.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/admin/*',
          '/checkout',
          '/profile',
          '/login',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
