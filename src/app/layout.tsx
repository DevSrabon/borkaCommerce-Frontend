import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '../store/storeProvider';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomerChatWidget from '../components/CustomerChatWidget';
import NetworkStatusBanner from '../components/NetworkStatusBanner';
import { CurrencyProvider } from '../context/CurrencyContext';
import { LanguageProvider } from '../context/LanguageContext';

export const metadata: Metadata = {
  title: 'Saba Al Wadi | Luxury Abayas & Modest Wear',
  description: 'Shop the finest custom Abayas, Shaylas, Niqabs, and Modest Fashion collections. Handcrafted in the UAE with premium fabrics, embroidery, and details.',
  keywords: 'abayas, online abaya uae, modest wear, luxury abaya, niqab, shayla, silk abaya, designer modest wear',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
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
