'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateQuantity, removeFromCart, applyCoupon, removeCoupon } from '../../store/cartSlice';
import { Trash2, ShoppingBag, Plus, Minus, Tag, Check, X } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { formatPrice } = useCurrency();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const coupon = useSelector((state: RootState) => state.cart.coupon);
  const token = useSelector((state: RootState) => state.auth.token);

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<{
    base_fee: number;
    final_fee: number;
    discount_amount: number;
    is_free: boolean;
    display_text: string;
    applied_rule: string | null;
    threshold_rule: string | null;
  } | null>(null);

  // Calculate Subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + item.discounted_price * item.quantity, 0);

  // Calculate Coupon Discount
  let discount = 0;
  if (coupon) {
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = subtotal * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }
    // Cap discount at subtotal
    discount = Math.min(discount, subtotal);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dynamic delivery calculation
  useEffect(() => {
    if (subtotal <= 0) {
      setShippingInfo(null);
      return;
    }
    fetch(`${API_BASE_URL}/ecommerce/shipping-calculator?subtotal=${subtotal}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.final_fee === 'number') {
          setShippingInfo(data);
        }
      })
      .catch(() => {
        // Fallback silently if offline
      });
  }, [subtotal]);

  if (!mounted) return null;

  const shipping = shippingInfo !== null ? shippingInfo.final_fee : (subtotal > 500 || subtotal === 0 ? 0 : 30.00);
  const tax = 0;
  const total = Number((subtotal - discount + shipping).toFixed(2));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess(false);

    if (!couponCode.trim()) return;

    if (!token) {
      setCouponError('Please login to apply coupons');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/promotions/validate-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode,
          order_subtotal: subtotal,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        dispatch(
          applyCoupon({
            code: data.code,
            discount_amount: data.discount_amount,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            minimum_amount: data.minimum_amount ?? undefined,
          })
        );
        setCouponSuccess(true);
        setCouponCode('');
      } else {
        setCouponError(data.message || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponError('Unable to validate coupon. Backend offline.');
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponSuccess(false);
  };

  const handleProceedToCheckout = () => {
    if (!token) {
      // Direct users to login page if they're checking out as guests
      router.push('/login?redirect=checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 bg-card rounded-full border border-border flex items-center justify-center text-muted">
          <ShoppingBag size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold">Your Shopping Bag is empty</h1>
          <p className="text-sm text-muted max-w-xs mx-auto font-light">
            Explore our custom collection of Abayas and Shaylas to start filling it.
          </p>
        </div>
        <Link href="/catalog" className="inline-block px-8 py-3.5 btn-luxury rounded-sm tracking-wider uppercase text-sm font-semibold">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex border border-border bg-card p-4 rounded-md gap-6 shadow-sm relative group">
              {/* Product Thumbnail */}
              <div className="h-32 w-24 shrink-0 bg-zinc-100 rounded overflow-hidden border border-border">
                <img src={item.image || ''} alt={item.name} className="h-full w-full object-cover object-center" />
              </div>

              {/* Product Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-sm text-foreground hover:text-primary transition line-clamp-1">
                    <Link href={`/product/${item.sku}`}>{item.name}</Link>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>

                  {/* Selected Attributes details */}
                  <div className="flex flex-wrap gap-x-3 mt-2 text-xs text-muted font-light">
                    {item.attributes.map((attr) => (
                      <span key={attr.name}>
                        {attr.name}: <strong className="font-medium text-foreground">{attr.value}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Adjust Quantities & Delete */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-border rounded">
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                      className="px-2 py-1.5 hover:bg-accent text-muted-foreground transition"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-4 text-xs font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                      className="px-2 py-1.5 hover:bg-accent text-muted-foreground transition"
                      disabled={item.quantity >= item.available_stock}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button
                    onClick={() => dispatch(removeFromCart(item.id))}
                    className="text-muted hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Price Details */}
              <div className="text-right flex flex-col justify-start">
                <span className="font-bold text-sm text-foreground">{formatPrice(item.discounted_price * item.quantity)}</span>
                {item.discounted_price < item.price && (
                  <span className="text-[10px] text-muted line-through font-light">{formatPrice(item.price * item.quantity)}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6">
            <h2 className="font-serif text-lg font-bold border-b border-border pb-3">Order Summary</h2>

            {/* Calculations rows */}
            <div className="space-y-3 text-sm font-light">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-foreground font-medium">{formatPrice(subtotal)}</span>
              </div>

              {coupon && (
                <div className="flex justify-between text-green-500 font-medium">
                  <span>Coupon Discount ({coupon.code})</span>
                  <span>- {formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-muted block">Shipping</span>
                  {shippingInfo?.applied_rule && (
                    <span className="text-[10px] text-green-500 block font-normal">
                      ✓ {shippingInfo.applied_rule}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {shipping === 0 ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                      FREE
                    </span>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-foreground font-medium">{formatPrice(shipping)}</span>
                      {shippingInfo && shippingInfo.discount_amount > 0 && (
                        <span className="text-[10px] text-muted line-through">
                          {formatPrice(shippingInfo.base_fee)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {shippingInfo?.threshold_rule && (
                <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium flex items-center gap-1.5">
                  <span>✈ {shippingInfo.threshold_rule}</span>
                </div>
              )}



              <div className="border-t border-border pt-4 flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary font-serif">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 btn-luxury rounded-sm tracking-wider uppercase text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>

          {/* Coupon Input Form */}
          <div className="bg-card border border-border p-6 rounded-md shadow-sm space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Tag size={14} className="text-primary" /> Apply Promo Coupon
            </h3>

            {coupon ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 p-3 rounded-md">
                <div className="flex items-center gap-2 text-green-500 text-xs">
                  <Check size={14} />
                  <span>Coupon <strong className="font-semibold">{coupon.code}</strong> applied!</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-muted hover:text-red-500 transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  className="flex-1 text-sm bg-background border border-border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="submit" className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold rounded uppercase tracking-wider transition">
                  Apply
                </button>
              </form>
            )}

            {couponError && <p className="text-xs text-red-500 font-semibold">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-green-500 font-semibold">Discount applied to your subtotal!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
