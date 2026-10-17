'use client';

import { API_BASE_URL } from '@/config/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Tag,
  Box,
  Layers,
  Video,
  Calendar,
  DollarSign,
  Copy,
  Check,
  Star,
  ShieldCheck,
  Package,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Globe,
  Clock,
  CheckCircle2,
  ChevronRight,
  Share2,
  Info,
} from 'lucide-react';

// Helper to convert any YouTube URL into an embed link
export function getYoutubeEmbedUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&color=white`;
  }
  return '';
}

interface ProductImage {
  id?: string;
  image_url: string;
  alt_text?: string;
  is_thumbnail: boolean;
}

interface AttributeValue {
  id: string;
  value: string;
  attribute: {
    id: string;
    name: string;
  };
}

interface VariantAttribute {
  id: string;
  attribute_value: AttributeValue;
}

interface Variant {
  id: string;
  sku: string;
  price: number;
  compare_price: number | null;
  attributes: VariantAttribute[];
  inventories: {
    id: string;
    quantity: number;
    available_quantity?: number;
    reserved_quantity?: number;
    warehouse?: { name: string };
  }[];
  images?: { id?: string; image_url: string }[];
}

interface CategoryRef {
  id: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  status: string;
  created_at: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface SingleProduct {
  id: string;
  product_number?: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  status: string;
  is_cod_allowed: boolean;
  is_featured?: boolean;
  video_url?: string | null;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  tags?: string;
  sku_prefix?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  images: ProductImage[];
  variants: Variant[];
  product_categories: CategoryRef[];
  related_categories: CategoryRef[];
  reviews: Review[];
}

export default function AdminSingleProductPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const productId = rawId ? decodeURIComponent(rawId) : '';
  const token = useSelector((state: RootState) => state.auth.token);

  const [product, setProduct] = useState<SingleProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'variants' | 'media' | 'seo' | 'reviews'>('details');

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Product not found in catalog');
        throw new Error(`Failed to load product details (status ${res.status})`);
      }
      const data = await res.json();
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Error loading product');
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleTogglePublish = async () => {
    if (!product) return;
    setActionLoading(true);
    const newStatus = product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProduct((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (_) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        router.push('/admin/products');
      }
    } catch (_) {
    } finally {
      setActionLoading(false);
    }
  };

  const copyStorefrontLink = () => {
    if (!product) return;
    const url = `${window.location.origin}/product/${product.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const copyProductIdentifier = () => {
    if (!product) return;
    const textToCopy = product.product_number || product.variants?.[0]?.sku || product.slug;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 w-full flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={18} className="text-primary" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Loading Product Details</p>
          <p className="text-xs text-muted-foreground font-light">Retrieving single product data from admin API...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full space-y-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-medium"
        >
          <ArrowLeft size={14} /> Back to Products Catalog
        </Link>
        <div className="p-8 bg-card border border-red-500/30 rounded-2xl space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Product Not Found</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {error || `Unable to locate a product with identifier "${productId}". It may have been archived or deleted.`}
            </p>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={fetchProduct}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition shadow-sm cursor-pointer"
            >
              Retry Loading
            </button>
            <Link
              href="/admin/products"
              className="px-4 py-2 border border-border bg-card hover:bg-accent text-foreground rounded-lg text-xs font-semibold transition"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Derived stats
  const totalStock = product.variants?.reduce((acc, v) => {
    const vStock = v.inventories?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
    return acc + vStock;
  }, 0) || 0;

  const prices = product.variants?.map((v) => Number(v.price)).filter((p) => !isNaN(p)) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const comparePrices = product.variants?.map((v) => Number(v.compare_price)).filter((p) => !isNaN(p) && p > 0) || [];
  const maxComparePrice = comparePrices.length > 0 ? Math.max(...comparePrices) : null;
  const discountPercent = maxComparePrice && maxComparePrice > minPrice
    ? Math.round(((maxComparePrice - minPrice) / maxComparePrice) * 100)
    : 0;

  const videoEmbed = getYoutubeEmbedUrl(product.video_url || undefined);
  const activeImage = product.images?.[activeImageIndex]?.image_url || product.images?.[0]?.image_url || '';
  const resolvedActiveImg = activeImage
    ? activeImage.startsWith('http')
      ? activeImage
      : `${API_BASE_URL}${activeImage.startsWith('/') ? '' : '/'}${activeImage}`
    : '';

  const avgRating = product.reviews?.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      {/* ── Top Navigation & Breadcrumbs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition font-medium"
          >
            <ArrowLeft size={14} /> Catalog
          </Link>
          <ChevronRight size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground">Admin Single Product</span>
          <ChevronRight size={12} className="text-muted-foreground" />
          <span className="font-mono text-primary font-bold">
            {product.product_number || product.slug}
          </span>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit Product Button */}
          <Link
            href={`/admin/products?edit=${product.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer"
            title="Edit this product in catalog manager"
          >
            <Edit2 size={13} />
            <span>Edit Product</span>
          </Link>

          {/* Customer Live Storefront View */}
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg transition shadow-2xs cursor-pointer"
            title="Open Live Product View on Storefront"
          >
            <Eye size={14} />
            <span>Live View</span>
            <ExternalLink size={12} className="opacity-80" />
          </Link>

          {/* Copy URL */}
          <button
            type="button"
            onClick={copyStorefrontLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-accent border border-border text-foreground text-xs font-semibold rounded-lg transition cursor-pointer"
            title="Copy Public Storefront URL"
          >
            {copiedSlug ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiedSlug ? 'Copied!' : 'Share URL'}</span>
          </button>

          {/* Toggle Publish / Draft */}
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleTogglePublish}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition cursor-pointer ${
              product.status === 'PUBLISHED'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
            }`}
          >
            {product.status === 'PUBLISHED' ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{product.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleDeleteProduct}
            className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
            title="Permanently Delete this Product"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Product Header Banner ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {product.product_number && (
              <span className="px-2.5 py-0.5 rounded-md font-mono font-bold bg-primary/10 border border-primary/20 text-primary">
                {product.product_number}
              </span>
            )}
            <span
              className={`px-2.5 py-0.5 rounded-md font-semibold border ${
                product.status === 'PUBLISHED'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              }`}
            >
              {product.status}
            </span>
            {product.is_cod_allowed ? (
              <span className="px-2.5 py-0.5 rounded-md font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck size={12} /> COD Available
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Prepaid Only (No COD)
              </span>
            )}
            {product.is_featured && (
              <span className="px-2.5 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <Sparkles size={12} /> Featured
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="font-mono">
              Slug: <strong className="text-foreground">{product.slug}</strong>
            </span>
            {product.product_number && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={copyProductIdentifier}
                  className="inline-flex items-center gap-1 font-mono hover:text-primary transition cursor-pointer"
                  title="Click to copy Product No"
                >
                  <span>Product No: <strong className="text-foreground">{product.product_number}</strong></span>
                  {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                </button>
              </>
            )}
            {product.variants?.[0]?.sku && (
              <>
                <span>•</span>
                <span className="font-mono">
                  SKU: <strong className="text-foreground">{product.variants[0].sku}</strong>
                </span>
              </>
            )}
            {product.sku_prefix && (
              <>
                <span>•</span>
                <span>Prefix: <strong className="font-mono text-foreground">{product.sku_prefix}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Top 4 Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 lg:w-auto w-full">
          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <DollarSign size={12} className="text-primary" /> Price
            </span>
            <p className="text-sm font-bold text-foreground">
              AED {minPrice}
              {maxPrice > minPrice && <span className="text-xs text-muted-foreground font-normal"> - {maxPrice}</span>}
            </p>
            {discountPercent > 0 && (
              <span className="text-[10px] font-semibold text-emerald-500">
                Save {discountPercent}%
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Package size={12} className="text-primary" /> Stock
            </span>
            <p className={`text-sm font-bold ${
              totalStock <= 0 ? 'text-red-500' : totalStock <= 5 ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {totalStock} units
            </p>
            <span className="text-[10px] text-muted-foreground">
              {totalStock <= 0 ? 'Out of stock' : totalStock <= 5 ? 'Low stock alert' : 'In stock'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Layers size={12} className="text-primary" /> Variants
            </span>
            <p className="text-sm font-bold text-foreground">
              {product.variants?.length || 0}
            </p>
            <span className="text-[10px] text-muted-foreground">SKU options</span>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Star size={12} className="text-amber-500" /> Rating
            </span>
            <p className="text-sm font-bold text-foreground">
              {avgRating ? `${avgRating} ★` : '—'}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {product.reviews?.length || 0} review{(product.reviews?.length || 0) === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border text-xs overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Box size={14} /> Overview &amp; Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('variants')}
          className={`px-4 py-2.5 font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'variants'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={14} /> Variants &amp; Inventory ({product.variants?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2.5 font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'media'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye size={14} /> Media Gallery ({product.images?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`px-4 py-2.5 font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'seo'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe size={14} /> SEO &amp; Meta
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star size={14} /> Reviews ({product.reviews?.length || 0})
        </button>
      </div>

      {/* ── TAB 1: DETAILS & OVERVIEW ── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Left: 8 Cols */}
          <div className="lg:col-span-8 space-y-6">
            {/* Media Highlight */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Box size={16} className="text-primary" />
                  <span>Product Media Showcase</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View All ({product.images?.length || 0})
                </button>
              </div>

              {resolvedActiveImg ? (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8 relative h-[360px] bg-background border border-border rounded-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={resolvedActiveImg}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                    {product.images[activeImageIndex]?.is_thumbnail && (
                      <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded shadow">
                        Main Thumbnail
                      </span>
                    )}
                  </div>
                  <div className="sm:col-span-4 flex sm:flex-col gap-2 overflow-auto max-h-[360px] pr-1">
                    {product.images?.map((img, idx) => {
                      const resolvedThumb = img.image_url.startsWith('http')
                        ? img.image_url
                        : `${API_BASE_URL}${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`;
                      return (
                        <button
                          key={img.id || idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-20 h-20 sm:w-full sm:h-20 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                            activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={resolvedThumb} alt="" className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No images uploaded for this product.
                </div>
              )}
            </div>

            {/* Description & Rich Content */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-foreground border-b border-border pb-3 flex items-center justify-between">
                <span>Product Description</span>
                <span className="text-xs text-muted-foreground font-normal font-mono">
                  {product.description?.replace(/<[^>]*>?/gm, '').length || 0} characters
                </span>
              </h2>

              {product.short_description && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-foreground leading-relaxed">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary block mb-1">
                    Short Summary:
                  </span>
                  <p className="italic">{product.short_description}</p>
                </div>
              )}

              <div
                className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground leading-relaxed pt-1"
                dangerouslySetInnerHTML={{
                  __html: product.description || '<p className="text-muted-foreground italic">No detailed description provided.</p>',
                }}
              />
            </div>

            {/* Video Showcase */}
            {videoEmbed && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-2xs">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <Video size={16} className="text-red-500" />
                  <span>YouTube Video Showcase</span>
                </h2>
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                  <iframe
                    src={videoEmbed}
                    title="Product Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Right: 4 Cols */}
          <div className="lg:col-span-4 space-y-6">
            {/* Storefront Preview Card */}
            <div className="bg-primary/5 border-2 border-primary/30 rounded-xl p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Sparkles size={16} />
                <span>Storefront Customer Experience</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Shoppers see this product directly at the public URL. Test live layout and purchase flow:
              </p>
              <div className="space-y-2">
                <Link
                  href={`/product/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                >
                  <Eye size={15} />
                  <span>Open Storefront Live View</span>
                  <ExternalLink size={13} />
                </Link>

                <button
                  type="button"
                  onClick={copyStorefrontLink}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-card hover:bg-accent border border-border text-foreground text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  {copiedSlug ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copiedSlug ? 'Link Copied!' : 'Copy Direct Product URL'}</span>
                </button>
              </div>
            </div>

            {/* Categories & Taxonomies Card */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3.5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <Tag size={13} className="text-primary" /> Categories &amp; Placement
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1 font-medium">Primary Categories:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.product_categories?.length > 0 ? (
                      product.product_categories.map((pc) => (
                        <span
                          key={pc.id}
                          className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary font-semibold rounded-md"
                        >
                          {pc.category?.name || 'Category'}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground italic">None assigned</span>
                    )}
                  </div>
                </div>

                {product.related_categories?.length > 0 && (
                  <div>
                    <span className="text-[11px] text-muted-foreground block mb-1 font-medium">Related Categories:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.related_categories.map((rc) => (
                        <span
                          key={rc.id}
                          className="px-2 py-0.5 bg-muted border border-border text-foreground rounded-md text-[11px]"
                        >
                          {rc.category?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audit & Timestamps Card */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-2xs text-xs text-muted-foreground">
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
                <Clock size={13} className="text-primary" /> Audit &amp; Metadata
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Created:</span>
                  <span className="text-foreground font-mono">
                    {new Date(product.created_at).toLocaleDateString()} {new Date(product.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated:</span>
                  <span className="text-foreground font-mono">
                    {new Date(product.updated_at).toLocaleDateString()} {new Date(product.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {product.published_at && (
                  <div className="flex items-center justify-between">
                    <span>Published:</span>
                    <span className="text-foreground font-mono">
                      {new Date(product.published_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {product.product_number && (
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span>Product No:</span>
                    <button
                      type="button"
                      onClick={copyProductIdentifier}
                      className="font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      title="Click to copy Product No"
                    >
                      <span>{product.product_number}</span>
                      <Copy size={11} />
                    </button>
                  </div>
                )}
                {product.variants?.[0]?.sku && (
                  <div className="flex items-center justify-between">
                    <span>SKU:</span>
                    <span className="text-foreground font-mono font-medium">
                      {product.variants[0].sku}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: VARIANTS & INVENTORY ── */}
      {activeTab === 'variants' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers size={18} className="text-primary" />
                <span>SKU Variants &amp; Stock Inventory</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Breakdown of price, attributes, and inventory quantities per variant.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                {product.variants?.length || 0} Total Variants
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                {totalStock} Units in Stock
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-bold border-b border-border">
                  <th className="p-3.5">SKU Code</th>
                  <th className="p-3.5">Attributes</th>
                  <th className="p-3.5">Selling Price</th>
                  <th className="p-3.5">Compare Price</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Warehouse Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.variants?.map((v) => {
                  const variantStock = v.inventories?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
                  const variantCompare = v.compare_price ? Number(v.compare_price) : null;
                  return (
                    <tr key={v.id} className="hover:bg-accent/40 text-foreground transition">
                      <td className="p-3.5 font-mono font-bold text-primary">
                        {v.sku}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {v.attributes?.map((attr) => (
                            <span
                              key={attr.id}
                              className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] font-medium"
                            >
                              {attr.attribute_value?.attribute?.name}:{' '}
                              <strong className="text-foreground">{attr.attribute_value?.value}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-foreground">
                        AED {Number(v.price).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {variantCompare ? (
                          <span className="line-through">AED {variantCompare.toFixed(2)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3.5">
                        {variantStock <= 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                            Out of Stock (0)
                          </span>
                        ) : variantStock <= 5 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Low Stock ({variantStock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            In Stock ({variantStock})
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {v.inventories?.length > 0 ? (
                          <div className="space-y-0.5">
                            {v.inventories.map((inv) => (
                              <div key={inv.id} className="text-[11px]">
                                <span className="font-medium text-foreground">{inv.warehouse?.name || 'Main Warehouse'}:</span>{' '}
                                <span>{inv.quantity} units</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="italic">Standard stock pool</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: MEDIA GALLERY ── */}
      {activeTab === 'media' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Box size={18} className="text-primary" />
                <span>Media &amp; Visual Gallery</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                All visual assets attached to this product catalog entry.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {product.images?.length || 0} image{(product.images?.length || 0) === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {product.images?.map((img, idx) => {
              const resolvedImg = img.image_url.startsWith('http')
                ? img.image_url
                : `${API_BASE_URL}${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`;
              return (
                <div
                  key={img.id || idx}
                  className="group relative bg-background border border-border rounded-xl overflow-hidden shadow-2xs space-y-2 pb-3"
                >
                  <div className="aspect-square w-full bg-muted/40 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={resolvedImg}
                      alt={img.alt_text || product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {img.is_thumbnail && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        Main Thumbnail
                      </span>
                    )}
                  </div>
                  <div className="px-3 space-y-1 text-xs">
                    <p className="font-semibold text-foreground truncate">
                      {img.alt_text || `Image #${idx + 1}`}
                    </p>
                    <a
                      href={resolvedImg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-mono truncate"
                    >
                      <ExternalLink size={10} /> View full size
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 4: SEO & META ── */}
      {activeTab === 'seo' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              <span>Search Engine Optimization &amp; Metadata</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              How this product appears on Google and social search engines.
            </p>
          </div>

          {/* Google Search Snippet Simulation */}
          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5 max-w-2xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Google Search Result Preview
            </span>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              https://example.com/product/{product.slug}
            </p>
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              {product.seo_title || product.name}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {product.seo_description || product.short_description || 'Explore the elegant collection on BorkaCommerce. Premium materials and modern modest designs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-background border border-border rounded-xl space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">SEO Meta Title:</span>
              <p className="font-medium text-foreground">{product.seo_title || product.name}</p>
            </div>

            <div className="p-4 bg-background border border-border rounded-xl space-y-1">
              <span className="text-[11px] text-muted-foreground font-semibold">SEO Keywords:</span>
              <p className="font-medium text-foreground">{product.seo_keywords || 'None specified'}</p>
            </div>

            <div className="p-4 bg-background border border-border rounded-xl space-y-1 md:col-span-2">
              <span className="text-[11px] text-muted-foreground font-semibold">SEO Meta Description:</span>
              <p className="font-medium text-foreground leading-relaxed">
                {product.seo_description || 'None specified'}
              </p>
            </div>

            {product.tags && (
              <div className="p-4 bg-background border border-border rounded-xl space-y-2 md:col-span-2">
                <span className="text-[11px] text-muted-foreground font-semibold">Product Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.split(',').map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-[11px]"
                    >
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: REVIEWS ── */}
      {activeTab === 'reviews' && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Star size={18} className="text-amber-500" />
                <span>Customer Reviews &amp; Ratings</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified buyer feedback and star evaluations.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              {product.reviews?.length || 0} Review{(product.reviews?.length || 0) === 1 ? '' : 's'}
            </span>
          </div>

          {product.reviews?.length > 0 ? (
            <div className="divide-y divide-border">
              {product.reviews.map((r) => (
                <div key={r.id} className="py-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {r.customer?.first_name ? `${r.customer.first_name} ${r.customer.last_name || ''}` : 'Verified Customer'}
                      </span>
                      <span className="text-amber-500 font-bold">
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && <p className="text-foreground leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No customer reviews posted yet for this product.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
