import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '../store/storeProvider';
import Navbar from '../components/Navbar';
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
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <LanguageProvider>
        <CurrencyProvider>
          <StoreProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
          
          {/* Luxury Footer */}
          <footer className="w-full border-t border-border bg-card text-card-foreground">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="space-y-4">
                  <h3 className="font-serif text-lg font-bold tracking-widest text-primary">SABA AL WADI</h3>
                  <p className="text-sm text-muted max-w-xs">
                    Curating luxury abayas, modest wear, and accessories since 2026. Handcrafted with fine fabrics in Dubai.
                  </p>
                </div>

                {/* Collections */}
                <div>
                  <h4 className="font-serif text-sm font-semibold tracking-wider text-foreground mb-4 uppercase">Collections</h4>
                  <ul className="space-y-2 text-sm text-muted">
                    <li><a href="/catalog?category=abaya-casual" className="hover:text-primary transition">Casual Abayas</a></li>
                    <li><a href="/catalog?category=abaya-luxury" className="hover:text-primary transition">Luxury Abayas</a></li>
                    <li><a href="/catalog?category=abaya-eid-collection" className="hover:text-primary transition">Eid Festive Collection</a></li>
                    <li><a href="/catalog?category=shayla" className="hover:text-primary transition">Premium Shaylas</a></li>
                  </ul>
                </div>

                {/* Customer Service */}
                <div>
                  <h4 className="font-serif text-sm font-semibold tracking-wider text-foreground mb-4 uppercase">Customer Care</h4>
                  <ul className="space-y-2 text-sm text-muted">
                    <li><a href="/about-us" className="hover:text-primary transition">About Us</a></li>
                    <li><a href="/contact-us" className="hover:text-primary transition">Contact Support</a></li>
                    <li><a href="/shipping-returns" className="hover:text-primary transition">Shipping & Returns</a></li>
                    <li><a href="/privacy-policy" className="hover:text-primary transition">Privacy Policy</a></li>
                  </ul>
                </div>

                {/* Contact info */}
                <div>
                  <h4 className="font-serif text-sm font-semibold tracking-wider text-foreground mb-4 uppercase">Store Contact</h4>
                  <ul className="space-y-2 text-sm text-muted">
                    <li>Al Quoz Industrial Area 3, Dubai, UAE</li>
                    <li>Email: info@sabaalwadi.com</li>
                    <li>Phone: +971 4 123 4567</li>
                  </ul>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
                <p>&copy; {new Date().getFullYear()} Saba Al Wadi eCommerce. All rights reserved.</p>
                <div className="flex items-center space-x-4">
                  <span>Secure Payments by Stripe</span>
                  <div className="h-6 w-10 bg-zinc-800 rounded border border-border flex items-center justify-center font-bold text-foreground text-[10px]">VISA</div>
                  <div className="h-6 w-10 bg-zinc-800 rounded border border-border flex items-center justify-center font-bold text-foreground text-[10px]">MC</div>
                </div>
              </div>
            </div>
          </footer>
          </StoreProvider>
        </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
