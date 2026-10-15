'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Star, CheckCircle, XCircle, Trash2, ShieldCheck, Filter, RefreshCw, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import AdminPagination from '../../../components/admin/AdminPagination';

interface AdminReview {
  id: string;
  rating: number;
  review: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function AdminReviewsPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Pagination states (default limit: 50, skip: 0)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      params.append('limit', limit.toString());
      params.append('skip', skip.toString());

      const url = `${API_BASE_URL}/admin/reviews?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const totalHeader = res.headers.get('x-total-count');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setReviews(items);
        if (totalHeader) {
          setTotalReviews(parseInt(totalHeader, 10));
        } else {
          setTotalReviews(items.length);
        }
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, page, limit]);

  useEffect(() => {
    if (token) fetchReviews();
  }, [token, fetchReviews]);

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reviews/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch (_) {
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (_) {}
  };

  const filteredReviews = reviews.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.product?.name.toLowerCase().includes(term) ||
      r.customer?.email.toLowerCase().includes(term) ||
      `${r.customer?.first_name} ${r.customer?.last_name}`.toLowerCase().includes(term) ||
      (r.review && r.review.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Ratings & Reviews Moderation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage, approve, and moderate verified buyer ratings and testimonials.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs hover:bg-accent transition text-foreground cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Controls & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                filterStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by product, customer, or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-3 py-2 sm:w-72 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Reviews Table / List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">
          Loading customer reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl py-16 flex flex-col items-center justify-center text-center space-y-2">
          <MessageSquare size={32} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No reviews found</p>
          <p className="text-xs text-muted-foreground font-light">
            {filterStatus !== 'ALL'
              ? `No reviews with status ${filterStatus}.`
              : 'Verified customer reviews will appear here once submitted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3 hover:border-primary/30 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${r.product?.slug}`}
                      target="_blank"
                      className="font-serif font-bold text-sm text-foreground hover:text-primary transition"
                    >
                      {r.product?.name}
                    </Link>
                    <span className="text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                      <ShieldCheck size={10} /> Verified Purchase
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By{' '}
                    <span className="font-medium text-foreground">
                      {r.customer?.first_name} {r.customer?.last_name}
                    </span>{' '}
                    ({r.customer?.email})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                      r.status === 'APPROVED'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : r.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-muted-foreground font-light">
                    {new Date(r.created_at).toLocaleDateString('en-AE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Star Rating & Review Text */}
              <div className="space-y-1.5">
                <div className="flex text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= r.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    ({r.rating}/5)
                  </span>
                </div>
                {r.review && (
                  <p className="text-xs text-foreground/90 leading-relaxed font-light bg-accent/20 p-3 rounded-lg border border-border/50">
                    "{r.review}"
                  </p>
                )}
              </div>

              {/* Moderation Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {r.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                      disabled={updatingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded text-xs font-semibold transition cursor-pointer"
                    >
                      <CheckCircle size={13} /> Approve Review
                    </button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                      disabled={updatingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded text-xs font-semibold transition cursor-pointer"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded transition cursor-pointer"
                  title="Delete review permanently"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination Controls ── */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border bg-card/60 rounded-xl text-xs mt-6">
          <div className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{reviews.length === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(page * limit, totalReviews || reviews.length)}</span> of{' '}
            <span className="font-semibold text-foreground">{totalReviews || reviews.length}</span> reviews
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <AdminPagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil((totalReviews || reviews.length) / limit))}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
