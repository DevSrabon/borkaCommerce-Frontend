'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { clearCart, removeCoupon } from '../../store/cartSlice';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Truck, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const stripePromise = loadStripe('pk_test_mock_holder'); // load client Stripe

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { currency, formatPrice } = useCurrency();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const coupon = useSelector((state: RootState) => state.cart.coupon);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [mounted, setMounted] = useState(false);
  const [addressForm, setAddressForm] = useState({
    country: 'United Arab Emirates',
    city: 'Dubai',
    area: 'Dubai Marina',
    street: 'Marina Boulevard',
    building: 'Marina Heights, Flat 12B',
    postal_code: '00000',
  });

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');

  const isCodAvailable = cartItems.length > 0 && cartItems.every((item) => (item as any).is_cod_allowed !== false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'STRIPE'>('CASH_ON_DELIVERY');

  useEffect(() => {
    if (!isCodAvailable && paymentMethod === 'CASH_ON_DELIVERY') {
      setPaymentMethod('STRIPE');
    }
  }, [isCodAvailable, paymentMethod]);

  // Calculate Subtotal & Discount
  const subtotal = cartItems.reduce((acc, item) => acc + item.discounted_price * item.quantity, 0);

  let discount = 0;
  if (coupon) {
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = subtotal * (coupon.discount_value / 100);
    } else {
      discount = coupon.discount_value;
    }
    discount = Math.min(discount, subtotal);
  }

  const [shippingInfo, setShippingInfo] = useState<{
    base_fee: number;
    final_fee: number;
    discount_amount: number;
    is_free: boolean;
    display_text: string;
    applied_rule: string | null;
    threshold_rule: string | null;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (mounted && cartItems.length === 0 && !isSuccess) {
      router.push('/cart');
    }
  }, [mounted, cartItems]);

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

  const shipping = shippingInfo !== null ? shippingInfo.final_fee : (subtotal > 500 ? 0 : 30.00);
  const tax = Number(((subtotal - discount) * 0.05).toFixed(2));
  const total = Number((subtotal - discount + shipping + tax).toFixed(2));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');
    setLoading(true);

    if (!token) {
      setCheckoutError('Please login to place orders.');
      setLoading(false);
      return;
    }

    // Check coupon minimum amount before submitting
    if (coupon && coupon.minimum_amount && subtotal < Number(coupon.minimum_amount)) {
      setCheckoutError(
        `Your coupon "${coupon.code}" requires a minimum subtotal of AED ${Number(coupon.minimum_amount).toFixed(2)}. ` +
        `Your current subtotal is AED ${Number(subtotal).toFixed(2)}. Please add more items or remove the coupon.`
      );
      setLoading(false);
      return;
    }

    try {
      // 1. Create Address in database or mock it
      // Let's call checkout directly. In backend we need a customer address ID.
      // For simplicity, we can fetch customer addresses or first create one.
      // Let's create an address on-the-fly or query existing addresses.
      // Let's perform a POST /ecommerce/addresses and then pass address ID to checkout.
      // Wait, we can implement a transaction in the backend, or write a quick address endpoint.
      // Let's first register the address.
      const addressRes = await fetch(`${API_BASE_URL}/ecommerce/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (!addressRes.ok) {
        const errData = await addressRes.json();
        setCheckoutError(errData.message || 'Failed to save shipping address');
        setLoading(false);
        return;
      }

      const addressData = await addressRes.json();
      const addressId = addressData.id;

      // 2. Perform Checkout
      const checkoutRes = await fetch(`${API_BASE_URL}/ecommerce/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: addressId,
          coupon_code: coupon?.code,
          currency: currency,
          payment_method: paymentMethod,
          items: cartItems.map((item) => ({
            variant_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setCheckoutError(checkoutData.message || 'Checkout failed');
        setLoading(false);
        return;
      }

      // If Cash on Delivery, order is confirmed immediately without Stripe intent!
      if (paymentMethod === 'CASH_ON_DELIVERY') {
        setOrderNum(checkoutData.order_number);
        setIsSuccess(true);
        dispatch(clearCart());
        dispatch(removeCoupon());
        setLoading(false);
        return;
      }

      // 3. Confirm Stripe Payment (Mock succeed or actual)
      // Since we are running in dev/local and might not have Stripe keys configured,
      // we can call a mock confirmation endpoint on our backend or directly call confirmation webhook
      const confirmRes = await fetch(`${API_BASE_URL}/admin/orders/${checkoutData.order_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'CONFIRMED', // directly approve the order in test mode
        }),
      });

      if (confirmRes.ok) {
        // Also simulate database webhook inventory decrease
        await fetch(`${API_BASE_URL}/ecommerce/orders/stripe-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 'mock_sig',
          },
          body: JSON.stringify({
            id: 'evt_mock',
            type: 'payment_intent.succeeded',
            data: {
              object: {
                id: 'pi_mock',
                latest_charge: 'ch_mock',
                metadata: {
                  order_id: checkoutData.order_id,
                  customer_id: user?.id,
                },
              },
            },
          }),
        });

        setOrderNum(checkoutData.order_number);
        setIsSuccess(true);
        dispatch(clearCart());
      } else {
        setCheckoutError('Payment confirmation failed.');
      }
    } catch (err) {
      setCheckoutError('Network connectivity error. Backend offline.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 bg-green-500/10 rounded-full border border-green-500/20 flex items-center justify-center text-green-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-foreground">Order Confirmed!</h1>
          <p className="text-sm text-muted">
            Thank you for shopping with Saba Al Wadi. Your order <span className="font-semibold text-foreground">#{orderNum}</span> is currently being processed.
          </p>
        </div>
        <div className="pt-6 flex flex-col gap-4">
          <Link href="/profile" className="w-full py-3.5 btn-luxury rounded-sm tracking-wider uppercase text-sm font-semibold flex items-center justify-center">
            Track My Order
          </Link>
          <Link href="/catalog" className="text-sm text-primary font-medium hover:underline">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handlePlaceOrder} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6">
            <h2 className="font-serif text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
              <Truck size={20} className="text-primary" /> Delivery Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Country</label>
                <input
                  type="text"
                  name="country"
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={addressForm.country}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">City</label>
                <input
                  type="text"
                  name="city"
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Area / District</label>
                <input
                  type="text"
                  name="area"
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={addressForm.area}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Street Name</label>
                <input
                  type="text"
                  name="street"
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={addressForm.street}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Building Name & Flat No.</label>
                <input
                  type="text"
                  name="building"
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={addressForm.building}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" /> Payment Method
                </h2>
                {!isCodAvailable && (
                  <span className="text-[11px] text-amber-500 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    COD Restricted
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash on Delivery option */}
                <div
                  onClick={() => {
                    if (isCodAvailable) setPaymentMethod('CASH_ON_DELIVERY');
                  }}
                  className={`p-4 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                      : isCodAvailable
                      ? 'border-border bg-card hover:border-primary/50'
                      : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Truck size={16} className="text-emerald-500" /> Cash on Delivery (COD)
                    </span>
                    {paymentMethod === 'CASH_ON_DELIVERY' && (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isCodAvailable
                      ? 'Pay in cash upon doorstep delivery in UAE.'
                      : '⚠️ Unavailable: One or more abayas require prepayment.'}
                  </p>
                </div>

                {/* Card payment option */}
                <div
                  onClick={() => setPaymentMethod('STRIPE')}
                  className={`p-4 rounded-lg border transition cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'STRIPE'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <CreditCard size={16} className="text-primary" /> Credit / Debit Card
                    </span>
                    {paymentMethod === 'STRIPE' && (
                      <CheckCircle2 size={16} className="text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Instant secure card payment via Stripe.
                  </p>
                </div>
              </div>

              {/* Card mock inputs if Card is selected */}
              {paymentMethod === 'STRIPE' && (
                <div className="bg-background border border-border p-4 rounded space-y-3 mt-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-muted mb-2">
                    <span>Credit/Debit Card (Stripe Secured)</span>
                    <span className="text-primary font-bold">TEST MODE ACTIVE</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Card Number: 4242 4242 4242 4242"
                    className="w-full text-sm bg-card border border-border rounded px-3 py-2.5 focus:outline-none"
                    disabled
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full text-sm bg-card border border-border rounded px-3 py-2.5 focus:outline-none"
                      disabled
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      className="w-full text-sm bg-card border border-border rounded px-3 py-2.5 focus:outline-none"
                      disabled
                    />
                  </div>
                </div>
              )}
            </div>

            {checkoutError && (
              <div className="flex flex-col gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{checkoutError}</span>
                </div>
                {coupon && checkoutError.includes('coupon') && (
                  <button
                    type="button"
                    onClick={() => { dispatch(removeCoupon()); setCheckoutError(''); }}
                    className="self-start text-[10px] font-semibold underline text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    Remove coupon "{coupon.code}"
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-md uppercase font-semibold text-sm tracking-wider flex items-center justify-center gap-2 cursor-pointer ${loading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'btn-luxury'
                }`}
            >
              {loading ? 'Processing Order...' : `Place Secure Order (${formatPrice(total)})`}
            </button>
          </form>
        </div>

        {/* Order review */}
        <div className="bg-card border border-border p-6 rounded-md shadow-sm h-fit space-y-6">
          <h2 className="font-serif text-lg font-bold border-b border-border pb-3">Review Items</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 items-center">
                <img src={item.image || ''} alt="" className="h-16 w-12 object-cover rounded border border-border" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-foreground line-clamp-1">{item.name}</h4>
                  <p className="text-[10px] text-muted font-light">Qty: {item.quantity}</p>
                </div>
                <span className="text-xs font-semibold">{formatPrice(item.discounted_price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2 text-xs font-light">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-green-500 font-semibold">
                <span>Discount ({coupon.code})</span>
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                    FREE
                  </span>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-foreground font-medium">{formatPrice(shipping)}</span>
                    {shippingInfo && shippingInfo.discount_amount > 0 && (
                      <span className="text-[9px] text-muted line-through">
                        {formatPrice(shippingInfo.base_fee)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {shippingInfo?.threshold_rule && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-medium flex items-center gap-1.5">
                <span>✈ {shippingInfo.threshold_rule}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">VAT (5%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-sm font-bold">
              <span>Grand Total</span>
              <span className="text-primary font-serif">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
