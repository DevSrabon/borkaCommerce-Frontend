import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fashion Blog & Modest Style Guides | Saba Al Wadi',
  description:
    'Explore the latest luxury modest wear trends, bridal abaya advice, Japanese crepe fabric insights, and Dubai fashion guides.',
  alternates: {
    canonical: '/blogs',
  },
  openGraph: {
    title: 'Fashion Blog & Modest Style Guides | Saba Al Wadi',
    description:
      'Explore the latest luxury modest wear trends, bridal abaya advice, and Dubai fashion guides.',
    url: '/blogs',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
