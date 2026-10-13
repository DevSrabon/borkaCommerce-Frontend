'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/cartSlice';
import { Check, Info, ShoppingBag, Truck, ShieldCheck, Clock, Star, Share2, Ruler, X } from 'lucide-react';
import { DiscountedPrice } from '../../../components/PriceDisplay';
import { API_BASE_URL } from '@/config/api';

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
      <span className="font-sans font-semibold uppercase tracking-wider text-[10px]">Flash Sale Ends In:</span>
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

interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  variants: Variant[];
  rating: { average: number; count: number };
  reviews: { id: string; rating: number; review: string; created_at: string; customer_name: string }[];
  is_cod_allowed?: boolean;
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

  const [selections, setSelections] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [activeImage, setActiveImage] = useState<string>(product.images[0] || '');
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
  const [siteSettings, setSiteSettings] = useState<Record<string, string> | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Product Image Section */}
      <div className="space-y-4">
        <div className="relative h-[32rem] sm:h-[40rem] w-full border border-border bg-zinc-100 rounded-md overflow-hidden">
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-cover object-center transition duration-300"
          />
        </div>
        {/* Thumbnails */}
        {(() => {
          const galleryImages = Array.from(new Set([
            ...(product.images || []),
            ...(selectedVariant?.images || [])
          ])).filter(Boolean);

          if (galleryImages.length <= 1) return null;

          return (
            <div className="flex gap-4 overflow-x-auto py-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-20 shrink-0 border rounded overflow-hidden transition ${
                    activeImage === img ? 'border-primary ring-1 ring-primary' : 'border-border opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover object-center" />
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Product Details Section */}
      <div className="space-y-6 lg:py-4">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-amber-500 text-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={15}
                  className={star <= Math.round(product.rating.average) ? 'fill-amber-500 text-amber-500' : 'text-zinc-600'}
                />
              ))}
            </div>
            <span className="font-bold text-sm text-foreground">{product.rating.average}</span>
            <a href="#reviews" className="text-xs text-muted hover:text-primary transition underline cursor-pointer">
              ({product.rating.count} Customer Reviews)
            </a>
          </div>
        </div>

        {/* Dynamic Pricing */}
        {selectedVariant ? (
          <div className="space-y-4 border-y border-border py-4">
            <div className="flex items-center justify-between">
              <DiscountedPrice
                discountedAed={selectedVariant.discounted_price}
                originalAed={selectedVariant.price}
                offerName={selectedVariant.offer?.name}
                size="lg"
              />

              <div className="text-right">
                {selectedVariant.available_stock <= 0 ? (
                  <span className="text-xs text-red-500 font-semibold px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded">
                    Out of Stock
                  </span>
                ) : selectedVariant.available_stock <= 5 ? (
                  <span className="text-xs text-amber-500 font-semibold px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded flex items-center gap-1">
                    <span>⚡ Only {selectedVariant.available_stock} left in stock!</span>
                  </span>
                ) : (
                  <span className="text-xs text-green-500 font-semibold px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded">
                    ✓ In Stock ({selectedVariant.available_stock} available)
                  </span>
                )}
              </div>
            </div>
            {selectedVariant.offer?.end_date && (
              <CountdownTimer endDate={selectedVariant.offer.end_date} />
            )}
          </div>
        ) : (
          <div className="border-y border-border py-4">
            <p className="text-sm text-muted">Select variant options below to see price and stock availability.</p>
          </div>
        )}

        {/* Variant Selectors */}
        <div className="space-y-6">
          {Object.keys(attributeOptions).map((attrName) => (
            <div key={attrName} className="space-y-2">
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
              <div className="flex flex-wrap gap-3">
                {attributeOptions[attrName].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSelectOption(attrName, val)}
                    className={`px-4 py-2 text-sm rounded border transition cursor-pointer ${
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
        <div className="pt-6 space-y-4">
          <div className="flex items-stretch gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.available_stock <= 0}
              className={`flex-1 py-4 rounded-md uppercase font-semibold text-sm flex items-center justify-center gap-2 transition ${
                selectedVariant && selectedVariant.available_stock > 0
                  ? 'btn-luxury cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
              }`}
            >
              <ShoppingBag size={18} />
              {selectedVariant
                ? selectedVariant.available_stock > 0
                  ? 'Add to Shopping Bag'
                  : 'Sold Out'
                : 'Select Variant Options'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-4 rounded-md border border-border bg-card hover:bg-accent text-foreground hover:text-primary flex items-center justify-center gap-2 transition cursor-pointer shadow-xs shrink-0"
              title="Share this product"
            >
              <Share2 size={18} />
              <span className="text-xs font-semibold uppercase hidden sm:inline">
                {shareSuccess ? 'Copied!' : 'Share'}
              </span>
            </button>
          </div>

          {shareSuccess && (
            <div className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/30 text-primary p-2.5 rounded-md">
              <Check size={14} />
              <span>Product link copied to clipboard!</span>
            </div>
          )}

          {addedAlert && (
            <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md transition duration-300">
              <Check size={14} />
              <span>Variant added to your Shopping Bag successfully! <a href="/cart" className="underline font-bold">View Bag</a></span>
            </div>
          )}

          {/* Dynamic Delivery Perks & Trust Card */}
          <div className="p-4 rounded-lg bg-card/70 border border-border space-y-3 shadow-xs">
            {/* Dynamic Delivery status */}
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={16} />
              </div>
              <div className="flex-1 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Express UAE &amp; GCC Delivery</span>
                  {shippingInfo && (
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      shippingInfo.is_free
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {shippingInfo.is_free ? 'FREE EXPRESS SHIPPING' : shippingInfo.display_text}
                    </span>
                  )}
                </div>
                {shippingInfo?.threshold_rule && (
                  <p className="text-[11px] text-amber-500 font-medium">
                    ✈ {shippingInfo.threshold_rule}
                  </p>
                )}
                {shippingInfo?.applied_rule && (
                  <p className="text-[11px] text-green-500 font-medium">
                    ✓ {shippingInfo.applied_rule}
                  </p>
                )}
                <p className="text-muted-foreground text-[11px]">
                  Estimated delivery within 24 to 48 business hours with live tracking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
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

        {/* Product Details description */}
        <div className="space-y-3 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Product Description</h3>
          <div 
            className="text-sm text-muted-foreground leading-relaxed font-light prose prose-sm dark:prose-invert prose-zinc max-w-none font-sans"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      </div>

      {/* Sizing Guide & Chart Modal */}
      {showSizeModal && (() => {
        const defaultSizes = [
          { size: '50', height: "5'0\" - 5'1\"", length: '50 in', bust: '40 in', sleeve: '26 in' },
          { size: '52', height: "5'2\" - 5'3\"", length: '52 in', bust: '42 in', sleeve: '27 in' },
          { size: '54', height: "5'4\" - 5'5\"", length: '54 in', bust: '44 in', sleeve: '28 in' },
          { size: '56', height: "5'6\" - 5'7\"", length: '56 in', bust: '46 in', sleeve: '29 in' },
          { size: '58', height: "5'8\" - 5'9\"", length: '58 in', bust: '48 in', sleeve: '30 in' },
          { size: '60', height: "5'10\"+", length: '60 in', bust: '50 in', sleeve: '31 in' },
        ];
        let sizeRows = defaultSizes;
        if (siteSettings?.size_chart_table) {
          try {
            const parsed = JSON.parse(siteSettings.size_chart_table);
            if (Array.isArray(parsed) && parsed.length > 0) sizeRows = parsed;
          } catch (_) {}
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-background">
                <div className="flex items-center gap-2">
                  <Ruler size={18} className="text-primary" />
                  <h2 className="font-serif text-lg font-bold">Abaya Sizing Guide &amp; Chart</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeModal(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                <p className="text-muted-foreground leading-relaxed bg-accent/30 p-3 rounded-lg border border-border">
                  {siteSettings?.size_chart_guide_text ||
                    'Abaya sizes represent length from shoulder to floor in inches. Please select based on your total height for a perfect floor-length drape.'}
                </p>

                {siteSettings?.size_chart_image && (
                  <div className="rounded-lg overflow-hidden border border-border my-2">
                    <img src={siteSettings.size_chart_image} alt="Size Guide Diagram" className="w-full object-contain max-h-60" />
                  </div>
                )}

                <div className="border border-border rounded-lg overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 font-semibold border-b border-border">
                      <tr>
                        <th className="p-2.5">Size</th>
                        <th className="p-2.5">Height</th>
                        <th className="p-2.5">Length</th>
                        <th className="p-2.5">Bust</th>
                        <th className="p-2.5">Sleeve</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sizeRows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-accent/20 transition">
                          <td className="p-2.5 font-bold text-primary">{row.size}</td>
                          <td className="p-2.5">{row.height}</td>
                          <td className="p-2.5">{row.length}</td>
                          <td className="p-2.5">{row.bust}</td>
                          <td className="p-2.5">{row.sleeve}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

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
    </div>
  );
}
