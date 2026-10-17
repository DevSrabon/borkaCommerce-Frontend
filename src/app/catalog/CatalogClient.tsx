'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PriceDisplay } from '../../components/PriceDisplay';
import {
  Tag,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ArrowUpDown,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';

export interface ProductVariant {
  id?: string;
  sku: string;
  price: number;
  compare_price: number | null;
  discounted_price: number;
  available_stock: number;
  attributes: { name: string; value: string }[];
  images?: string[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  thumbnail: string;
  min_price: number;
  min_original_price: number;
  discount_percentage?: number;
  on_sale?: boolean;
  active_offer_name?: string;
  categories: { id: string; name: string; slug: string }[];
  variants?: ProductVariant[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

const COLOR_MAP: Record<string, string> = {
  black: '#121212',
  white: '#f8fafc',
  beige: '#d9c4aa',
  cream: '#fef3c7',
  navy: '#1e293b',
  'navy blue': '#1e293b',
  blue: '#2563eb',
  maroon: '#7f1d1d',
  burgundy: '#831843',
  brown: '#78350f',
  olive: '#4d7c0f',
  green: '#15803d',
  grey: '#64748b',
  gray: '#64748b',
  gold: '#d97706',
  pink: '#f472b6',
  rose: '#fb7185',
  taupe: '#b45309',
  plum: '#701a75',
  teal: '#0f766e',
  charcoal: '#334155',
};

interface CatalogClientProps {
  initialProducts: CatalogProduct[];
  categories: CatalogCategory[];
  currentCategory?: string;
  currentSearch?: string;
  initialOnSale?: boolean;
}

export default function CatalogClient({
  initialProducts,
  categories,
  currentCategory = '',
  currentSearch = '',
  initialOnSale = false,
}: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mobile sidebar drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Compute overall min & max price from products
  const { globalMinPrice, globalMaxPrice } = useMemo(() => {
    if (initialProducts.length === 0) return { globalMinPrice: 0, globalMaxPrice: 1000 };
    const prices = initialProducts.map((p) => p.min_price);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return { globalMinPrice: min, globalMaxPrice: Math.max(max, min + 50) };
  }, [initialProducts]);

  // Read initial states from URL query parameters (preserves on reload / link sharing)
  const [catalogSearch, setCatalogSearch] = useState(() => searchParams.get('search') ?? currentSearch ?? '');
  const [debouncedCatalogSearch, setDebouncedCatalogSearch] = useState(() => (searchParams.get('search') ?? currentSearch ?? '').trim().toLowerCase());
  const [selectedCategory, setSelectedCategory] = useState<string>(() => searchParams.get('category') ?? currentCategory ?? '');
  const [saleOnly, setSaleOnly] = useState<boolean>(() => (searchParams.get('on_sale') ? searchParams.get('on_sale') === 'true' : initialOnSale));
  const [selectedColors, setSelectedColors] = useState<string[]>(() => searchParams.get('colors') ? searchParams.get('colors')!.split(',').filter(Boolean) : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => searchParams.get('sizes') ? searchParams.get('sizes')!.split(',').filter(Boolean) : []);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>(() => searchParams.get('fabrics') ? searchParams.get('fabrics')!.split(',').filter(Boolean) : []);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>(() => (searchParams.get('sort') as any) || 'featured');
  const [minPrice, setMinPrice] = useState<number>(() => {
    const p = searchParams.get('min_price');
    return p ? Number(p) : globalMinPrice;
  });
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const p = searchParams.get('max_price');
    return p ? Number(p) : globalMaxPrice;
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: false,
    colors: false,
    sizes: false,
    fabrics: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Dropdown filter popover states (Horizontal Dropdown Filters)
  const [openDropdown, setOpenDropdown] = useState<'category' | 'price' | 'color' | 'size' | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const dropdownBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownBarRef.current && !dropdownBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce catalog search by 300ms on change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCatalogSearch(catalogSearch.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [catalogSearch]);

  // Extract all unique available colors, sizes & fabrics across all variants
  const { availableColors, availableSizes, availableFabrics } = useMemo(() => {
    const colorCounts: Record<string, number> = {};
    const sizeCounts: Record<string, number> = {};
    const fabricCounts: Record<string, number> = {};

    initialProducts.forEach((prod) => {
      const prodColors = new Set<string>();
      const prodSizes = new Set<string>();
      const prodFabrics = new Set<string>();

      (prod.variants || []).forEach((v) => {
        (v.attributes || []).forEach((attr) => {
          const lowerName = attr.name.toLowerCase().trim();
          const val = attr.value.trim();
          if (!val) return;

          if (lowerName.includes('color') || lowerName.includes('colour')) {
            prodColors.add(val);
          } else if (lowerName.includes('size')) {
            prodSizes.add(val);
          } else if (lowerName.includes('fabric') || lowerName.includes('material')) {
            prodFabrics.add(val);
          }
        });
      });

      prodColors.forEach((c) => {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      });
      prodSizes.forEach((s) => {
        sizeCounts[s] = (sizeCounts[s] || 0) + 1;
      });
      prodFabrics.forEach((f) => {
        fabricCounts[f] = (fabricCounts[f] || 0) + 1;
      });
    });

    const colors = Object.keys(colorCounts).map((color) => ({
      name: color,
      count: colorCounts[color],
    }));

    // Natural sort sizes (numeric first: 50, 52, 54..., then XS, S, M, L, XL)
    const sizes = Object.keys(sizeCounts)
      .map((size) => ({
        name: size,
        count: sizeCounts[size],
      }))
      .sort((a, b) => {
        const numA = parseInt(a.name, 10);
        const numB = parseInt(b.name, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return a.name.localeCompare(b.name);
      });

    const fabrics = Object.keys(fabricCounts).map((fabric) => ({
      name: fabric,
      count: fabricCounts[fabric],
    }));

    return { availableColors: colors, availableSizes: sizes, availableFabrics: fabrics };
  }, [initialProducts]);

  // Centralized URL query sync: keep query params updated so reload (F5) keeps all filters
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();

    if (debouncedCatalogSearch) {
      params.set('search', debouncedCatalogSearch);
    }
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    if (saleOnly) {
      params.set('on_sale', 'true');
    }
    if (minPrice > globalMinPrice) {
      params.set('min_price', String(minPrice));
    }
    if (maxPrice < globalMaxPrice) {
      params.set('max_price', String(maxPrice));
    }
    if (selectedColors.length > 0) {
      params.set('colors', selectedColors.join(','));
    }
    if (selectedSizes.length > 0) {
      params.set('sizes', selectedSizes.join(','));
    }
    if (selectedFabrics.length > 0) {
      params.set('fabrics', selectedFabrics.join(','));
    }
    if (sortBy && sortBy !== 'featured') {
      params.set('sort', sortBy);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/catalog?${queryString}` : '/catalog';
    window.history.replaceState(null, '', newUrl);
  }, [
    debouncedCatalogSearch,
    selectedCategory,
    saleOnly,
    minPrice,
    maxPrice,
    selectedColors,
    selectedSizes,
    selectedFabrics,
    sortBy,
    globalMinPrice,
    globalMaxPrice,
  ]);

  // Listen for browser navigation (Back/Forward) to keep states in sync
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('search') || '';
      setCatalogSearch(s);
      setDebouncedCatalogSearch(s.trim().toLowerCase());
      setSelectedCategory(sp.get('category') || '');
      setSaleOnly(sp.get('on_sale') === 'true');
      setMinPrice(sp.get('min_price') ? Number(sp.get('min_price')) : globalMinPrice);
      setMaxPrice(sp.get('max_price') ? Number(sp.get('max_price')) : globalMaxPrice);
      setSelectedColors(sp.get('colors') ? sp.get('colors')!.split(',').filter(Boolean) : []);
      setSelectedSizes(sp.get('sizes') ? sp.get('sizes')!.split(',').filter(Boolean) : []);
      setSelectedFabrics(sp.get('fabrics') ? sp.get('fabrics')!.split(',').filter(Boolean) : []);
      setSortBy((sp.get('sort') as any) || 'featured');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [globalMinPrice, globalMaxPrice]);

  // Color selection toggler
  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  // Size selection toggler
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Fabric selection toggler
  const toggleFabric = (fabric: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(fabric) ? prev.filter((f) => f !== fabric) : [...prev, fabric]
    );
  };

  // Reset all filters and clean URL query
  const resetFilters = () => {
    setCatalogSearch('');
    setDebouncedCatalogSearch('');
    setSelectedCategory('');
    setSaleOnly(false);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedFabrics([]);
    setMinPrice(globalMinPrice);
    setMaxPrice(globalMaxPrice);
    setSortBy('featured');
    window.history.replaceState(null, '', '/catalog');
  };

  const hasActiveFilters =
    Boolean(debouncedCatalogSearch) ||
    Boolean(catalogSearch) ||
    Boolean(selectedCategory) ||
    saleOnly ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedFabrics.length > 0 ||
    minPrice > globalMinPrice ||
    maxPrice < globalMaxPrice;

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((prod) => {
        // Search filter with debounce
        if (debouncedCatalogSearch) {
          const matchName = prod.name.toLowerCase().includes(debouncedCatalogSearch);
          const matchDesc = (prod.short_description || '').toLowerCase().includes(debouncedCatalogSearch);
          const matchCat = prod.categories.some((c) => c.name.toLowerCase().includes(debouncedCatalogSearch));
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory) {
          const matchCat = prod.categories.some(
            (c) => c.slug === selectedCategory || c.slug.includes(selectedCategory)
          );
          if (!matchCat) return false;
        }

        // Sale filter
        if (saleOnly && !prod.on_sale) {
          return false;
        }

        // Price range filter
        if (prod.min_price < minPrice || prod.min_price > maxPrice) {
          return false;
        }

        // Color filter
        if (selectedColors.length > 0) {
          const hasSelectedColor = (prod.variants || []).some((v) =>
            (v.attributes || []).some(
              (attr) =>
                (attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour')) &&
                selectedColors.includes(attr.value.trim())
            )
          );
          if (!hasSelectedColor) return false;
        }

        // Size filter
        if (selectedSizes.length > 0) {
          const hasSelectedSize = (prod.variants || []).some((v) =>
            (v.attributes || []).some(
              (attr) =>
                attr.name.toLowerCase().includes('size') &&
                selectedSizes.includes(attr.value.trim())
            )
          );
          if (!hasSelectedSize) return false;
        }

        // Fabric filter
        if (selectedFabrics.length > 0) {
          const hasSelectedFabric = (prod.variants || []).some((v) =>
            (v.attributes || []).some(
              (attr) =>
                (attr.name.toLowerCase().includes('fabric') || attr.name.toLowerCase().includes('material')) &&
                selectedFabrics.includes(attr.value.trim())
            )
          );
          if (!hasSelectedFabric) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.min_price - b.min_price;
        if (sortBy === 'price-desc') return b.min_price - a.min_price;
        if (sortBy === 'discount') return (b.discount_percentage || 0) - (a.discount_percentage || 0);
        return 0; // default featured
      });
  }, [
    initialProducts,
    selectedCategory,
    saleOnly,
    minPrice,
    maxPrice,
    selectedColors,
    selectedSizes,
    sortBy,
  ]);

  // Infinite Scroll Pagination
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Reset pagination count when any filter or sort option changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    debouncedCatalogSearch,
    selectedCategory,
    saleOnly,
    selectedColors,
    selectedSizes,
    selectedFabrics,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // Visible sliced products
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = visibleCount < filteredProducts.length;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredProducts.length));
      setLoadingMore(false);
    }, 250);
  }, [loadingMore, hasMore, filteredProducts.length]);

  // IntersectionObserver for continuous infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '300px',
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  // Render Sidebar content (reused in desktop sidebar & mobile drawer)
  const renderSidebarContent = () => (
    <div className="space-y-3.5">
      {/* Header with Clear button */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="font-serif text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
          <Filter size={15} className="text-primary" />
          Filter Collection
        </h2>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={11} />
            Reset All
          </button>
        )}
      </div>

      {/* Special Deals Filter */}
      <div className="space-y-1.5 bg-accent/30 p-2.5 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-primary uppercase flex items-center gap-1.5">
            <Tag size={12} /> Exclusive Deals
          </span>
          <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
            HOT
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSaleOnly((prev) => !prev)}
          className={`w-full flex items-center justify-between text-xs font-semibold px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
            saleOnly
              ? 'bg-red-500/15 border-red-500/40 text-red-500 ring-1 ring-red-500/30'
              : 'bg-card border-border hover:border-primary/40 text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">🔥 Flash Sale &amp; Offers</span>
          <div
            className={`w-4 h-4 rounded flex items-center justify-center border text-xs ${
              saleOnly ? 'bg-red-600 border-red-600 text-white' : 'border-border'
            }`}
          >
            {saleOnly && <Check size={11} />}
          </div>
        </button>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2 pt-1.5 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Price Range (AED)
          </h3>
          <span className="text-xs font-mono font-medium text-primary">
            {minPrice} - {maxPrice} AED
          </span>
        </div>

        {/* Slider */}
        <div className="space-y-1 px-0.5">
          <input
            type="range"
            min={globalMinPrice}
            max={globalMaxPrice}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
          />
        </div>

        {/* Inputs min & max */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase">Min AED</span>
            <input
              type="number"
              min={globalMinPrice}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.max(globalMinPrice, Number(e.target.value)))}
              className="w-full px-2 py-1 bg-background border border-border rounded-md text-foreground font-mono text-xs focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase">Max AED</span>
            <input
              type="number"
              min={minPrice}
              max={globalMaxPrice}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.min(globalMaxPrice, Number(e.target.value)))}
              className="w-full px-2 py-1 bg-background border border-border rounded-md text-foreground font-mono text-xs focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Color Filter */}
      {availableColors.length > 0 && (
        <div className="space-y-2 pt-1.5 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <span>Colors</span>
              <span className="text-muted-foreground/60 font-mono">({availableColors.length})</span>
            </h3>
            {selectedColors.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedColors([])}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                Clear ({selectedColors.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(expandedSections.colors ? availableColors : availableColors.slice(0, 6)).map((color) => {
              const isSelected = selectedColors.includes(color.name);
              const hex = COLOR_MAP[color.name.toLowerCase()] || '#475569';
              const isLight = color.name.toLowerCase() === 'white' || color.name.toLowerCase() === 'cream';

              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggleColor(color.name)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition cursor-pointer border ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                      : 'border-border bg-card hover:bg-accent text-foreground/80'
                  }`}
                  title={`${color.name} (${color.count})`}
                >
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 border ${
                      isLight ? 'border-zinc-400' : 'border-black/30'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                  <span>{color.name}</span>
                  <span className="text-[10px] text-muted-foreground">({color.count})</span>
                </button>
              );
            })}
          </div>

          {availableColors.length > 6 && (
            <button
              type="button"
              onClick={() => toggleSection('colors')}
              className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline cursor-pointer pt-0.5"
            >
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${expandedSections.colors ? 'rotate-180' : ''}`}
              />
              <span>
                {expandedSections.colors
                  ? 'Show Less'
                  : `+ ${availableColors.length - 6} More Colors`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Size Filter */}
      {availableSizes.length > 0 && (
        <div className="space-y-2 pt-1.5 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <span>Sizes</span>
              <span className="text-muted-foreground/60 font-mono">({availableSizes.length})</span>
            </h3>
            {selectedSizes.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSizes([])}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                Clear ({selectedSizes.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(expandedSections.sizes ? availableSizes : availableSizes.slice(0, 6)).map((size) => {
              const isSelected = selectedSizes.includes(size.name);

              return (
                <button
                  key={size.name}
                  type="button"
                  onClick={() => toggleSize(size.name)}
                  className={`py-1 px-1 text-center rounded-md border text-xs font-medium transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary/40 shadow-xs'
                      : 'border-border bg-card hover:bg-accent text-foreground/80'
                  }`}
                >
                  <span>{size.name}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {size.count} pcs
                  </span>
                </button>
              );
            })}
          </div>

          {availableSizes.length > 6 && (
            <button
              type="button"
              onClick={() => toggleSection('sizes')}
              className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline cursor-pointer pt-0.5"
            >
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${expandedSections.sizes ? 'rotate-180' : ''}`}
              />
              <span>
                {expandedSections.sizes
                  ? 'Show Less'
                  : `+ ${availableSizes.length - 6} More Sizes`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Fabric Filter */}
      {availableFabrics.length > 0 && (
        <div className="space-y-2 pt-1.5 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <span>Fabric</span>
              <span className="text-muted-foreground/60 font-mono">({availableFabrics.length})</span>
            </h3>
            {selectedFabrics.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFabrics([])}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                Clear ({selectedFabrics.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {(expandedSections.fabrics ? availableFabrics : availableFabrics.slice(0, 5)).map((fabric) => {
              const isSelected = selectedFabrics.includes(fabric.name);

              return (
                <button
                  key={fabric.name}
                  type="button"
                  onClick={() => toggleFabric(fabric.name)}
                  className={`px-2 py-1 rounded-md border text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                      : 'border-border bg-card hover:bg-accent text-foreground/80'
                  }`}
                >
                  <span>{fabric.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">({fabric.count})</span>
                </button>
              );
            })}
          </div>

          {availableFabrics.length > 5 && (
            <button
              type="button"
              onClick={() => toggleSection('fabrics')}
              className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline cursor-pointer pt-0.5"
            >
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${expandedSections.fabrics ? 'rotate-180' : ''}`}
              />
              <span>
                {expandedSections.fabrics
                  ? 'Show Less'
                  : `+ ${availableFabrics.length - 5} More Fabrics`}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="space-y-2 pt-1.5 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <span>Categories</span>
            <span className="text-muted-foreground/60 font-mono">({categories.length})</span>
          </h3>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('')}
            className={`text-left px-2 py-1 rounded-md transition font-medium cursor-pointer ${
              !selectedCategory
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-foreground/80 hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            All Collections
          </button>
          {(expandedSections.categories ? categories : categories.slice(0, 5)).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`text-left px-2 py-1 rounded-md transition font-medium cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-foreground/80 hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {categories.length > 5 && (
          <button
            type="button"
            onClick={() => toggleSection('categories')}
            className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline cursor-pointer pt-0.5"
          >
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${expandedSections.categories ? 'rotate-180' : ''}`}
            />
            <span>
              {expandedSections.categories
                ? 'Show Less'
                : `+ ${categories.length - 5} More Categories`}
            </span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-3 sm:gap-4 md:gap-5 w-full">
      {/* Optional Desktop Sidebar */}
      {showSidebar && (
        <aside className="hidden md:block w-64 shrink-0 sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain bg-card/70 backdrop-blur-md p-3.5 rounded-xl border border-border shadow-xs scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground pr-2 animate-in fade-in slide-in-from-left duration-200">
          {renderSidebarContent()}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-1.5 sm:space-y-2.5 md:space-y-3 min-w-0">
        {/* Page Title & Desktop Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 sm:gap-3 border-b border-border/60 pb-1.5 sm:pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                {saleOnly
                  ? '🔥 Flash Sale & Offers'
                  : selectedCategory
                  ? `${
                      categories.find((c) => c.slug === selectedCategory)?.name ||
                      selectedCategory
                    } Collection`
                  : 'Shop Products'}
              </h1>
              {saleOnly && (
                <span className="text-[11px] bg-red-500/10 text-red-500 border border-red-500/30 font-bold px-1.5 py-0.5 rounded">
                  Active Sale
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          {/* Desktop Search & Sort */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Catalog Live Search Bar (Debounced On-Change) */}
            <div className="relative w-56 sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full text-xs bg-card border border-border rounded-lg pl-7 pr-6 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-xs">Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-card border border-border rounded-lg px-2.5 py-1.5 pr-7 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs"
                >
                  <option value="featured">Featured / Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="discount">Biggest Discount</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Dropdown Filter Bar */}
        <div
          ref={dropdownBarRef}
          className={`bg-card/95 backdrop-blur-md border border-border rounded-xl p-1.5 sm:p-2 shadow-xs flex flex-wrap items-center justify-between gap-1 sm:gap-1.5 relative transition-all ${
            openDropdown ? 'z-50' : 'z-20'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {/* 1. Category Dropdown */}
            <div className={`relative ${openDropdown === 'category' ? 'z-50' : 'z-10'}`}>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  selectedCategory
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                    : 'bg-background hover:bg-accent border-border text-foreground'
                }`}
              >
                <span>Category: {selectedCategory ? categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory : 'All'}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'category' && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl p-2.5 space-y-1 animate-in fade-in duration-150">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase px-2 py-1 border-b border-border mb-1">
                    Select Collection
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('');
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                        !selectedCategory ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <span>All Collections</span>
                      {!selectedCategory && <Check size={13} />}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.slug);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                          selectedCategory === cat.slug ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-accent text-foreground'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {selectedCategory === cat.slug && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Price Range Dropdown */}
            <div className={`relative ${openDropdown === 'price' ? 'z-50' : 'z-10'}`}>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  minPrice > globalMinPrice || maxPrice < globalMaxPrice
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                    : 'bg-background hover:bg-accent border-border text-foreground'
                }`}
              >
                <span>Price: {minPrice} - {maxPrice} AED</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === 'price' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'price' && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl p-4 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">Price Range</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice(globalMinPrice);
                        setMaxPrice(globalMaxPrice);
                      }}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={globalMinPrice}
                      max={globalMaxPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                      <span>{globalMinPrice} AED</span>
                      <span className="font-bold text-primary">{maxPrice} AED</span>
                      <span>{globalMaxPrice} AED</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">Min AED</span>
                      <input
                        type="number"
                        min={globalMinPrice}
                        max={maxPrice}
                        value={minPrice}
                        onChange={(e) => setMinPrice(Math.max(globalMinPrice, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-background border border-border rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block mb-1">Max AED</span>
                      <input
                        type="number"
                        min={minPrice}
                        max={globalMaxPrice}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Math.min(globalMaxPrice, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-background border border-border rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Color Dropdown */}
            {availableColors.length > 0 && (
              <div className={`relative ${openDropdown === 'color' ? 'z-50' : 'z-10'}`}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    selectedColors.length > 0
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                      : 'bg-background hover:bg-accent border-border text-foreground'
                  }`}
                >
                  <span>Color {selectedColors.length > 0 ? `(${selectedColors.length})` : ''}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === 'color' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'color' && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-72 bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl p-3.5 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">Filter by Color</span>
                      {selectedColors.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedColors([])}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Clear ({selectedColors.length})
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                      {availableColors.map((color) => {
                        const isSelected = selectedColors.includes(color.name);
                        const hex = COLOR_MAP[color.name.toLowerCase()] || '#475569';
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => toggleColor(color.name)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition cursor-pointer border ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary font-bold'
                                : 'border-border bg-background hover:bg-accent text-foreground'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full shrink-0 border border-black/20" style={{ backgroundColor: hex }} />
                            <span>{color.name}</span>
                            <span className="text-[10px] text-muted-foreground">({color.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Size Dropdown */}
            {availableSizes.length > 0 && (
              <div className={`relative ${openDropdown === 'size' ? 'z-50' : 'z-10'}`}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === 'size' ? null : 'size')}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    selectedSizes.length > 0
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                      : 'bg-background hover:bg-accent border-border text-foreground'
                  }`}
                >
                  <span>Size {selectedSizes.length > 0 ? `(${selectedSizes.length})` : ''}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === 'size' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'size' && (
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-card dark:bg-zinc-950 border border-border rounded-xl shadow-2xl p-3.5 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase">Filter by Size</span>
                      {selectedSizes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSizes([])}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Clear ({selectedSizes.length})
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {availableSizes.map((size) => {
                        const isSelected = selectedSizes.includes(size.name);
                        return (
                          <button
                            key={size.name}
                            type="button"
                            onClick={() => toggleSize(size.name)}
                            className={`py-1.5 px-2 text-center rounded-lg text-xs font-mono font-semibold border transition cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                                : 'bg-background hover:bg-accent border-border text-foreground'
                            }`}
                          >
                            {size.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. Flash Sale Pill */}
            <button
              type="button"
              onClick={() => setSaleOnly(!saleOnly)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                saleOnly
                  ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                  : 'bg-background hover:bg-accent border-border text-foreground'
              }`}
            >
              <span>🔥 Flash Sale</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1 px-1.5 py-0.5 cursor-pointer font-medium"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Sidebar View Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              showSidebar
                ? 'bg-accent border-border text-foreground font-bold'
                : 'bg-background hover:bg-accent border-border text-muted-foreground hover:text-foreground'
            }`}
            title="Toggle between dropdown-only mode and vertical sidebar"
          >
            <SlidersHorizontal size={13} className={showSidebar ? 'text-primary' : ''} />
            <span>{showSidebar ? 'Hide Vertical Sidebar' : 'Show Vertical Sidebar'}</span>
          </button>
        </div>

        {/* Mobile Screen: Always Sticky Search & Filter Toolbar */}
        <div className="md:hidden sticky top-20 z-20 bg-background/95 backdrop-blur-md -mx-3 sm:-mx-4 px-3 sm:px-4 py-1.5 border-y border-border shadow-xs space-y-1">
          {/* Row 1: Search Input (flex-1) + Filters Button (shrink-0) */}
          <div className="flex items-center gap-1.5 w-full">
            <div className="relative flex-1 min-w-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full text-xs bg-card border border-border rounded-lg pl-7 pr-6 py-1 sm:py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Mobile Filters Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 sm:py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-accent transition shadow-xs cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={13} className="text-primary" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          </div>

          {/* Row 2: Items Count + Compact Sort Dropdown */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
              Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} items
            </span>

            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-card border border-border rounded-md px-2 py-0.5 sm:py-1 pr-6 text-[11px] sm:text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs"
              >
                <option value="featured">Featured / Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 px-2 sm:px-2.5 bg-muted/20 border border-border rounded-lg text-xs">
            <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
              Active:
            </span>

            {debouncedCatalogSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-md text-foreground font-medium text-[11px] sm:text-xs">
                Search: &quot;{debouncedCatalogSearch}&quot;
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearch('');
                    setDebouncedCatalogSearch('');
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-md text-foreground font-medium text-[11px] sm:text-xs">
                Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {saleOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-md font-medium text-[11px] sm:text-xs">
                Flash Sale Only
                <button
                  type="button"
                  onClick={() => setSaleOnly(false)}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {(minPrice > globalMinPrice || maxPrice < globalMaxPrice) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-md text-foreground font-medium text-[11px] sm:text-xs">
                Price: {minPrice} - {maxPrice} AED
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice(globalMinPrice);
                    setMaxPrice(globalMaxPrice);
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {selectedColors.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-md text-foreground font-medium text-[11px] sm:text-xs"
              >
                Color: {color}
                <button
                  type="button"
                  onClick={() => toggleColor(color)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            ))}

            {selectedSizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-md text-foreground font-medium text-[11px] sm:text-xs"
              >
                Size: {size}
                <button
                  type="button"
                  onClick={() => toggleSize(size)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            ))}

            {selectedFabrics.map((fabric) => (
              <span
                key={fabric}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-card border border-border rounded-md text-foreground font-medium text-[11px] sm:text-xs"
              >
                Fabric: {fabric}
                <button
                  type="button"
                  onClick={() => toggleFabric(fabric)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={11} />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] sm:text-xs text-red-500 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Product Grid Area */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl space-y-2.5 bg-card/20">
            <p className="text-muted-foreground text-sm font-light">
              No abayas match your selected filter criteria.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${showSidebar ? 'lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'} gap-3.5 sm:gap-4 md:gap-5`}>
            {visibleProducts.map((prod) => {
              const discountPct =
                prod.discount_percentage ||
                (prod.min_original_price > prod.min_price
                  ? Math.round(
                      ((prod.min_original_price - prod.min_price) / prod.min_original_price) * 100
                    )
                  : 0);

              return (
                <div
                  key={prod.id}
                  className="group flex flex-col border border-border bg-card rounded-xl overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <Link
                    href={`/product/${prod.slug}`}
                    className="relative h-96 overflow-hidden bg-zinc-100 block"
                  >
                    <img
                      src={prod.thumbnail}
                      alt={prod.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                    />
                    {discountPct > 0 && (
                      <span className="absolute left-3 top-3 bg-red-600 text-white font-bold text-xs px-2.5 py-1 rounded shadow-md tracking-wider">
                        {discountPct}% OFF
                      </span>
                    )}
                    {prod.active_offer_name && (
                      <span className="absolute right-3 top-3 bg-black/75 backdrop-blur-sm text-primary font-bold text-xs px-2 py-0.5 rounded border border-primary/30">
                        {prod.active_offer_name}
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-1.5">
                      <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition">
                        <Link href={`/product/${prod.slug}`}>{prod.name}</Link>
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-light">
                        {prod.short_description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <PriceDisplay
                        aedPrice={prod.min_price}
                        aedCompare={
                          prod.min_original_price > prod.min_price
                            ? prod.min_original_price
                            : null
                        }
                      />
                      <Link
                        href={`/product/${prod.slug}`}
                        className="text-xs text-primary font-semibold border-b border-primary hover:text-foreground hover:border-foreground transition"
                      >
                        Shop Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Sentinel, Loading Spinner, and End of Collection Status */}
        {filteredProducts.length > 0 && (
          <div
            ref={observerTarget}
            className="py-10 flex flex-col items-center justify-center space-y-4"
          >
            {loadingMore && (
              <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-accent/60 border border-border text-xs text-muted-foreground animate-pulse shadow-xs">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Loading more exclusive abayas...</span>
              </div>
            )}

            {!hasMore && filteredProducts.length > PAGE_SIZE && (
              <div className="flex flex-col items-center gap-2 text-center py-6 text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Check size={16} />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  All {filteredProducts.length} products loaded
                </p>
                <p className="text-xs text-muted-foreground font-light">
                  You have viewed all matching pieces in this collection.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Filters Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs bg-card border-l border-border h-full flex flex-col shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h2 className="font-serif text-lg font-bold">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {renderSidebarContent()}

            <div className="pt-6 mt-4 border-t border-border sticky bottom-0 bg-card">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs uppercase tracking-wider transition shadow-sm"
              >
                View {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
