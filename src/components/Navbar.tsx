'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearSession } from '../store/authSlice';
import { ShoppingBag, User, Search, Menu, X, Sun, Moon } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import CurrencySelector from './CurrencySelector';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const { t, isRTL } = useLanguage();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Compute total items in cart
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render storefront navbar on admin routes (admin has its own sidebar)
  if (pathname.startsWith('/admin')) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    dispatch(clearSession());
    router.push('/');
  };

  const navLinks = [
    { name: t('nav_abayas'), href: '/catalog?category=abaya' },
    { name: t('nav_shaylas'), href: '/catalog?category=shayla' },
    { name: t('nav_niqabs'), href: '/catalog?category=niqab' },
    { name: t('nav_eid'), href: '/catalog?category=abaya-eid-collection' },
    { name: t('nav_offers'), href: '/offers' },
  ];

  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Admin Navigation Bar
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card text-card-foreground shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-xl font-bold tracking-widest text-primary">
              SABA <span className="text-foreground">ADMIN</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/admin/products" className={`hover-gold ${pathname === '/admin/products' ? 'text-primary' : 'text-muted-foreground'}`}>
                Products
              </Link>
              <Link href="/admin/categories" className={`hover-gold ${pathname === '/admin/categories' ? 'text-primary' : 'text-muted-foreground'}`}>
                Categories
              </Link>
              <Link href="/admin/inventory" className={`hover-gold ${pathname === '/admin/inventory' ? 'text-primary' : 'text-muted-foreground'}`}>
                Inventory
              </Link>
              <Link href="/admin/orders" className={`hover-gold ${pathname === '/admin/orders' ? 'text-primary' : 'text-muted-foreground'}`}>
                Orders
              </Link>
              <Link href="/admin/offers" className={`hover-gold ${pathname === '/admin/offers' ? 'text-primary' : 'text-muted-foreground'}`}>
                Offers/Coupons
              </Link>
              <Link href="/admin/customers" className={`hover-gold ${pathname === '/admin/customers' ? 'text-primary' : 'text-muted-foreground'}`}>
                Customers
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <CurrencySelector />
            <LanguageSelector />
            <Link href="/" className="text-xs border border-border px-3 py-1.5 rounded-md hover:bg-accent font-medium transition">
              Storefront
            </Link>
            {mounted && user && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">{user.first_name}</span>
                <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex-1 md:flex-none">
            <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-foreground hover:opacity-90">
              SABA <span className="text-primary">AL WADI</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex flex-1 justify-center space-x-8 text-sm font-medium tracking-wide uppercase">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors duration-200 ${
                  pathname === link.href ? 'text-primary' : 'text-foreground/80 hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Icons / Utility Nav */}
          <div className="flex items-center space-x-6">
            <CurrencySelector />
            <LanguageSelector />
            {/* Search Icon */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-card border border-border rounded-md px-2 py-1 w-64">
                  <input
                    type="text"
                    placeholder="Search premium abayas..."
                    className="w-full bg-transparent text-sm focus:outline-none pr-6"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-2 text-muted hover:text-foreground">
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="text-foreground hover:text-primary transition-colors">
                  <Search size={20} />
                </button>
              )}
            </div>

            {/* Profile */}
            {mounted && user ? (
              <div className="relative group">
                <Link href="/profile" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors">
                  <User size={20} />
                </Link>
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                  <div className="px-4 py-2 border-b border-border text-xs text-muted">
                    Signed in as <br />
                    <span className="font-semibold text-foreground">{user.email}</span>
                  </div>
                  {user.email === 'srabon@example.com' || user.email === 'admin@example.com' ? (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-foreground hover:bg-accent">
                      Admin Panel
                    </Link>
                  ) : null}
                  <Link href="/profile" className="block px-4 py-2 text-sm text-foreground hover:bg-accent">
                    My Account
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-accent">
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="text-foreground hover:text-primary transition-colors">
                <User size={20} />
              </Link>
            )}

            {/* Shopping Bag */}
            <Link href="/cart" className="relative text-foreground hover:text-primary transition-colors">
              <ShoppingBag size={20} />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground hover:text-primary md:hidden focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 space-y-4 shadow-inner">
          <nav className="flex flex-col space-y-3 font-medium uppercase tracking-wide">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground/90 hover:text-primary py-1"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
