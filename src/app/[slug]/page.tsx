import { API_BASE_URL } from '@/config/api';
import React from 'react';
import { notFound } from 'next/navigation';
import { CMSPage, PageBlock } from '@/types/page-builder';
import BlockRenderer from '@/components/page-builder/BlockRenderer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPageData(slug: string): Promise<CMSPage | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/ecommerce/pages/${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch CMS page:', err);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageData(slug);
  if (!page) return { title: 'Page Not Found | Saba Al Wadi' };
  const title = page.meta_title || `${page.title} | Saba Al Wadi`;
  const description =
    page.meta_description || `Discover ${page.title} at Saba Al Wadi Luxury Abayas Dubai.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/${slug}`,
    },
  };
}

export default async function DynamicCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageData(slug);

  if (!page || !page.is_published) {
    notFound();
  }

  let blocks: PageBlock[] = [];
  try {
    blocks = JSON.parse(page.content || '[]');
  } catch {
    blocks = [];
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      {blocks.length === 0 ? (
        <div className="max-w-4xl mx-auto py-24 px-4 text-center text-muted-foreground text-sm">
          This page has no content blocks yet.
        </div>
      ) : (
        <div className="space-y-0">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} isInteractive={true} />
          ))}
        </div>
      )}
    </main>
  );
}
