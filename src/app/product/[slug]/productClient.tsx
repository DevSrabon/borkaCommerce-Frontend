'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../../store/cartSlice';
import { Check, Info, ShoppingBag } from 'lucide-react';
import { DiscountedPrice } from '../../../components/PriceDisplay';

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

  // State to hold selected attributes
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [activeImage, setActiveImage] = useState<string>(product.images[0] || '');
  const [addedAlert, setAddedAlert] = useState(false);

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
            <span className="text-primary font-bold">★ {product.rating.average}</span>
            <span className="text-xs text-muted">({product.rating.count} Customer Reviews)</span>
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
                {selectedVariant.available_stock > 0 ? (
                  <span className="text-xs text-green-500 font-semibold px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
                    In Stock ({selectedVariant.available_stock} available)
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-semibold px-2 py-1 bg-red-500/10 border border-red-500/20 rounded">
                    Out of Stock
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
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{attrName}</h3>
              <div className="flex flex-wrap gap-3">
                {attributeOptions[attrName].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSelectOption(attrName, val)}
                    className={`px-4 py-2 text-sm rounded border transition ${
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

        {/* Add to Cart Actions */}
        <div className="pt-6 space-y-4">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.available_stock <= 0}
            className={`w-full py-4 rounded-md uppercase font-semibold text-sm flex items-center justify-center gap-2 transition ${
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

          {addedAlert && (
            <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md transition duration-300">
              <Check size={14} />
              <span>Variant added to your Shopping Bag successfully! <a href="/cart" className="underline font-bold">View Bag</a></span>
            </div>
          )}
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
    </div>
  );
}
