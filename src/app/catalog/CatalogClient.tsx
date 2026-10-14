'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PriceDisplay } from '../../components/PriceDisplay';
import {
  Sparkles,
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

  // Active filter states
  const [catalogSearch, setCatalogSearch] = useState(currentSearch);
  const [debouncedCatalogSearch, setDebouncedCatalogSearch] = useState(currentSearch.trim().toLowerCase());
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory);
  const [saleOnly, setSaleOnly] = useState<boolean>(initialOnSale);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    categories: false,
    colors: false,
    sizes: false,
    fabrics: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>('featured');

  // Debounce catalog search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCatalogSearch(catalogSearch.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [catalogSearch]);

  // Compute overall min & max price from products
  const { globalMinPrice, globalMaxPrice } = useMemo(() => {
    if (initialProducts.length === 0) return { globalMinPrice: 0, globalMaxPrice: 1000 };
    const prices = initialProducts.map((p) => p.min_price);
    const min = Math.floor(Math.min(...prices));
    const max = Math.ceil(Math.max(...prices));
    return { globalMinPrice: min, globalMaxPrice: Math.max(max, min + 50) };
  }, [initialProducts]);

  const [minPrice, setMinPrice] = useState<number>(globalMinPrice);
  const [maxPrice, setMaxPrice] = useState<number>(globalMaxPrice);

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

  // Sync category & sale from URL params when navigation occurs
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const sale = searchParams.get('on_sale') === 'true';
    setSelectedCategory(cat);
    setSaleOnly(sale);
  }, [searchParams]);

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

  // Reset all filters
  const resetFilters = () => {
    setCatalogSearch('');
    setSelectedCategory('');
    setSaleOnly(false);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedFabrics([]);
    setMinPrice(globalMinPrice);
    setMaxPrice(globalMaxPrice);
    setSortBy('featured');
    router.push('/catalog');
  };

  const hasActiveFilters =
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
    <div className="space-y-6">
      {/* Header with Clear button */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
          <Filter size={16} className="text-primary" />
          Filter Collection
        </h2>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={12} />
            Reset All
          </button>
        )}
      </div>

      {/* Special Deals Filter */}
      <div className="space-y-2 bg-accent/30 p-3.5 rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-primary uppercase flex items-center gap-1.5">
            <Sparkles size={13} /> Exclusive Deals
          </span>
          <span className="text-xs bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
            HOT
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSaleOnly((prev) => !prev)}
          className={`w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border transition cursor-pointer ${
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
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Price Range (AED)
          </h3>
          <span className="text-xs font-mono font-medium text-primary">
            {minPrice} - {maxPrice} AED
          </span>
        </div>

        {/* Slider */}
        <div className="space-y-2 px-1">
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
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase">Min AED</span>
            <input
              type="number"
              min={globalMinPrice}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.max(globalMinPrice, Number(e.target.value)))}
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground font-mono text-xs focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase">Max AED</span>
            <input
              type="number"
              min={minPrice}
              max={globalMaxPrice}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.min(globalMaxPrice, Number(e.target.value)))}
              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground font-mono text-xs focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Color Filter */}
      {availableColors.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
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

          <div className="flex flex-wrap gap-2">
            {(expandedSections.colors ? availableColors : availableColors.slice(0, 6)).map((color) => {
              const isSelected = selectedColors.includes(color.name);
              const hex = COLOR_MAP[color.name.toLowerCase()] || '#475569';
              const isLight = color.name.toLowerCase() === 'white' || color.name.toLowerCase() === 'cream';

              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggleColor(color.name)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition cursor-pointer border ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                      : 'border-border bg-card hover:bg-accent text-foreground/80'
                  }`}
                  title={`${color.name} (${color.count})`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full shrink-0 border ${
                      isLight ? 'border-zinc-400' : 'border-black/30'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                  <span>{color.name}</span>
                  <span className="text-xs text-muted-foreground">({color.count})</span>
                </button>
              );
            })}
          </div>

          {availableColors.length > 6 && (
            <button
              type="button"
              onClick={() => toggleSection('colors')}
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer pt-0.5"
            >
              <ChevronDown
                size={13}
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
        <div className="space-y-3 pt-2 border-t border-border">
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

          <div className="grid grid-cols-3 gap-2">
            {(expandedSections.sizes ? availableSizes : availableSizes.slice(0, 6)).map((size) => {
              const isSelected = selectedSizes.includes(size.name);

              return (
                <button
                  key={size.name}
                  type="button"
                  onClick={() => toggleSize(size.name)}
                  className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary/40 shadow-xs'
                      : 'border-border bg-card hover:bg-accent text-foreground/80'
                  }`}
                >
                  <span>{size.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
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
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer pt-0.5"
            >
              <ChevronDown
                size={13}
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
        <div className="space-y-3 pt-2 border-t border-border">
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

          <div className="flex flex-wrap gap-1.5">
            {(expandedSections.fabrics ? availableFabrics : availableFabrics.slice(0, 5)).map((fabric) => {
              const isSelected = selectedFabrics.includes(fabric.name);

              return (
                <button
                  key={fabric.name}
                  type="button"
                  onClick={() => toggleFabric(fabric.name)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-xs'
                      : 'border-border bg-card hover:bg-accent text-foreground/80'
                  }`}
                >
                  <span>{fabric.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">({fabric.count})</span>
                </button>
              );
            })}
          </div>

          {availableFabrics.length > 5 && (
            <button
              type="button"
              onClick={() => toggleSection('fabrics')}
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer pt-0.5"
            >
              <ChevronDown
                size={13}
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
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <span>Categories</span>
            <span className="text-muted-foreground/60 font-mono">({categories.length})</span>
          </h3>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('');
                router.push(saleOnly ? '/catalog?on_sale=true' : '/catalog');
              }}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              router.push(saleOnly ? '/catalog?on_sale=true' : '/catalog');
            }}
            className={`text-left px-2.5 py-1.5 rounded-lg transition font-medium cursor-pointer ${
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
              onClick={() => {
                setSelectedCategory(cat.slug);
                router.push(
                  `/catalog?category=${cat.slug}${saleOnly ? '&on_sale=true' : ''}`
                );
              }}
              className={`text-left px-2.5 py-1.5 rounded-lg transition font-medium cursor-pointer ${
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
            className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline cursor-pointer pt-0.5"
          >
            <ChevronDown
              size={13}
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
    <div className="flex flex-col md:flex-row gap-8 w-full">
      {/* Desktop Sidebar: Independently scrollable sticky container */}
      <aside className="hidden md:block w-72 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border shadow-xs scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground pr-2.5">
        {renderSidebarContent()}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Top Filter & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-foreground">
                {saleOnly
                  ? '🔥 Flash Sale & Offers'
                  : selectedCategory
                  ? `${
                      categories.find((c) => c.slug === selectedCategory)?.name ||
                      selectedCategory
                    } Collection`
                  : 'Shop Catalog'}
              </h1>
              {saleOnly && (
                <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/30 font-bold px-2 py-0.5 rounded">
                  Active Sale
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Catalog Live Search Bar with Debounce */}
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full text-xs bg-card border border-border rounded-lg pl-8 pr-7 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-accent transition shadow-xs cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-primary" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground hidden sm:inline">Sort:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-card border border-border rounded-lg px-3 py-2 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs"
                >
                  <option value="featured">Featured / Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="discount">Biggest Discount</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 border border-border rounded-xl text-xs">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Active:
            </span>

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-card border border-border rounded-lg text-foreground font-medium">
                Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                <button
                  onClick={() => setSelectedCategory('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {saleOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg font-medium">
                Flash Sale Only
                <button onClick={() => setSaleOnly(false)} className="hover:text-red-700">
                  <X size={12} />
                </button>
              </span>
            )}

            {(minPrice > globalMinPrice || maxPrice < globalMaxPrice) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-card border border-border rounded-lg text-foreground font-medium">
                Price: {minPrice} - {maxPrice} AED
                <button
                  onClick={() => {
                    setMinPrice(globalMinPrice);
                    setMaxPrice(globalMaxPrice);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {selectedColors.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-card border border-border rounded-lg text-foreground font-medium"
              >
                Color: {color}
                <button onClick={() => toggleColor(color)} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              </span>
            ))}

            {selectedSizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-card border border-border rounded-lg text-foreground font-medium"
              >
                Size: {size}
                <button onClick={() => toggleSize(size)} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              </span>
            ))}

            <button
              onClick={resetFilters}
              className="text-xs text-red-500 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Product Grid Area */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl space-y-3 bg-card/20">
            <p className="text-muted-foreground text-sm font-light">
              No abayas match your selected filter criteria.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition cursor-pointer shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
