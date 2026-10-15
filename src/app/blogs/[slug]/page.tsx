import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
import { ChevronRight } from 'lucide-react';
import BlogClient from './BlogClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function cleanExcerpt(text?: string | null): string {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

async function getBlog(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/blogs/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = await getBlog(resolvedParams.slug);

  if (!blog) {
    return {
      title: 'Article Not Found | Saba Al Wadi',
    };
  }

  const title = `${blog.title} | Saba Al Wadi Blog`;
  const desc =
    blog.excerpt ||
    cleanExcerpt(blog.content).substring(0, 160) ||
    'Read the latest modest fashion and luxury abaya articles from Saba Al Wadi.';
  const image = blog.main_image || blog.featured_image;

  return {
    title,
    description: desc,
    keywords: `${blog.category}, modest fashion, luxury abayas, dubai abaya trends, saba al wadi`,
    alternates: {
      canonical: `/blogs/${blog.slug}`,
    },
    openGraph: {
      title,
      description: desc,
      url: `/blogs/${blog.slug}`,
      siteName: 'Saba Al Wadi',
      type: 'article',
      publishedTime: blog.published_at,
      authors: [blog.author || 'Saba Al Wadi'],
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const blog = await getBlog(resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    image: blog.main_image || blog.featured_image ? [blog.main_image || blog.featured_image] : undefined,
    datePublished: blog.published_at,
    dateModified: blog.updated_at || blog.published_at,
    author: {
      '@type': 'Organization',
      name: blog.author || 'Saba Al Wadi',
      url: 'https://sabaalwadi.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Saba Al Wadi',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sabaalwadi.com/logo.png',
      },
    },
    description: blog.excerpt || cleanExcerpt(blog.content).substring(0, 200),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sabaalwadi.com/blogs/${blog.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      {/* BlogPosting Schema for Google Search Console and SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/blogs" className="hover:text-primary transition">
            Blogs
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-medium truncate max-w-xs sm:max-w-md">
            {blog.title}
          </span>
        </nav>

        {/* Client Interactive Container with comments and widgets */}
        <BlogClient initialBlog={blog} />
      </div>
    </div>
  );
}
