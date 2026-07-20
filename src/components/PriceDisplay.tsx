'use client';

import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface PriceDisplayProps {
  /** Base price in AED */
  aedPrice: number;
  /** Original price for strikethrough (AED) */
  aedCompare?: number | null;
  className?: string;
  compareClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ aedPrice, aedCompare, className, compareClassName, size = 'md' }: PriceDisplayProps) {
  const { formatPrice } = useCurrency();

  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl font-serif' : 'text-sm';

  return (
    <span className={`flex items-baseline gap-1.5 flex-wrap ${className || ''}`}>
      <span className={`font-semibold text-foreground ${sizeClass}`}>
        {formatPrice(aedPrice)}
      </span>
      {aedCompare && aedCompare > aedPrice && (
        <span className={`text-muted-foreground line-through text-[11px] ${compareClassName || ''}`}>
          {formatPrice(aedCompare)}
        </span>
      )}
    </span>
  );
}

interface DiscountedPriceProps {
  /** Discounted price in AED */
  discountedAed: number;
  /** Original price in AED */
  originalAed: number;
  offerName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DiscountedPrice({ discountedAed, originalAed, offerName, size = 'md' }: DiscountedPriceProps) {
  const { formatPrice } = useCurrency();
  const hasDiscount = discountedAed < originalAed;
  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl font-serif' : 'text-sm';

  return (
    <div className="space-y-0.5">
      {hasDiscount ? (
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`font-semibold text-primary ${sizeClass}`}>
            {formatPrice(discountedAed)}
          </span>
          <span className="text-muted-foreground line-through text-[11px]">
            {formatPrice(originalAed)}
          </span>
        </div>
      ) : (
        <span className={`font-semibold text-foreground ${sizeClass}`}>
          {formatPrice(originalAed)}
        </span>
      )}
      {hasDiscount && offerName && (
        <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">{offerName}</p>
      )}
    </div>
  );
}
