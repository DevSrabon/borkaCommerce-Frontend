'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Truck,
  XCircle,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string;
  price: number | string;
  quantity: number;
  subtotal: number | string;
  sku: string;
}

interface PaymentStatusResponse {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number | string;
  subtotal: number | string;
  shipping: number | string;
  discount: number | string;
  currency: string;
  created_at: string;
  remaining_seconds: number;
  is_expired: boolean;
  items?: OrderItem[];
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

function PaymentRetryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const wasCancelled = searchParams.get('cancelled') === 'true';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<PaymentStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Live countdown state
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No order ID provided.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadOrderStatus() {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/orders/${orderId}/payment-status`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Unable to load order payment status.');
        }

        const data: PaymentStatusResponse = await res.json();
        if (isMounted) {
          setOrder(data);
          setSecondsLeft(data.remaining_seconds || 0);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to fetch order details.');
          setLoading(false);
        }
      }
    }

    loadOrderStatus();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Live countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Mark order as expired locally
          if (order) {
            setOrder((o) => (o ? { ...o, is_expired: true, status: 'CANCELLED' } : null));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, order]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 1. Retry Card Payment
  const handleRetryStripe = async () => {
    if (!orderId) return;
    setActionLoading('stripe');
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/orders/${orderId}/retry-stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkout_url) {
        throw new Error(data.message || 'Failed to initialize Stripe checkout session.');
      }
      window.location.href = data.checkout_url;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open Stripe checkout.');
      setActionLoading(null);
    }
  };

  // 2. Switch to Cash on Delivery
  const handleSwitchToCod = async () => {
    if (!orderId) return;
    setActionLoading('cod');
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/orders/${orderId}/switch-to-cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to convert order to Cash on Delivery.');
      }
      setActionSuccess('Order switched to Cash on Delivery successfully! Confirmation email has been sent.');
      setTimeout(() => {
        router.push('/profile');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch to COD.');
      setActionLoading(null);
    }
  };

  // 3. Cancel Order
  const handleCancelOrder = async () => {
    if (!orderId) return;
    if (!confirm('Are you sure you want to cancel this order? Any reserved items will be released.')) return;
    setActionLoading('cancel');
    setErrorMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE_URL}/ecommerce/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to cancel order.');
      }
      setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED', is_expired: true } : null));
      setActionSuccess('Order cancelled successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Checking order payment status...</p>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-card border border-border rounded-2xl shadow-lg text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
          <ShieldAlert size={28} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-serif text-xl font-bold text-foreground">Order Status Notice</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">{errorMsg}</p>
        </div>
        <Link
          href="/catalog"
          className="inline-block px-6 py-2.5 btn-luxury rounded-lg text-xs font-semibold uppercase tracking-wider"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isExpired = order?.is_expired || order?.status === 'CANCELLED' || secondsLeft <= 0;

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 py-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Alert Header */}
      {actionSuccess ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-sm">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{actionSuccess} Redirecting to your orders profile...</span>
        </div>
      ) : isExpired ? (
        <div className="p-5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm">
            <XCircle size={18} />
            <span>Order Expired &amp; Cancelled</span>
          </div>
          <p className="text-xs text-red-400 leading-relaxed">
            The 30-minute payment window has expired. For inventory fairness, reserved abaya items have been released back to stock. Please place a new order if you would like to purchase.
          </p>
        </div>
      ) : (
        <div className="p-5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <AlertTriangle size={18} className="text-amber-500 shrink-0" />
              <span>{wasCancelled ? 'Payment Cancelled' : 'Payment Incomplete'}</span>
            </div>
            {/* Countdown Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-mono font-bold text-amber-500">
              <Clock size={13} className="animate-pulse" />
              <span>{formatTime(secondsLeft)} Remaining</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your items are held in reservation for <strong className="text-foreground">30 minutes</strong>. You can retry with a different card via Stripe or instantly switch to <strong className="text-foreground">Cash on Delivery</strong> to keep your order.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Summary Box */}
      {order && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm text-foreground">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <span className="text-xs text-muted-foreground block">Order Number</span>
              <span className="font-mono text-sm font-bold text-foreground">#{order.order_number}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Order Total</span>
              <span className="font-serif text-lg font-bold text-primary">
                {order.currency} {Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Items preview */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-2 py-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Items</span>
              <div className="divide-y divide-border/50 max-h-48 overflow-y-auto pr-1">
                {order.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-3">
                      <p className="font-medium text-foreground truncate">{item.product_name}</p>
                      <p className="text-muted-foreground text-[11px]">{item.variant_name} &bull; Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono font-semibold text-foreground whitespace-nowrap">
                      {order.currency} {Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isExpired ? (
        <div className="space-y-3 pt-2">
          {/* Button 1: Retry with Card */}
          <button
            type="button"
            onClick={handleRetryStripe}
            disabled={Boolean(actionLoading)}
            className="w-full py-3.5 btn-luxury rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            <CreditCard size={15} />
            <span>{actionLoading === 'stripe' ? 'Redirecting to Stripe...' : 'Retry Payment with Card (Stripe)'}</span>
          </button>

          {/* Button 2: Switch to COD */}
          <button
            type="button"
            onClick={handleSwitchToCod}
            disabled={Boolean(actionLoading)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Truck size={15} />
            <span>{actionLoading === 'cod' ? 'Converting to COD...' : 'Switch to Cash on Delivery (Pay at Doorstep)'}</span>
          </button>

          {/* Button 3: Cancel Order */}
          <button
            type="button"
            onClick={handleCancelOrder}
            disabled={Boolean(actionLoading)}
            className="w-full py-2.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
          >
            {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel This Order & Release Stock'}
          </button>
        </div>
      ) : (
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/catalog"
            className="flex-1 py-3 btn-luxury rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <ShoppingBag size={14} />
            <span>Explore Saba Al Wadi Abayas</span>
          </Link>
          <Link
            href="/profile"
            className="flex-1 py-3 bg-muted/40 hover:bg-muted text-foreground border border-border rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition"
          >
            <span>View My Account</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PaymentRetryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentRetryContent />
    </Suspense>
  );
}
