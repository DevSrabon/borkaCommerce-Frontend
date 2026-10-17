'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Mail, AlertCircle } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    order_id: string;
    order_number: string;
    total: number | string;
    currency: string;
  } | null>(null);

  useEffect(() => {
    if (!sessionId && !orderId) {
      setError('Missing session verification parameters.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function verifyPayment() {
      try {
        const res = await fetch(`${API_BASE_URL}/ecommerce/orders/verify-stripe-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, order_id: orderId }),
        });

        const data = await res.json();
        if (!res.ok || !data.paid) {
          if (data.status === 'unpaid' || data.paid === false) {
            // Payment was not completed, redirect to retry page
            router.replace(`/checkout/payment-retry?order_id=${data.order_id || orderId}&cancelled=true`);
            return;
          }
          throw new Error(data.message || 'Payment verification was unsuccessful.');
        }

        if (isMounted) {
          setOrderDetails({
            order_id: data.order_id,
            order_number: data.order_number,
            total: data.total,
            currency: data.currency || 'AED',
          });
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to verify payment with Stripe.');
          setLoading(false);
        }
      }
    }

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [sessionId, orderId, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="space-y-1">
          <h2 className="text-lg font-serif font-bold text-foreground">Confirming Payment with Stripe...</h2>
          <p className="text-xs text-muted-foreground">Please hold on while we secure your order confirmation.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-card border border-border rounded-2xl shadow-lg text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-foreground">Payment Verification Error</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          {orderId && (
            <Link
              href={`/checkout/payment-retry?order_id=${orderId}`}
              className="w-full py-2.5 btn-luxury rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Retry Payment or Switch to COD
            </Link>
          )}
          <Link
            href="/catalog"
            className="w-full py-2.5 bg-muted/40 hover:bg-muted text-foreground rounded-lg text-xs font-medium transition"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-12 px-4 py-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center space-y-4">
        <div className="mx-auto h-20 w-20 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg">
          <CheckCircle2 size={44} />
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} /> 256-bit Stripe Payment Verified
          </span>
          <h1 className="font-serif text-3xl font-bold text-foreground">Order Confirmed &amp; Paid!</h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Thank you for choosing Saba Al Wadi. Your payment has been securely confirmed, and our master tailors are now preparing your order.
          </p>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-xs text-muted-foreground">Order Reference</span>
          <span className="font-mono text-sm font-bold text-foreground">#{orderDetails?.order_number}</span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-xs text-muted-foreground">Amount Paid</span>
          <span className="font-serif text-base font-bold text-primary">
            {orderDetails?.currency} {Number(orderDetails?.total || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <span className="text-xs text-muted-foreground">Payment Method</span>
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Credit / Debit Card (Stripe)
          </span>
        </div>

        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-start gap-3 text-xs text-foreground/90">
          <Mail size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            A confirmation email containing your full order invoice and tailoring tracking information has been dispatched to your email address.
          </p>
        </div>
      </div>

      {/* Next Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/profile"
          className="flex-1 py-3 btn-luxury rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <span>Track Order in Profile</span>
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/catalog"
          className="flex-1 py-3 bg-muted/40 hover:bg-muted text-foreground border border-border rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition"
        >
          <ShoppingBag size={14} />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
