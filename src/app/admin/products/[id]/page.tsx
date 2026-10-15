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
} from 'lucide-react';
import { getYoutubeEmbedUrl } from '../page';

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
  video_url?: string | null;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: Variant[];
  product_categories: CategoryRef[];
  related_categories: CategoryRef[];
  reviews: Review[];
}

export default function AdminSingleProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const token = useSelector((state: RootState) => state.auth.token);

  const [product, setProduct] = useState<SingleProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Product not found');
        throw new Error(`Failed to load product (status ${res.status})`);
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 w-full flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw size={28} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-light">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 w-full space-y-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={14} /> Back to Products
        </Link>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3 text-red-500">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertCircle size={18} />
            <span>Product Not Found</span>
          </div>
          <p className="text-xs text-red-400">{error || 'The requested product could not be located.'}</p>
          <button
            onClick={fetchProduct}
            className="px-3.5 py-1.5 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Derived stats
  const totalStock = product.variants.reduce((acc, v) => {
    const vStock = v.inventories?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
    return acc + vStock;
  }, 0);

  const minPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => Number(v.price)))
    : 0;

  const maxPrice = product.variants.length > 0
    ? Math.max(...product.variants.map((v) => Number(v.price)))
    : 0;

  const videoEmbed = getYoutubeEmbedUrl(product.video_url || undefined);
  const activeImage = product.images?.[activeImageIndex]?.image_url || product.images?.[0]?.image_url || '';
  const resolvedActiveImg = activeImage
    ? activeImage.startsWith('http')
      ? activeImage
      : `${API_BASE_URL}${activeImage.startsWith('/') ? '' : '/'}${activeImage}`
    : '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition font-medium"
          >
            <ArrowLeft size={14} /> Products Catalog
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono text-primary font-bold">
            {product.product_number || product.slug}
          </span>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* LIVE VIEW BUTTON (PROMINENT) */}
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg transition shadow-sm cursor-pointer"
            title="Open Live Product Page on Customer Storefront"
          >
            <Eye size={15} />
            <span>Live View</span>
            <ExternalLink size={13} className="opacity-80" />
          </Link>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={copyStorefrontLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-accent border border-border text-foreground text-xs font-semibold rounded-lg transition cursor-pointer"
            title="Copy Public Storefront Link"
          >
            {copiedSlug ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copiedSlug ? 'Copied' : 'Share URL'}</span>
          </button>

          {/* Toggle Publish / Draft */}
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleTogglePublish}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition cursor-pointer ${
              product.status === 'PUBLISHED'
                ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {product.status === 'PUBLISHED' ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{product.status === 'PUBLISHED' ? 'Unpublish' : 'Publish Product'}</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleDeleteProduct}
            className="p-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
            title="Delete this product"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Product Title Bar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {product.product_number && (
              <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-primary/10 border border-primary/30 text-primary">
                {product.product_number}
              </span>
            )}
            <span
              className={`px-2.5 py-0.5 rounded-md font-semibold text-xs border ${
                product.status === 'PUBLISHED'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300'
              }`}
            >
              {product.status}
            </span>
            {product.is_cod_allowed ? (
              <span className="px-2.5 py-0.5 rounded-md font-semibold text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck size={12} /> Cash on Delivery Available
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md font-semibold text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300">
                Prepaid Only (No COD)
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {product.name}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Slug: <span className="text-foreground">/product/{product.slug}</span>
          </p>
        </div>

        {/* Top Summary Metrics */}
        <div className="flex items-center gap-6 divide-x divide-border shrink-0">
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Price Range
            </span>
            <p className="text-base font-bold text-foreground">
              AED {minPrice} {maxPrice > minPrice ? `– AED ${maxPrice}` : ''}
            </p>
          </div>
          <div className="pl-6 space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Total Stock
            </span>
            <p className="text-base font-bold text-foreground flex items-center gap-1.5">
              <Package size={15} className="text-primary" />
              <span>{totalStock} units</span>
            </p>
          </div>
          <div className="pl-6 space-y-0.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Variants
            </span>
            <p className="text-base font-bold text-foreground">
              {product.variants.length} SKU{product.variants.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Primary Content (8 Cols), Right Sidebar (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 8 COLS */}
        <div className="lg:col-span-8 space-y-6">
          {/* Images Gallery Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Box size={16} className="text-primary" />
                <span>Product Media &amp; Images ({product.images?.length || 0})</span>
              </h2>
              <span className="text-xs text-muted-foreground">Click thumbnail to preview</span>
            </div>

            {resolvedActiveImg ? (
              <div className="space-y-3">
                <div className="relative w-full h-[380px] sm:h-[480px] bg-muted/30 border border-border rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={resolvedActiveImg}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {product.images[activeImageIndex]?.is_thumbnail && (
                    <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded shadow">
                      Main Thumbnail
                    </span>
                  )}
                </div>

                {/* Thumbnails row */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {product.images.map((img, idx) => {
                    const resolvedThumb = img.image_url.startsWith('http')
                      ? img.image_url
                      : `${API_BASE_URL}${img.image_url.startsWith('/') ? '' : '/'}${img.image_url}`;
                    return (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                          activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={resolvedThumb} alt="" className="w-full h-full object-cover" />
                        {img.is_thumbnail && (
                          <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-primary-foreground text-[9px] text-center font-bold">
                            Thumb
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                No images uploaded for this product.
              </div>
            )}
          </div>

          {/* Variants & Stock Inventory */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <span>SKU Variants &amp; Inventory ({product.variants.length})</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {totalStock} in stock
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-bold border-b border-border">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Attributes</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Compare At</th>
                    <th className="p-3">Stock Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {product.variants.map((v) => {
                    const variantStock = v.inventories?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
                    return (
                      <tr key={v.id} className="hover:bg-accent/40">
                        <td className="p-3 font-mono font-semibold text-foreground">
                          {v.sku}
                        </td>
                        <td className="p-3">
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
                        <td className="p-3 font-bold text-foreground">
                          AED {Number(v.price).toFixed(2)}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {v.compare_price ? (
                            <span className="line-through">AED {Number(v.compare_price).toFixed(2)}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3">
                          {variantStock <= 0 ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-300">
                              Out of Stock (0)
                            </span>
                          ) : variantStock <= 5 ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300">
                              Low Stock ({variantStock})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300">
                              In Stock ({variantStock})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Description & Content */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-foreground border-b border-border pb-3">
              Product Description
            </h2>
            {product.short_description && (
              <div className="p-3.5 bg-muted/30 border border-border rounded-lg text-xs text-foreground italic">
                {product.short_description}
              </div>
            )}
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground leading-relaxed pt-2"
              dangerouslySetInnerHTML={{ __html: product.description || '<p className="text-muted-foreground italic">No detailed description provided.</p>' }}
            />
          </div>

          {/* YouTube Video Preview (if available) */}
          {videoEmbed && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Video size={16} className="text-red-500" />
                <span>Embedded Video Showcase</span>
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

        {/* RIGHT SIDEBAR: 4 COLS */}
        <div className="lg:col-span-4 space-y-6">
          {/* LIVE VIEW CARD */}
          <div className="bg-primary/5 border-2 border-primary/30 rounded-xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Sparkles size={16} />
              <span>Customer Storefront Preview</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Experience the live product presentation exactly as your shoppers see it on the web.
            </p>
            <div className="space-y-2">
              <Link
                href={`/product/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg transition shadow cursor-pointer"
              >
                <Eye size={15} />
                <span>Open Live Storefront View</span>
                <ExternalLink size={13} />
              </Link>

              <button
                type="button"
                onClick={copyStorefrontLink}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-card hover:bg-accent border border-border text-foreground text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                {copiedSlug ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copiedSlug ? 'Direct URL Copied!' : 'Copy Direct Storefront URL'}</span>
              </button>
            </div>
          </div>

          {/* Categories & Taxonomies Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Categories &amp; Navigation
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block mb-1">Primary Categories:</span>
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
                  <span className="text-[11px] text-muted-foreground block mb-1">Related Categories:</span>
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

          {/* SEO & Search Meta Card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
              Search &amp; SEO Metadata
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block">Meta Title:</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {product.seo_title || product.name}
                </p>
              </div>

              {product.seo_description && (
                <div>
                  <span className="text-[11px] text-muted-foreground block">Meta Description:</span>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    {product.seo_description}
                  </p>
                </div>
              )}

              {product.tags && (
                <div>
                  <span className="text-[11px] text-muted-foreground block mb-1">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.split(',').map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-muted text-foreground border border-border rounded text-[11px]"
                      >
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Timestamps */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-2.5 shadow-xs text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Created:
              </span>
              <span className="text-foreground font-mono">
                {new Date(product.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Last Updated:
              </span>
              <span className="text-foreground font-mono">
                {new Date(product.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
