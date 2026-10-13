'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Do not render the footer on any admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold tracking-widest text-primary">SABA AL WADI</h3>
            <p className="text-sm text-muted max-w-xs leading-relaxed">
              {t('footer_brand_desc')}
            </p>
          </div>

          {/* Collections */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-foreground mb-4 uppercase">
              {t('footer_collections')}
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/catalog?category=abaya-casual" className="hover:text-primary transition">
                  Casual Abayas
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=abaya-luxury" className="hover:text-primary transition">
                  Luxury Abayas
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=abaya-eid-collection" className="hover:text-primary transition">
                  Eid Festive Collection
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=shayla" className="hover:text-primary transition">
                  Premium Shaylas
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-foreground mb-4 uppercase">
              {t('footer_care')}
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/blogs" className="hover:text-primary transition">
                  Blog & Articles
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-primary transition">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-primary transition">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-primary transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-serif text-sm font-semibold tracking-wider text-foreground mb-4 uppercase">
              {t('footer_contact')}
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>Al Quoz Industrial Area 3, Dubai, UAE</li>
              <li>Email: info@sabaalwadi.com</li>
              <li>Phone: +971 4 123 4567</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>
            &copy; {new Date().getFullYear()} Saba Al Wadi eCommerce. {t('footer_rights')}
          </p>
          <div className="flex items-center space-x-4">
            <span>Secure Payments by Stripe</span>
            <div className="h-6 w-10 bg-zinc-800 rounded border border-border flex items-center justify-center font-bold text-foreground text-[10px]">
              VISA
            </div>
            <div className="h-6 w-10 bg-zinc-800 rounded border border-border flex items-center justify-center font-bold text-foreground text-[10px]">
              MC
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
