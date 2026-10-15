import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '../store/storeProvider';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomerChatWidget from '../components/CustomerChatWidget';
import NetworkStatusBanner from '../components/NetworkStatusBanner';
import AnalyticsScripts from '../components/AnalyticsScripts';
import { CurrencyProvider } from '../context/CurrencyContext';
import { LanguageProvider } from '../context/LanguageContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sabaalwadi.com'),
  title: {
    default: 'Saba Al Wadi | Luxury Abayas & Modest Wear Dubai',
    template: '%s | Saba Al Wadi',
  },
  description:
    'Shop the finest custom Abayas, Shaylas, Niqabs, and Modest Fashion collections. Handcrafted in the UAE with premium Japanese Crepe, embroidery, and bespoke tailoring.',
  keywords:
    'abayas, online abaya uae, modest wear, luxury abaya, dubai abaya, bridal abaya, velvet abaya, saba al wadi',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Saba Al Wadi | Luxury Abayas & Modest Wear Dubai',
    description:
      'Discover handcrafted luxury abayas, bridal collections, and premium modest wear in Dubai. Worldwide shipping available.',
    url: 'https://sabaalwadi.com',
    siteName: 'Saba Al Wadi',
    locale: 'en_AE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saba Al Wadi | Luxury Abayas & Modest Wear Dubai',
    description:
      'Shop the finest handcrafted abayas and modest fashion in Dubai. Worldwide shipping.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <AnalyticsScripts />
        <LanguageProvider>
          <CurrencyProvider>
            <StoreProvider>
              <Navbar />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
              <CustomerChatWidget />
              <NetworkStatusBanner />
            </StoreProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
