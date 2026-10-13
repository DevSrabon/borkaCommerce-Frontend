'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Star, ShieldCheck, CheckCircle, AlertCircle, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';

interface ReviewItem {
  id: string;
  rating: number;
  review: string | null;
  status: string;
  created_at: string;
  customer_name: string;
  is_verified_buyer: boolean;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  distribution: { [key: number]: number };
}

interface Props {
  productId: string;
  initialReviews?: any[];
}

export default function ReviewSection({ productId, initialReviews = [] }: Props) {
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [reviews, setReviews] = useState<ReviewItem[]>(
    initialReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      review: r.review,
      status: r.status || 'APPROVED',
      created_at: r.created_at,
      customer_name: r.customer_name || 'Customer',
      is_verified_buyer: true,
    }))
  );

  const [stats, setStats] = useState<ReviewStats>({
    total_reviews: initialReviews.length,
    average_rating:
      initialReviews.length > 0
        ? Number(
            (
              initialReviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
              initialReviews.length
            ).toFixed(1)
          )
        : 5.0,
    distribution: { 5: initialReviews.length, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [eligibility, setEligibility] = useState<{
    has_purchased: boolean;
    can_review: boolean;
    existing_review: any | null;
  } | null>(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProductReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/reviews/product/${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (_) {}
  };

  const checkEligibility = async () => {
    if (!token) {
      setEligibility(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/reviews/can-review/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
        if (data.existing_review) {
          setRating(data.existing_review.rating);
          setComment(data.existing_review.review || '');
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchProductReviews();
  }, [productId]);

  useEffect(() => {
    checkEligibility();
  }, [productId, token]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          rating,
          review: comment.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Thank you! Your rating and verified review have been submitted successfully.');
        await fetchProductReviews();
        await checkEligibility();
      } else {
        setError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setError('Connection error. Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="border-t border-border pt-12 space-y-10 scroll-mt-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">Customer Ratings & Reviews</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Authentic reviews from verified buyers across the UAE.</p>
        </div>
      </div>

      {/* Ratings Overview Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Average Score */}
        <div className="text-center md:border-r border-border md:pr-6 space-y-2">
          <div className="text-5xl font-serif font-bold text-foreground">
            {stats.average_rating > 0 ? stats.average_rating : '5.0'}
          </div>
          <div className="flex justify-center text-amber-400 gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={18}
                fill={star <= Math.round(stats.average_rating || 5) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-light">
            Based on {stats.total_reviews} verified {stats.total_reviews === 1 ? 'buyer review' : 'buyer reviews'}
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((num) => {
            const count = stats.distribution?.[num] || 0;
            const pct = stats.total_reviews > 0 ? Math.round((count / stats.total_reviews) * 100) : 0;
            return (
              <div key={num} className="flex items-center gap-3">
                <span className="w-12 text-muted-foreground font-medium flex items-center gap-1">
                  {num} <Star size={11} fill="currentColor" className="text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write a Review Section (Purchased-only gate) */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare size={18} className="text-primary" />
          {eligibility?.existing_review ? 'Update Your Review' : 'Write a Product Review'}
        </h3>

        {!token ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-accent/40 border border-border">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">Have you purchased this product?</p>
              <p className="text-xs text-muted-foreground font-light">
                Sign in to your account to verify your order and leave a rating.
              </p>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider shrink-0"
            >
              Sign In to Review
            </Link>
          </div>
        ) : eligibility === null ? (
          <p className="text-xs text-muted-foreground animate-pulse">Checking purchase verification...</p>
        ) : !eligibility.has_purchased ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500">
            <ShieldCheck size={18} className="shrink-0" />
            <div>
              <p className="font-semibold">Verified Purchase Only</p>
              <p className="text-[11px] text-amber-500/90 font-light mt-0.5">
                Reviews are reserved for customers who have placed an order for this abaya. Once you receive your order, you can share your feedback here!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-md w-fit font-medium">
              <ShieldCheck size={14} /> Verified Buyer Confirmed
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-md">
                <AlertCircle size={14} /> <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
                <CheckCircle size={14} /> <span>{success}</span>
              </div>
            )}

            {/* Interactive Stars */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Overall Rating *
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    aria-label={`${star} Stars`}
                  >
                    <Star
                      size={24}
                      fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2 font-medium">
                  {rating === 5 && 'Outstanding ★★★★★'}
                  {rating === 4 && 'Very Good ★★★★☆'}
                  {rating === 3 && 'Average ★★★☆☆'}
                  {rating === 2 && 'Fair ★★☆☆☆'}
                  {rating === 1 && 'Poor ★☆☆☆☆'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Your Review Feedback
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on fabric quality, tailoring, fit, and elegance..."
                className="w-full text-xs bg-background border border-border rounded-lg p-3.5 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60"
            >
              <Send size={13} /> {submitting ? 'Submitting...' : eligibility.existing_review ? 'Update Review' : 'Publish Review'}
            </button>
          </form>
        )}
      </div>

      {/* Customer Reviews List */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground">
          Verified Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground font-light">
            No approved reviews published yet. Be the first verified buyer to leave a review!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-card border border-border p-5 rounded-xl space-y-3 shadow-sm hover:border-primary/40 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-xs text-foreground block">{rev.customer_name}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-500 font-semibold mt-0.5">
                      <ShieldCheck size={11} /> Verified Buyer
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(rev.created_at).toLocaleDateString('en-AE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      fill={s <= rev.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>

                {rev.review && (
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    "{rev.review}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
