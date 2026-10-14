'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearSession } from '../store/authSlice';
import {
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  LayoutGrid,
  Flame,
  ArrowRight,
  ShieldCheck,
  Tag,
  Layers,
  BookOpen,
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import CurrencySelector from './CurrencySelector';
import CombinedLocaleSelector from './CombinedLocaleSelector';
import { useLanguage } from '../context/LanguageContext';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  show_in_navbar?: boolean;
  children?: SubCategory[];
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const { t, isRTL } = useLanguage();

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [allCategoriesDropdownOpen, setAllCategoriesDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileCats, setExpandedMobileCats] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/ecommerce/site-settings`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (data && typeof data === 'object') {
          setSiteSettings(data as Record<string, string>);
        }
      })
      .catch(() => {});
  }, []);

  const logoUrl = siteSettings.logo_url;
  const siteName = siteSettings.site_name || '';

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch product suggestions when debounced search has at least 2 characters
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return;
    }

    let active = true;
    setSearchLoading(true);

    fetch(`${API_BASE_URL}/ecommerce/products?search=${encodeURIComponent(debouncedSearch)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active) {
          if (Array.isArray(data)) {
            setSearchSuggestions(data.slice(0, 5));
          } else {
            setSearchSuggestions([]);
          }
        }
      })
      .catch(() => {
        if (active) setSearchSuggestions([]);
      })
      .finally(() => {
        if (active) setSearchLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const allCatsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute total items in cart
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setMounted(true);

    // Fetch dynamic category tree
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/categories/tree`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data);
            return;
          }
        }
      } catch (_) {}

      // Fallback categories if backend cold start
      setCategories([
        {
          id: 'cat-1',
          name: 'Abayas',
          slug: 'abaya',
          description: 'Emirati & Luxury Couture Abayas',
          children: [
            { id: 'sub-1', name: 'Casual Daily Wear', slug: 'abaya-casual', description: 'Breathable, minimalist daily wear' },
            { id: 'sub-2', name: 'Luxury Couture', slug: 'abaya-luxury', description: 'Pure silk & embellished velvet' },
            { id: 'sub-3', name: 'Eid Festive Collection', slug: 'abaya-eid-collection', description: 'Exclusive festive celebratory ensembles' },
          ],
        },
        {
          id: 'cat-2',
          name: 'Shaylas',
          slug: 'shayla',
          description: 'Flowing Matching Chiffon Scarves',
          children: [
            { id: 'sub-4', name: 'Silk Georgette', slug: 'shayla-silk', description: 'Lightweight premium silk drape' },
            { id: 'sub-5', name: 'Everyday Chiffon', slug: 'shayla-chiffon', description: 'Breathable and non-slip' },
          ],
        },
        {
          id: 'cat-3',
          name: 'Niqabs',
          slug: 'niqab',
          description: 'Ultra-breathable modest face veils',
          children: [
            { id: 'sub-6', name: 'Single Layer Elastic', slug: 'niqab-single', description: 'Ultra-soft eye opening' },
            { id: 'sub-7', name: 'Saudi Style Double Layer', slug: 'niqab-double', description: 'Complete modest coverage' },
          ],
        },
      ]);
    };

    fetchCategories();
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAllCategoriesDropdownOpen(false);
    setProfileDropdownOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Don't render storefront navbar on admin routes
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

  const handleMouseEnter = (catId: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(catId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 250);
  };

  const handleAllCatsMouseEnter = () => {
    if (allCatsTimeoutRef.current) clearTimeout(allCatsTimeoutRef.current);
    setAllCategoriesDropdownOpen(true);
  };

  const handleAllCatsMouseLeave = () => {
    allCatsTimeoutRef.current = setTimeout(() => {
      setAllCategoriesDropdownOpen(false);
    }, 250);
  };

  const handleProfileMouseEnter = () => {
    if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
    setProfileDropdownOpen(true);
  };

  const handleProfileMouseLeave = () => {
    profileTimeoutRef.current = setTimeout(() => {
      setProfileDropdownOpen(false);
    }, 250);
  };

  const toggleMobileCat = (catId: string) => {
    setExpandedMobileCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-sm transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-3 md:gap-6">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" aria-label="Home">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={siteName || 'Store Logo'}
                    className="h-10 sm:h-12 w-auto max-h-12 object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  /* Elegant Gold Monogram Emblem */
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent flex items-center justify-center shadow-xs group-hover:border-amber-500 transition-all shrink-0">
                    <span className="font-serif font-black text-amber-500 text-sm sm:text-base tracking-widest leading-none">
                      SW
                    </span>
                  </div>
                )}
                {siteSettings.site_name && siteSettings.site_name.trim().toLowerCase() !== 'saba al wadi' && (
                  <div className="flex flex-col justify-center">
                    <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-foreground group-hover:opacity-90 leading-tight">
                      {siteSettings.site_name}
                    </span>
                    {siteSettings.site_tagline && (
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium hidden sm:block">
                        {siteSettings.site_tagline}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </div>

            {/* Desktop Navigation: All Categories & Dynamic Hierarchical Categories */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-xs font-semibold tracking-wider uppercase">
              {/* "All Categories" Rich Dropdown Trigger */}
              <div
                className="relative"
                onMouseEnter={handleAllCatsMouseEnter}
                onMouseLeave={handleAllCatsMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setAllCategoriesDropdownOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md transition font-bold cursor-pointer ${
                    allCategoriesDropdownOpen
                      ? 'bg-accent text-primary'
                      : 'hover:bg-accent/60 text-foreground hover:text-primary'
                  }`}
                  aria-expanded={allCategoriesDropdownOpen}
                >
                  <LayoutGrid size={15} className="text-primary transition-transform duration-300" />
                  <span>All Categories</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${
                      allCategoriesDropdownOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </button>

                {/* All Categories Dropdown Menu - 100% Solid Non-Transparent */}
                {allCategoriesDropdownOpen && (
                  <div className="absolute left-0 top-full pt-2 z-50 w-[460px] max-w-[90vw] animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl p-4 space-y-4 text-card-foreground">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <LayoutGrid size={13} />
                          All Categories & Collections
                        </span>
                        <Link
                          href="/catalog"
                          onClick={() => setAllCategoriesDropdownOpen(false)}
                          className="text-xs text-muted-foreground hover:text-primary font-medium transition"
                        >
                          View Full Catalog &rarr;
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                        {categories.map((cat) => (
                          <div key={cat.id} className="p-3 rounded-lg bg-accent/40 hover:bg-accent/70 border border-border/50 transition flex flex-col justify-between">
                            <div>
                              <Link
                                href={`/catalog?category=${cat.slug}`}
                                onClick={() => setAllCategoriesDropdownOpen(false)}
                                className="font-serif font-bold text-xs text-foreground hover:text-primary block"
                              >
                                {cat.name}
                              </Link>
                              {cat.description && (
                                <p className="text-xs text-muted-foreground font-light line-clamp-1 mt-0.5">
                                  {cat.description}
                                </p>
                              )}
                            </div>

                            {cat.children && cat.children.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1 pt-1.5 border-t border-border/30">
                                {cat.children.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/catalog?category=${sub.slug}`}
                                    onClick={() => setAllCategoriesDropdownOpen(false)}
                                    className="text-xs bg-card dark:bg-zinc-900 border border-border px-1.5 py-0.5 rounded text-foreground/80 hover:text-primary hover:border-primary/50 transition font-normal"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <Link
                          href="/offers"
                          onClick={() => setAllCategoriesDropdownOpen(false)}
                          className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                        >
                          <Tag size={12} />
                          Special Offers & Flash Sales
                        </Link>
                        <Link
                          href="/catalog"
                          onClick={() => setAllCategoriesDropdownOpen(false)}
                          className="text-primary font-semibold hover:underline"
                        >
                          Browse All ({categories.length})
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Categories with Megamenu Hover - Managed by Admin */}
              {categories
                .filter((cat) => cat.show_in_navbar !== false)
                .map((cat) => {
                const hasChildren = cat.children && cat.children.length > 0;
                const isActive = pathname.includes(cat.slug);

                return (
                  <div
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(cat.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={`/catalog?category=${cat.slug}`}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'text-primary font-bold'
                          : 'text-foreground/85 hover:text-primary hover:bg-accent/40'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {hasChildren && (
                        <ChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${
                            activeDropdown === cat.id ? 'rotate-180 text-primary' : 'text-muted-foreground'
                          }`}
                        />
                      )}
                    </Link>

                    {/* Desktop Dropdown for Subcategories - 100% Solid Non-Transparent */}
                    {hasChildren && activeDropdown === cat.id && (
                      <div className="absolute left-0 top-full pt-2 z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl p-3 space-y-1 text-card-foreground">
                          <div className="px-3 py-1.5 border-b border-border mb-1">
                            <span className="text-xs font-bold text-primary tracking-widest uppercase block">
                              {cat.name} Subcategories
                            </span>
                            {cat.description && (
                              <p className="text-xs text-muted-foreground font-normal normal-case line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </div>

                          {cat.children?.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/catalog?category=${sub.slug}`}
                              className="group block px-3 py-2 rounded-md hover:bg-accent transition text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition normal-case">
                                  {sub.name}
                                </span>
                                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-primary transition-all" />
                              </div>
                              {sub.description && (
                                <p className="text-xs text-muted-foreground font-normal normal-case line-clamp-1 mt-0.5">
                                  {sub.description}
                                </p>
                              )}
                            </Link>
                          ))}

                          <div className="pt-2 mt-1 border-t border-border">
                            <Link
                              href={`/catalog?category=${cat.slug}`}
                              className="text-xs text-primary font-bold hover:underline px-3 py-1 block normal-case"
                            >
                              Explore all {cat.name} &rarr;
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Flash Sale / Offers Link */}
              <Link
                href="/offers"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-bold transition-colors ${
                  pathname === '/offers'
                    ? 'text-primary bg-primary/10'
                    : 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <Flame size={13} className="text-amber-500 animate-pulse" />
                <span>Offers</span>
                <span className="text-xs bg-amber-500/20 text-amber-500 border border-amber-500/40 px-1 rounded font-mono font-bold">
                  20% OFF
                </span>
              </Link>

              {/* Blog Link */}
              <Link
                href="/blogs"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-bold transition-colors ${
                  pathname?.startsWith('/blogs')
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/80 hover:text-primary hover:bg-accent/50'
                }`}
              >
                <span>Blog</span>
              </Link>
            </nav>

            {/* Right: Desktop Combined Locale, Search, Profile + Universal Cart + Mobile Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Desktop Only: Combined Language & Currency, Search, Profile */}
              <div className="hidden lg:flex items-center gap-3 sm:gap-4">
                <CombinedLocaleSelector variant="desktop" />

                {/* Search Toggle */}
              <div className="relative">
                {searchOpen ? (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
                    <form
                      onSubmit={handleSearchSubmit}
                      className="flex items-center bg-card dark:bg-zinc-900 border border-border rounded-md px-2.5 py-1.5 w-72 sm:w-80 shadow-2xl animate-in fade-in"
                    >
                      <input
                        type="text"
                        placeholder="Search abayas, fabrics..."
                        className="w-full bg-transparent text-xs focus:outline-none pr-6 text-foreground"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                          setSearchSuggestions([]);
                        }}
                        className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </form>

                    {/* Live Desktop Search Suggestions Dropdown */}
                    {debouncedSearch.length >= 2 && (
                      <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl overflow-hidden text-foreground animate-in fade-in slide-in-from-top-1">
                        <div className="p-2 border-b border-border bg-accent/40 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {searchLoading ? 'Searching items...' : `${searchSuggestions.length} found`}
                          </span>
                          {searchLoading && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping"></span>}
                        </div>

                        {searchLoading && searchSuggestions.length === 0 ? (
                          <div className="p-3 space-y-2">
                            <div className="h-3.5 bg-muted/40 rounded animate-pulse w-3/4"></div>
                            <div className="h-3.5 bg-muted/40 rounded animate-pulse w-1/2"></div>
                          </div>
                        ) : searchSuggestions.length > 0 ? (
                          <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                            {searchSuggestions.map((prod: any) => (
                              <button
                                key={prod.id}
                                type="button"
                                onClick={() => {
                                  router.push(`/product/${prod.slug}`);
                                  setSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full text-left p-2.5 flex items-center gap-2.5 hover:bg-accent/60 transition cursor-pointer"
                              >
                                <div className="h-9 w-9 rounded overflow-hidden bg-muted shrink-0 border border-border/50">
                                  <img
                                    src={prod.thumbnail || (prod.images && prod.images[0]) || '/placeholder.png'}
                                    alt={prod.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">{prod.name}</p>
                                  <p className="text-xs font-semibold text-primary">AED {prod.min_price}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            No products matching &quot;{debouncedSearch}&quot;
                          </div>
                        )}

                        <div className="p-2 border-t border-border bg-accent/20">
                          <button
                            type="button"
                            onClick={() => {
                              router.push(`/catalog?search=${encodeURIComponent(debouncedSearch)}`);
                              setSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="w-full py-1 text-center text-xs text-primary font-semibold hover:underline cursor-pointer"
                          >
                            View all results for &quot;{debouncedSearch}&quot; &rarr;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
                    aria-label="Open search"
                  >
                    <Search size={19} />
                  </button>
                )}
              </div>

              {/* Profile Account Icon & Avatar with Solid Non-Flicker Dropdown */}
              {mounted && user ? (
                <div
                  className="relative"
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 p-1 rounded-full text-foreground hover:text-primary transition-colors cursor-pointer"
                    aria-label="Account menu"
                    aria-expanded={profileDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/40 bg-accent flex items-center justify-center font-serif text-xs font-bold text-primary">
                      {(user as any)?.avatar_url ? (
                        <img
                          src={
                            (user as any).avatar_url.startsWith('http')
                              ? (user as any).avatar_url
                              : `${API_BASE_URL}${(user as any).avatar_url}`
                          }
                          alt={user.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.first_name?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                  </button>

                  {/* Account Dropdown - Connected via pt-2 bridge, 250ms debounce, 100% Solid background */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 top-full pt-2 z-50 w-56 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl py-1 divide-y divide-border text-card-foreground">
                        <div className="px-4 py-2.5 text-xs">
                          <span className="text-xs uppercase font-bold text-primary block">Signed in</span>
                          <span className="font-semibold text-foreground truncate block">{user.email}</span>
                        </div>
                        <div className="py-1">
                          {user.email === 'srabon@example.com' || user.email === 'admin@example.com' || (user as any).role === 'ADMIN' ? (
                            <Link
                              href="/admin"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-semibold text-primary hover:bg-accent"
                            >
                              Admin Dashboard
                            </Link>
                          ) : null}
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="block px-4 py-2 text-xs text-foreground hover:bg-accent"
                          >
                            My Profile & Orders
                          </Link>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full text-left block px-4 py-2 text-xs text-red-500 hover:bg-accent cursor-pointer"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="p-1.5 text-foreground hover:text-primary transition-colors"
                  aria-label="Sign in"
                >
                  <User size={19} />
                </Link>
              )}
            </div>

            {/* Shopping Bag (Desktop & Mobile) */}
            <Link
              href="/cart"
              className="relative p-1.5 text-foreground hover:text-primary transition-colors"
              aria-label="View shopping bag"
            >
              <ShoppingBag size={20} />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Right: Hamburger Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-foreground hover:text-primary transition rounded-lg hover:bg-accent cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              <Menu size={22} />
            </button>
          </div>
          </div>
        </div>
      </header>



      {/* =========================================================================
          MOBILE RESPONSIVE NAVIGATION DRAWER (SLIDES FROM RIGHT)
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer on Right */}
          <div className="relative w-4/5 max-w-xs bg-background border-l border-border h-full shadow-2xl p-5 overflow-y-auto space-y-5 z-10 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 group"
                  aria-label="Home"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={siteName || 'Store Logo'}
                      className="h-9 w-auto max-h-9 object-contain"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent flex items-center justify-center shadow-xs shrink-0">
                      <span className="font-serif font-black text-amber-500 text-xs tracking-widest leading-none">
                        SW
                      </span>
                    </div>
                  )}
                  {siteSettings.site_name && siteSettings.site_name.trim().toLowerCase() !== 'saba al wadi' && (
                    <div className="flex flex-col justify-center">
                      <span className="font-serif text-base font-bold tracking-wider text-foreground leading-tight">
                        {siteSettings.site_name}
                      </span>
                      {siteSettings.site_tagline && (
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                          {siteSettings.site_tagline}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Profile & Account Card */}
              {mounted && user ? (
                <div className="p-3 bg-card rounded-xl border border-border space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/40 bg-accent flex items-center justify-center font-serif text-xs font-bold text-primary shrink-0">
                      {(user as any)?.avatar_url ? (
                        <img
                          src={
                            (user as any).avatar_url.startsWith('http')
                              ? (user as any).avatar_url
                              : `${API_BASE_URL}${(user as any).avatar_url}`
                          }
                          alt={user.first_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.first_name?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    {user.email === 'srabon@example.com' || user.email === 'admin@example.com' || (user as any).role === 'ADMIN' ? (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-bold text-primary hover:underline"
                      >
                        Admin
                      </Link>
                    ) : null}
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-foreground hover:text-primary font-medium"
                    >
                      My Orders &rarr;
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-rose-500 font-semibold hover:underline cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:opacity-95 transition"
                >
                  <User size={15} />
                  <span>Sign In / Register</span>
                </Link>
              )}

              {/* Combined Language & Currency Switcher in Mobile Drawer */}
              <CombinedLocaleSelector variant="mobile" />

              {/* Mobile Search Input with Suggestions */}
              <div className="space-y-2">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search abayas, niqabs..."
                    className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-primary text-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </form>

                {/* Mobile live suggestions */}
                {debouncedSearch.length >= 2 && (
                  <div className="bg-card border border-border rounded-lg overflow-hidden text-foreground">
                    <div className="p-2 border-b border-border bg-accent/30 text-xs text-muted-foreground uppercase font-semibold">
                      {searchLoading ? 'Searching...' : `Suggestions (${searchSuggestions.length})`}
                    </div>
                    {searchSuggestions.map((prod: any) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          router.push(`/product/${prod.slug}`);
                          setMobileMenuOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2 flex items-center gap-2.5 hover:bg-accent/40 border-b border-border/40 last:border-b-0 cursor-pointer"
                      >
                        <div className="h-8 w-8 rounded overflow-hidden bg-muted shrink-0">
                          <img
                            src={prod.thumbnail || (prod.images && prod.images[0]) || '/placeholder.png'}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{prod.name}</p>
                          <p className="text-xs font-bold text-primary">AED {prod.min_price}</p>
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        router.push(`/catalog?search=${encodeURIComponent(debouncedSearch)}`);
                        setMobileMenuOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full p-2 text-center text-xs text-primary font-semibold hover:underline bg-accent/10 cursor-pointer"
                    >
                      See all results &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Categorized Accordion */}
              <div className="space-y-1">
                <div className="text-xs uppercase font-bold text-muted-foreground tracking-widest px-2 py-1">
                  Categories & Collections
                </div>

                {categories
                  .filter((cat) => cat.show_in_navbar !== false)
                  .map((cat) => {
                  const hasChildren = cat.children && cat.children.length > 0;
                  const isExpanded = !!expandedMobileCats[cat.id];

                  return (
                    <div key={cat.id} className="border-b border-border/40 py-1">
                      <div className="flex items-center justify-between px-2 py-2">
                        <Link
                          href={`/catalog?category=${cat.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="font-medium text-sm text-foreground hover:text-primary transition"
                        >
                          {cat.name}
                        </Link>

                        {hasChildren && (
                          <button
                            onClick={() => toggleMobileCat(cat.id)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            aria-label={`Toggle ${cat.name} subcategories`}
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Subcategories Collapsible */}
                      {hasChildren && isExpanded && (
                        <div className="pl-4 pr-2 py-1 space-y-1 bg-accent/20 rounded-md">
                          {cat.children?.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/catalog?category=${sub.slug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-1.5 text-xs text-muted-foreground hover:text-primary transition"
                            >
                              &bull; {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Mobile Offers Link */}
                <Link
                  href="/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-2 py-3 text-amber-500 font-bold text-sm hover:underline"
                >
                  <span className="flex items-center gap-1.5">
                    <Flame size={15} /> Flash Sale (20% OFF)
                  </span>
                  <ArrowRight size={14} />
                </Link>

                {/* Mobile Blog Link */}
                <Link
                  href="/blogs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-2 py-3 text-foreground font-bold text-sm hover:text-primary transition"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={15} /> Modest Fashion Blog
                  </span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground space-y-1">
              <p className="font-serif font-bold text-foreground">
                {siteSettings.site_name || 'Saba Al Wadi'}
              </p>
              <p className="text-xs">Premium Modest Fashion &bull; UAE</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
