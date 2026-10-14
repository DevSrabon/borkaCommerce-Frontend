'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/config/api';
// Custom clean SVGs for social media icons
const FacebookIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YoutubeIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const PinterestIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12C24.017 5.367 18.644 0 12.017 0z" />
  </svg>
);

const TikTokIcon = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97v7.54c.03 2.27-.67 4.57-2.12 6.33-1.61 1.95-4.14 3.07-6.68 2.98-2.54-.1-4.96-1.39-6.39-3.48-1.43-2.09-1.74-4.83-.84-7.24.9-2.41 3.07-4.18 5.62-4.57.48-.07.97-.08 1.46-.04v4.11c-.35-.06-.72-.04-1.07.03-1.14.23-2.09.99-2.52 2.06-.43 1.07-.27 2.33.41 3.25.68.92 1.83 1.42 2.96 1.3 1.13-.12 2.12-.86 2.54-1.92.21-.54.28-1.12.28-1.7V.02z" />
  </svg>
);

export default function Footer() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<Record<string, string>>({
    footer_about_text:
      'Saba Al Wadi is an online business specializing in selling high-quality Abayas, offering a variety of stylish and modest designs for women.',
    footer_phone_1: 'Tel: +971 55 642 4758',
    footer_phone_2: 'Mob: +971 55 79 17 409',
    footer_phone_3: 'Mob: +971 50 93 75 919',
    footer_phone_4: 'Mob: +971 55 467 5285 (Suit No: M-16 Contact Number)',
    footer_email: 'contact@sabaalwadi.com',
    footer_hours_sat_thu: 'Sat-Thu: 09:00am-11:00pm',
    footer_hours_fri: 'Friday: 04:00pm-10:00pm',
    footer_address_1:
      'Suit No: M-49, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
    footer_address_2:
      'Suit No: M-104, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
    footer_address_3:
      'Suit No: M-16, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
    social_facebook: 'https://facebook.com/sabaalwadi',
    social_instagram: 'https://instagram.com/sabaalwadi',
    social_youtube: 'https://youtube.com/@sabaalwadi',
    social_pinterest: 'https://pinterest.com/sabaalwadi',
    social_tiktok: 'https://tiktok.com/@sabaalwadi',
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/ecommerce/site-settings`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (data && typeof data === 'object') {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  // Do not render the footer on any admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const logoUrl = settings.logo_url;

  return (
    <footer className="w-full border-t border-border bg-card text-foreground transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 5-Column Grid exactly matching Saba Al Wadi Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-xs leading-relaxed">
          {/* Column 1: Brand & Monogram Logo & About Description */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="inline-block group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={settings.site_name || 'Saba Al Wadi'}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                /* Elegant Gold Monogram Emblem */
                <div className="w-16 h-16 rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent flex flex-col items-center justify-center p-1.5 shadow-sm group-hover:border-amber-500 transition-colors">
                  <span className="font-serif font-black text-amber-500 text-base tracking-widest">
                    SW
                  </span>
                  <span className="text-[6.5px] uppercase tracking-tighter text-amber-600 dark:text-amber-400 font-semibold text-center leading-[8px] mt-0.5">
                    Saba Al Wadi
                  </span>
                </div>
              )}
            </Link>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {settings.footer_about_text ||
                'Saba Al Wadi is an online business specializing in selling high-quality Abayas, offering a variety of stylish and modest designs for women.'}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1 text-foreground/80">
              <a
                href={settings.social_facebook || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
                title="Facebook"
              >
                <FacebookIcon size={13} />
              </a>
              <a
                href={settings.social_instagram || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
                title="Instagram"
              >
                <InstagramIcon size={13} />
              </a>
              <a
                href={settings.social_youtube || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
                title="YouTube"
              >
                <YoutubeIcon size={13} />
              </a>
              <a
                href={settings.social_pinterest || 'https://pinterest.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
                title="Pinterest"
              >
                <PinterestIcon size={13} />
              </a>
              <a
                href={settings.social_tiktok || 'https://tiktok.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary transition-colors cursor-pointer"
                title="TikTok"
              >
                <TikTokIcon size={13} />
              </a>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm tracking-wide">
              Company
            </h4>
            <ul className="space-y-2 text-muted-foreground text-xs">
              <li>
                <Link href="/about-us" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-primary transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-primary transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="hover:text-primary transition">
                  Terms Conditions
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-primary transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Need Help */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm tracking-wide">
              Need Help &amp; Support
            </h4>
            <ul className="space-y-2 text-muted-foreground text-xs">
              {[settings.footer_phone_1, settings.footer_phone_2, settings.footer_phone_3, settings.footer_phone_4]
                .filter(Boolean)
                .map((phone, idx) => (
                  <li key={idx}>
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                      className="hover:text-primary transition block"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              {settings.footer_email && (
                <li className="pt-1">
                  <a
                    href={`mailto:${settings.footer_email}`}
                    className="text-primary hover:underline font-medium block"
                  >
                    {settings.footer_email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Business Hours */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm tracking-wide">
              Business Hours
            </h4>
            <ul className="space-y-2 text-muted-foreground text-xs">
              {settings.footer_hours_sat_thu && (
                <li className="leading-snug">{settings.footer_hours_sat_thu}</li>
              )}
              {settings.footer_hours_fri && (
                <li className="leading-snug">{settings.footer_hours_fri}</li>
              )}
            </ul>
          </div>

          {/* Column 5: Multiple Branches & Address */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm tracking-wide">
              Our Branches
            </h4>
            <div className="space-y-3 text-muted-foreground text-[11px] leading-relaxed">
              {(() => {
                let branches: {
                  id?: string;
                  name?: string;
                  address?: string;
                  phone?: string;
                  email?: string;
                  hours?: string;
                }[] = [];

                try {
                  if (settings.footer_branches_json) {
                    const parsed = JSON.parse(settings.footer_branches_json);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      branches = parsed;
                    }
                  }
                } catch {}

                if (branches.length === 0) {
                  if (settings.footer_address_1) branches.push({ name: 'Branch 1', address: settings.footer_address_1 });
                  if (settings.footer_address_2) branches.push({ name: 'Branch 2', address: settings.footer_address_2 });
                  if (settings.footer_address_3) branches.push({ name: 'Branch 3', address: settings.footer_address_3 });
                }

                if (branches.length === 0) {
                  return <p className="text-muted-foreground">Main Store - Dubai, UAE</p>;
                }

                return branches.map((b, idx) => (
                  <div key={b.id || idx} className="border-b border-border/40 pb-2.5 last:border-b-0 space-y-0.5">
                    {b.name && <p className="font-semibold text-foreground text-xs">{b.name}</p>}
                    {b.address && <p>{b.address}</p>}
                    {b.phone && (
                      <a
                        href={`tel:${b.phone.replace(/[^\d+]/g, '')}`}
                        className="text-primary hover:underline block text-[10px] font-medium"
                      >
                        {b.phone}
                      </a>
                    )}
                    {b.email && (
                      <a
                        href={`mailto:${b.email}`}
                        className="text-muted-foreground hover:text-primary block text-[10px]"
                      >
                        {b.email}
                      </a>
                    )}
                    {b.hours && (
                      <p className="text-[10px] text-muted-foreground/80 italic">{b.hours}</p>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment badges */}
        <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {settings.site_name || 'Saba Al Wadi'} Haute Couture. All rights reserved.
          </p>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Secure 256-Bit SSL Encrypted Checkout</span>
            <div className="flex items-center gap-1 font-mono font-bold text-[9px]">
              <span className="px-1.5 py-0.5 rounded border border-border bg-accent text-foreground">
                VISA
              </span>
              <span className="px-1.5 py-0.5 rounded border border-border bg-accent text-foreground">
                MASTERCARD
              </span>
              <span className="px-1.5 py-0.5 rounded border border-border bg-accent text-foreground">
                STRIPE
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
