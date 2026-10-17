'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/cartSlice';
import { Check, Info, ShoppingBag, Truck, ShieldCheck, Clock, Star, Share2, Ruler, X, Play, ChevronDown, ChevronUp, FileText, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { DiscountedPrice } from '../../../components/PriceDisplay';
import { useCurrency } from '../../../context/CurrencyContext';
import { API_BASE_URL } from '@/config/api';
import ProductVideoPlayer, { getCleanYoutubeEmbedUrl } from '../../../components/ProductVideoPlayer';

function formatDimension(val: string | number | undefined, targetUnit: 'in' | 'cm'): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (!str) return '';

  if (targetUnit === 'in') {
    if (/^\d+(\.\d+)?$/.test(str)) {
      return `${str}"`;
    }
    return str;
  }

  // Convert to cm
  if (str.includes("'")) {
    const parts = str.split('-').map((s) => s.trim());
    const converted = parts.map((part) => {
      const match = part.match(/(\d+)'\s*(\d+)?/);
      if (match) {
        const feet = parseInt(match[1], 10);
        const inches = parseInt(match[2] || '0', 10);
        const cm = Math.round(((feet * 12) + inches) * 2.54);
        return `${cm} cm`;
      }
      return part;
    });
    return converted.join(' - ');
  }

  const numMatch = str.match(/^([\d.]+)/);
  if (numMatch) {
    const inches = parseFloat(numMatch[1]);
    const cm = Math.round(inches * 2.54);
    return `${cm} cm`;
  }

  return str;
}

function getYoutubeEmbedUrl(url?: string): string {
  return getCleanYoutubeEmbedUrl(url).embedUrl;
}

interface Variant {
  id: string;
  sku: string;
  price: number;
  compare_price: number | null;
  discounted_price: number;
  available_stock: number;
  attributes: { name: string; value: string }[];
  offer: { name: string; discount_value: number; discount_type: string; end_date?: string } | null;
  images: string[];
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      if (difference <= 0) return null;
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (!left) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) {
    return <div className="text-xs text-red-500 font-bold">Offer Ended</div>;
  }

  return (
    <div className="flex gap-2 items-center bg-red-500/10 border border-red-500/20 px-3 py-2 rounded text-red-500 font-mono text-xs w-full max-w-sm justify-between mt-2">
      <span className="font-sans font-semibold uppercase tracking-wider text-xs">Flash Sale Ends In:</span>
      <div className="flex gap-1.5 font-bold">
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
        <span>:</span>
        <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
        <span>:</span>
        <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-1.116-.062-.357-.115-.815-.274-1.408-.53-2.483-1.077-4.103-3.606-4.228-3.771-.125-.165-1.008-1.341-1.008-2.557 0-1.216.637-1.815.864-2.062.228-.247.498-.309.664-.309.167 0 .333.001.479.009.155.008.363-.058.568.435.21.503.714 1.741.776 1.867.063.125.105.271.021.438-.083.167-.125.271-.25.417-.125.146-.263.326-.375.438-.125.125-.255.26-.11.509.146.25.647 1.066 1.388 1.725.953.849 1.756 1.112 2.006 1.237.25.125.396.104.542-.062.146-.167.625-.729.792-.979.166-.25.333-.208.562-.125.229.083 1.458.687 1.708.812.25.125.416.188.479.292.062.104.062.604-.083 1.009z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.436 5.176L2 22l4.981-1.306C8.423 21.536 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.25c-1.637 0-3.162-.489-4.444-1.328l-.319-.208-2.957.776.789-2.884-.227-.361C4.945 14.939 4.417 13.518 4.417 12c0-4.182 3.401-7.583 7.583-7.583 4.182 0 7.583 3.401 7.583 7.583 0 4.182-3.401 7.583-7.583 7.583z" />
    </svg>
  );
}

interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  video_url?: string;
  images: string[];
  variants: Variant[];
  rating: { average: number; count: number };
  reviews: { id: string; rating: number; review: string; created_at: string; customer_name: string }[];
  is_cod_allowed?: boolean;
  product_number?: string | null;
}

export default function ProductClient({ product }: { product: ProductDetails }) {
  const dispatch = useDispatch();
  
  // Extract all unique attribute values for each attribute name
  const attributeOptions: Record<string, string[]> = {};
  product.variants.forEach((v) => {
    v.attributes.forEach((attr) => {
      if (!attributeOptions[attr.name]) {
        attributeOptions[attr.name] = [];
      }
      if (!attributeOptions[attr.name].includes(attr.value)) {
        attributeOptions[attr.name].push(attr.value);
      }
    });
  });

  const { formatPrice, currency } = useCurrency();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(product.variants?.[0] || null);
  const [activeImage, setActiveImage] = useState<string>(product.images[0] || '');
  const [activeMediaMode, setActiveMediaMode] = useState<'image' | 'video'>('image');
  const embedUrl = getYoutubeEmbedUrl(product.video_url);
  const [addedAlert, setAddedAlert] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<{
    base_fee: number;
    final_fee: number;
    discount_amount: number;
    is_free: boolean;
    display_text: string;
    applied_rule: string | null;
    threshold_rule: string | null;
  } | null>(null);

  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeUnit, setSizeUnit] = useState<'in' | 'cm'>('in');
  const [siteSettings, setSiteSettings] = useState<Record<string, string> | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(Number((prev + 0.5).toFixed(2)), 3.5));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(2)), 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/ecommerce/site-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setSiteSettings(data);
      })
      .catch(() => {});
  }, []);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on Saba Al Wadi!`,
      url,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  // Dynamic Settings for stock and WhatsApp
  const whatsappNumber = siteSettings?.whatsapp_order_number || siteSettings?.whatsapp_number || '+971 55 642 4758';
  const showStockQuantity = siteSettings?.show_stock_quantity !== 'false';
  const showStockBadge = siteSettings?.show_stock_badge !== 'false';
  const isWhatsappOrderEnabled = siteSettings?.whatsapp_order_enabled !== 'false';

  const handleOrderWhatsApp = () => {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const selectedAttrs = Object.entries(selections)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const lines = [
      `Hello Saba Al Wadi! 👋`,
      `I would like to order:`,
      `*${product.name}*`,
      product.product_number ? `Code: ${product.product_number}` : '',
      selectedAttrs ? `Selected: ${selectedAttrs}` : '',
      selectedVariant ? `Price: AED ${selectedVariant.price}` : '',
      `Link: ${currentUrl}`,
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  // Fetch dynamic delivery calculation for this product / selected variant price
  useEffect(() => {
    const priceToCalculate = selectedVariant ? selectedVariant.discounted_price : (product.variants[0]?.discounted_price || 0);
    if (priceToCalculate <= 0) return;

    fetch(`${API_BASE_URL}/ecommerce/shipping-calculator?subtotal=${priceToCalculate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.final_fee === 'number') {
          setShippingInfo(data);
        }
      })
      .catch(() => {});
  }, [selectedVariant, product.variants]);

  // Initialize selections with first available options
  useEffect(() => {
    const initialSelections: Record<string, string> = {};
    Object.keys(attributeOptions).forEach((name) => {
      initialSelections[name] = attributeOptions[name][0];
    });
    setSelections(initialSelections);
  }, []);

  // Update selected variant when selections change
  useEffect(() => {
    if (Object.keys(selections).length === 0) return;

    const matched = product.variants.find((v) => {
      return v.attributes.every((attr) => selections[attr.name] === attr.value);
    });

    setSelectedVariant(matched || null);

    // If variant has images, update active image
    if (matched && matched.images && matched.images.length > 0) {
      setActiveImage(matched.images[0]);
    }
  }, [selections]);

  const handleSelectOption = (attrName: string, value: string) => {
    setSelections((prev) => ({ ...prev, [attrName]: value }));
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    dispatch(
      addToCart({
        id: selectedVariant.id,
        product_id: product.id,
        name: product.name,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        compare_price: selectedVariant.compare_price,
        discounted_price: selectedVariant.discounted_price,
        image: selectedVariant.images[0] || product.images[0] || null,
        attributes: selectedVariant.attributes,
        available_stock: selectedVariant.available_stock,
        is_cod_allowed: product.is_cod_allowed !== false,
      })
    );

    setAddedAlert(true);
    setTimeout(() => setAddedAlert(false), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* 2-Column Product Showcase & Purchase Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* Product Image / Video Section */}
        <div className="space-y-2.5">
          <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] min-h-[440px] sm:min-h-[540px] lg:min-h-[640px] max-h-[85vh] border border-border bg-neutral-100/70 dark:bg-zinc-950/40 rounded-xl overflow-hidden shadow-sm flex items-center justify-center group">
            {activeMediaMode === 'video' && product.video_url ? (
              <ProductVideoPlayer
                videoUrl={product.video_url}
                productName={product.name}
                onBackToPhotos={() => setActiveMediaMode('image')}
              />
            ) : (
              <img
                src={activeImage}
                alt={product.name}
                onClick={() => setIsImageModalOpen(true)}
                className="w-full h-full object-contain object-center transition-transform duration-300 cursor-zoom-in group-hover:scale-[1.01]"
              />
            )}

            {/* Watch Video Button */}
            {embedUrl && activeMediaMode === 'image' && (
              <button
                type="button"
                onClick={() => setActiveMediaMode('video')}
                className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xl cursor-pointer transition hover:scale-105"
              >
                <Play size={13} className="fill-red-500 text-red-500" />
                <span>Watch Product Video</span>
              </button>
            )}

            {/* Fullscreen Zoom Button */}
            {activeMediaMode === 'image' && (
              <button
                type="button"
                onClick={() => setIsImageModalOpen(true)}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition shadow-lg cursor-pointer"
                title="View full resolution image"
              >
                <Maximize2 size={13} />
                <span>Full View</span>
              </button>
            )}
          </div>
          {/* Thumbnails with Video Tab */}
          {(() => {
            const galleryImages = Array.from(new Set([
              ...(product.images || []),
              ...(selectedVariant?.images || [])
            ])).filter(Boolean);

            if (galleryImages.length <= 1 && !embedUrl) return null;

            return (
              <div className="flex gap-2 sm:gap-2.5 overflow-x-auto py-1.5 pl-[2px] pr-1.5 scrollbar-thin">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveImage(img);
                      setActiveMediaMode('image');
                      resetZoom();
                    }}
                    className={`relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 border rounded-lg overflow-hidden transition cursor-pointer first:ml-[2px] ${
                      activeMediaMode === 'image' && activeImage === img
                        ? 'border-primary ring-2 ring-primary ring-offset-1'
                        : 'border-border opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover object-center" />
                  </button>
                ))}
                {embedUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveMediaMode('video')}
                    className={`relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 border rounded-lg overflow-hidden flex flex-col items-center justify-center bg-zinc-950 transition cursor-pointer ${
                      activeMediaMode === 'video'
                        ? 'border-primary ring-2 ring-primary text-primary'
                        : 'border-border text-zinc-400 hover:text-white hover:border-zinc-500'
                    }`}
                    title="Watch YouTube Product Video"
                  >
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                      <Play size={10} className="ml-0.5 fill-white text-white" />
                    </div>
                    <span className="text-xs font-bold mt-0.5 tracking-wider uppercase">Video</span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>

      {/* Product Details Section */}
      <div className="space-y-3.5 lg:py-0">
        <div className="space-y-1">
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-amber-500 text-xs sm:text-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={star <= Math.round(product.rating.average) ? 'fill-amber-500 text-amber-500' : 'text-zinc-600'}
                />
              ))}
            </div>
            <span className="font-bold text-xs sm:text-sm text-foreground">{product.rating.average}</span>
            <a href="#reviews" className="text-xs text-muted hover:text-primary transition underline cursor-pointer">
              ({product.rating.count} Customer Reviews)
            </a>
            {embedUrl && (
              <>
                <span className="text-muted-foreground/60">•</span>
                <button
                  type="button"
                  onClick={() => setActiveMediaMode('video')}
                  className="text-xs text-red-500 hover:text-red-600 font-semibold inline-flex items-center gap-1 cursor-pointer transition hover:underline"
                >
                  <Play size={11} className="fill-red-500" /> Watch Video
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Pricing */}
        {selectedVariant ? (
          <div className="space-y-2 border-y border-border py-2.5">
            <div className="flex items-center justify-between">
              <DiscountedPrice
                discountedAed={selectedVariant.discounted_price}
                originalAed={selectedVariant.price}
                offerName={selectedVariant.offer?.name}
                size="lg"
              />

              {showStockBadge && (
                <div className="text-right">
                  {selectedVariant.available_stock <= 0 ? (
                    <span className="text-xs text-red-500 font-semibold px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded">
                      Out of Stock
                    </span>
                  ) : showStockQuantity ? (
                    selectedVariant.available_stock <= 5 ? (
                      <span className="text-xs text-amber-500 font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded flex items-center gap-1">
                        <span>⚡ Only {selectedVariant.available_stock} left in stock!</span>
                      </span>
                    ) : (
                      <span className="text-xs text-green-500 font-semibold px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded">
                        ✓ In Stock ({selectedVariant.available_stock} available)
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-green-500 font-semibold px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded">
                      ✓ In Stock
                    </span>
                  )}
                </div>
              )}
            </div>
            {selectedVariant.offer?.end_date && (
              <CountdownTimer endDate={selectedVariant.offer.end_date} />
            )}
          </div>
        ) : (
          <div className="border-y border-border py-2.5">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Select variant options below to see price and stock availability.</p>
          </div>
        )}

        {/* Variant Selectors */}
        <div className="space-y-3">
          {Object.keys(attributeOptions).map((attrName) => (
            <div key={attrName} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{attrName}</h3>
                {attrName.toLowerCase().includes('size') && (
                  <button
                    type="button"
                    onClick={() => setShowSizeModal(true)}
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Ruler size={13} /> Size Chart &amp; Guide
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {attributeOptions[attrName].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSelectOption(attrName, val)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded border transition cursor-pointer ${
                      selections[attrName] === val
                        ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary font-medium'
                        : 'border-border bg-card hover:bg-accent text-foreground/80'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add to Cart & Share Actions */}
        <div className="pt-2.5 space-y-2.5">
          <div className="flex items-stretch gap-2.5">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.available_stock <= 0}
              className={`flex-1 py-2.5 sm:py-3 rounded-md uppercase font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                selectedVariant && selectedVariant.available_stock > 0
                  ? 'btn-luxury cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
              }`}
            >
              <ShoppingBag size={16} />
              {selectedVariant
                ? selectedVariant.available_stock > 0
                  ? 'Add to Shopping Bag'
                  : 'Sold Out'
                : 'Select Variant Options'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-2.5 sm:py-3 rounded-md border border-border bg-card hover:bg-accent text-foreground hover:text-primary flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
              title="Share this product"
            >
              <Share2 size={16} />
              <span className="text-xs font-semibold uppercase hidden sm:inline">
                {shareSuccess ? 'Copied!' : 'Share'}
              </span>
            </button>
          </div>

          {/* Order on WhatsApp Button */}
          {isWhatsappOrderEnabled && (
            <button
              type="button"
              onClick={handleOrderWhatsApp}
              className="w-full py-2.5 sm:py-3 rounded-md uppercase font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition duration-200 bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm cursor-pointer hover:shadow-md"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Order on WhatsApp</span>
            </button>
          )}

          {shareSuccess && (
            <div className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/30 text-primary p-2 rounded-md">
              <Check size={14} />
              <span>Product link copied to clipboard!</span>
            </div>
          )}

          {addedAlert && (
            <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-2.5 rounded-md transition duration-300">
              <Check size={14} />
              <span>Variant added to your Shopping Bag successfully! <a href="/cart" className="underline font-bold">View Bag</a></span>
            </div>
          )}

          {/* Dynamic Delivery Perks & Trust Card */}
          <div className="p-3 rounded-lg bg-card/70 border border-border space-y-2 shadow-xs">
            {/* Dynamic Delivery status */}
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={14} />
              </div>
              <div className="flex-1 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Express UAE &amp; GCC Delivery</span>
                  {shippingInfo && (
                    <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs shadow-xs tracking-tight ${
                      shippingInfo.is_free
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30'
                    }`}>
                      {shippingInfo.is_free ? 'FREE EXPRESS SHIPPING' : `${formatPrice(shippingInfo.final_fee)} Express Delivery`}
                    </span>
                  )}
                </div>
                {shippingInfo?.threshold_rule && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ✈ {shippingInfo.threshold_rule.replace(/AED\s*\d+/i, formatPrice(500))}
                  </p>
                )}
                {shippingInfo?.applied_rule && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ {shippingInfo.applied_rule.replace(/AED\s*\d+/i, formatPrice(shippingInfo.discount_amount || 30))}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  Estimated delivery within 24 to 48 business hours with live tracking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                <span>100% Genuine Fabric</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-amber-500 shrink-0" />
                <span>7-Day Easy Exchange</span>
              </div>
              <div className="flex items-center gap-1.5">
                {product.is_cod_allowed !== false ? (
                  <>
                    <Check size={13} className="text-emerald-500 shrink-0" />
                    <span className="text-emerald-500 font-semibold">COD Available</span>
                  </>
                ) : (
                  <>
                    <Info size={13} className="text-amber-500 shrink-0" />
                    <span className="text-amber-500 font-semibold">Prepaid Only</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Dedicated Full-Width Product Description Section with pure, unconstrained layout */}
    <div id="product-description" className="border-t border-border pt-5 space-y-3.5 text-left scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2.5 text-left">
        <div className="space-y-0.5 text-left">
          <span className="text-xs font-semibold tracking-wider text-primary uppercase">
            Signature Design &amp; Details
          </span>
          <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-foreground text-left">
            Complete Craftsmanship &amp; Story
          </h2>
        </div>
        {embedUrl && (
          <a
            href="#product-video"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer"
          >
            <Play size={12} className="fill-primary" /> View Video Lookbook &darr;
          </a>
        )}
      </div>

      <div className="space-y-4 text-left w-full min-w-0 overflow-hidden">
        <div
          className="rich-description-content text-sm sm:text-base text-muted-foreground leading-relaxed font-light max-w-none font-sans text-left overflow-x-auto"
          style={{ textAlign: 'left', direction: 'ltr' }}
          dir="ltr"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>
    </div>

    {/* Dedicated Standalone Product Video Showcase Section */}
    {embedUrl && (
      <div id="product-video" className="border-t border-border pt-6 sm:pt-8 space-y-4 text-left scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold tracking-wider text-primary uppercase">
              Video Demonstration &amp; Lookbook
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Official Video Showcase
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveMediaMode('video');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer self-start sm:self-auto"
          >
            <Play size={12} className="fill-primary" /> Play in Gallery &uarr;
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm max-w-4xl mx-auto space-y-3">
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-inner bg-black">
            <iframe
              src={embedUrl}
              title={`${product.name} Video Showcase`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            High-definition presentation demonstrating fabric texture, silhouette cut, and fluid motion.
          </p>
        </div>
      </div>
    )}

      {/* Sizing Guide & Chart Modal - Dynamic Size Chart */}
      {showSizeModal && (() => {
        const chartFile = siteSettings?.size_chart_file || siteSettings?.size_chart_image;

        // Parse dynamic size chart table from settings, fallback to standard Abaya sizes
        const DEFAULT_ABAYA_SIZES = [
          { size: '50', height: "5'0\" - 5'1\"", length: '50"', bust: '40"', sleeve: '26"' },
          { size: '52', height: "5'2\" - 5'3\"", length: '52"', bust: '42"', sleeve: '27"' },
          { size: '54', height: "5'4\" - 5'5\"", length: '54"', bust: '44"', sleeve: '28"' },
          { size: '56', height: "5'6\" - 5'7\"", length: '56"', bust: '46"', sleeve: '28"' },
          { size: '58', height: "5'8\" - 5'9\"", length: '58"', bust: '48"', sleeve: '29"' },
          { size: '60', height: "5'10\" - 6'0\"", length: '60"', bust: '50"', sleeve: '30"' },
        ];

        let dynamicSizeChart = DEFAULT_ABAYA_SIZES;
        if (siteSettings?.size_chart_table) {
          try {
            const raw = typeof siteSettings.size_chart_table === 'string'
              ? JSON.parse(siteSettings.size_chart_table)
              : siteSettings.size_chart_table;
            if (Array.isArray(raw) && raw.length > 0) {
              dynamicSizeChart = raw.map((row: any) => ({
                size: row.size || '',
                height: row.height || row.height_in || '',
                length: row.length || row.length_in || '',
                bust: row.bust || row.bust_in || '',
                sleeve: row.sleeve || row.sleeve_in || '',
              }));
            }
          } catch (_) {}
        }

        let dynamicCols = {
          size: 'Size',
          height: 'Your Height',
          length: 'Abaya Length',
          bust: 'Bust Width',
          sleeve: 'Sleeve',
        };
        if (siteSettings?.size_chart_columns) {
          try {
            const rawCols = typeof siteSettings.size_chart_columns === 'string'
              ? JSON.parse(siteSettings.size_chart_columns)
              : siteSettings.size_chart_columns;
            if (rawCols && typeof rawCols === 'object') {
              dynamicCols = { ...dynamicCols, ...rawCols };
            }
          } catch (_) {}
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-background">
                <div className="flex items-center gap-2">
                  <Ruler size={18} className="text-primary" />
                  <div>
                    <h2 className="font-serif text-lg font-bold">Abaya Sizing Chart &amp; Guide</h2>
                    <p className="text-xs text-muted-foreground">Standard Gulf &amp; International Modest Sizing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs & Unit Toggle */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-border bg-muted/20 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Units:</span>
                  <div className="inline-flex rounded-lg border border-border p-0.5 bg-background">
                    <button
                      type="button"
                      onClick={() => setSizeUnit('in')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                        sizeUnit === 'in' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Inches (in)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeUnit('cm')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                        sizeUnit === 'cm' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Centimeters (cm)
                    </button>
                  </div>
                </div>

                {chartFile && (
                  <a
                    href={chartFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    View Official Document ↗
                  </a>
                )}
              </div>

              {/* Main Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-background/50">
                {/* Standard Sizing Table */}
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-foreground font-semibold uppercase text-xs tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3 px-3 sm:px-4">{dynamicCols.size || 'Size'}</th>
                        <th className="py-3 px-3 sm:px-4">{dynamicCols.height || 'Your Height'}</th>
                        <th className="py-3 px-3 sm:px-4">{dynamicCols.length || 'Abaya Length'}</th>
                        <th className="py-3 px-3 sm:px-4">{dynamicCols.bust || 'Bust Width'}</th>
                        <th className="py-3 px-3 sm:px-4">{dynamicCols.sleeve || 'Sleeve'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {dynamicSizeChart.map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 sm:px-4 font-bold text-primary font-mono">{row.size}</td>
                          <td className="py-2.5 px-3 sm:px-4 text-foreground/90 font-medium">
                            {formatDimension(row.height, sizeUnit)}
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-foreground/80">
                            {formatDimension(row.length, sizeUnit)}
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-foreground/80">
                            {formatDimension(row.bust, sizeUnit)}
                          </td>
                          <td className="py-2.5 px-3 sm:px-4 text-foreground/80">
                            {formatDimension(row.sleeve, sizeUnit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sizing & Measuring Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" /> How To Measure Length
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Measure from the highest point of your shoulder down to your ankle or shoe level. Abaya size numbers (e.g. 54) correspond directly to length in inches.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Modest Fit Ease
                    </h4>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Our abayas are designed with a graceful, modest drape featuring +4 to +6 inches of ease around the bust and hips for effortless modesty and comfort.
                    </p>
                  </div>
                </div>

                {/* Official Uploaded Graphic / Document File (if available) */}
                {chartFile && (
                  <div className="pt-2 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-foreground">Official Atelier Chart Graphic</h4>
                      <a
                        href={chartFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Open full size ↗
                      </a>
                    </div>
                    <img
                      src={chartFile}
                      alt="Official Size Chart"
                      className="w-full max-h-80 object-contain rounded-xl border border-border bg-white p-2 shadow-xs"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border flex justify-end bg-background">
                <button
                  type="button"
                  onClick={() => setShowSizeModal(false)}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Fullscreen High-Resolution Image Lightbox Modal with Zoom In / Zoom Out */}
      {isImageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setIsImageModalOpen(false);
            resetZoom();
          }}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-fade-in select-none"
        >
          {/* Top Bar with Title & Close */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl flex items-center justify-between z-20 pt-2 px-2 text-white"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-primary">
                High-Resolution Preview
              </span>
              <span className="text-xs text-white/60 font-light truncate max-w-xs sm:max-w-md">
                — {product.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsImageModalOpen(false);
                resetZoom();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md cursor-pointer border border-white/20"
              title="Close preview (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Center Image Container with Pan and Zoom */}
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              if (e.deltaY < 0) {
                handleZoomIn();
              } else {
                handleZoomOut();
              }
            }}
            onMouseDown={(e) => {
              if (zoomScale > 1) {
                setIsDragging(true);
                setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
              }
            }}
            onMouseMove={(e) => {
              if (isDragging && zoomScale > 1) {
                setPanOffset({
                  x: e.clientX - dragStart.x,
                  y: e.clientY - dragStart.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onDoubleClick={() => {
              if (zoomScale > 1) {
                resetZoom();
              } else {
                setZoomScale(2);
              }
            }}
            className={`relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-auto ${
              zoomScale > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            }`}
          >
            <img
              src={activeImage}
              alt={product.name}
              draggable={false}
              style={{
                transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl pointer-events-auto"
            />
          </div>

          {/* Bottom Floating Zoom Controls Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="z-20 pb-2 flex items-center gap-2 bg-neutral-900/90 border border-white/20 backdrop-blur-xl px-4 py-2 rounded-full text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 1}
              className="p-1.5 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut size={16} />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="px-2.5 py-0.5 rounded text-xs font-mono font-bold hover:bg-white/15 transition cursor-pointer min-w-[54px] text-center"
              title="Reset Zoom (100%)"
            >
              {Math.round(zoomScale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomScale >= 3.5}
              className="p-1.5 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn size={16} />
            </button>

            <div className="h-4 w-px bg-white/20 mx-1" />

            <button
              type="button"
              onClick={resetZoom}
              className="p-1.5 rounded-full hover:bg-white/15 transition cursor-pointer text-white/80 hover:text-white"
              title="Reset to 1x"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
