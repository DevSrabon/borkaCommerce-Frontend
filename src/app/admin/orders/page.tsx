'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
  RefreshCw,
  Eye,
  Trash2,
  Search,
  PlusCircle,
  Truck,
  ExternalLink,
  Calendar,
  Filter,
  X,
  Factory,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import CreateManualOrderModal from '@/components/admin/CreateManualOrderModal';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name?: string;
  sku?: string;
  quantity: number;
  price: number;
  variant?: {
    images?: { image: string }[];
    product?: {
      name?: string;
      images?: { image_url: string; is_thumbnail?: boolean }[];
    };
  };
}

interface Order {
  id: string;
  order_number: string;
  production_no?: string | null;
  customer: { first_name: string; last_name: string; email: string };
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  delivery_partner?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  created_at: string;
  items?: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'bg-green-500/10 text-green-500 border-green-500/20',
  SHIPPED:   'bg-purple-500/10 text-purple-500 border-purple-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  PACKED:    'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  PENDING:   'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  REFUNDED:  'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const STATUS_OPTIONS = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const getItemFeaturedImage = (item: OrderItem) => {
  const variantImg = item.variant?.images?.[0]?.image;
  if (variantImg) {
    return variantImg.startsWith('http') ? variantImg : `${API_BASE_URL}${variantImg.startsWith('/') ? '' : '/'}${variantImg}`;
  }
  const thumb = item.variant?.product?.images?.find((img) => img.is_thumbnail)?.image_url;
  if (thumb) {
    return thumb.startsWith('http') ? thumb : `${API_BASE_URL}${thumb.startsWith('/') ? '' : '/'}${thumb}`;
  }
  const first = item.variant?.product?.images?.[0]?.image_url;
  if (first) {
    return first.startsWith('http') ? first : `${API_BASE_URL}${first.startsWith('/') ? '' : '/'}${first}`;
  }
  return '';
};

export default function OrdersAdminPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [generatingProdId, setGeneratingProdId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showManualModal, setShowManualModal] = useState(false);

  // Pagination states (default limit: 50, skip: 0)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (search.trim()) params.append('search', search.trim());
      params.append('limit', limit.toString());
      params.append('skip', ((page - 1) * limit).toString());

      const url = `${API_BASE_URL}/admin/orders?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const totalHeader = res.headers.get('x-total-count');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setOrders(items);
        if (totalHeader) {
          setTotalOrders(parseInt(totalHeader, 10));
        } else {
          setTotalOrders(items.length);
        }
      }
    } catch (_) {}
    finally {
      setLoading(false);
    }
  }, [token, selectedStatus, startDate, endDate, search, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o))
      );
    } catch (_) {}
    finally {
      setUpdatingId(null);
    }
  };

  const handleGenerateProductionNo = async (orderId: string) => {
    setGeneratingProdId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/generate-production-no`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, production_no: data.production_no } : o))
        );
      }
    } catch (_) {}
    finally {
      setGeneratingProdId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order permanently?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (_) {}
  };

  // Quick Date Preset Handler
  const setDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const todayStr = toYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'week') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(toYMD(w));
      setEndDate(toYMD(now));
    } else if (preset === 'month') {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toYMD(m));
      setEndDate(toYMD(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    Boolean(search) || selectedStatus !== 'ALL' || Boolean(startDate) || Boolean(endDate);

  // Client-side instant filter computation
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Search filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchNum = o.order_number?.toLowerCase().includes(q);
        const matchProd = o.production_no?.toLowerCase().includes(q);
        const matchEmail = o.customer?.email?.toLowerCase().includes(q);
        const matchName = `${o.customer?.first_name || ''} ${o.customer?.last_name || ''}`
          .toLowerCase()
          .includes(q);

        if (!matchNum && !matchProd && !matchEmail && !matchName) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && o.status !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (startDate) {
        const orderDate = new Date(o.created_at);
        const start = new Date(`${startDate}T00:00:00.000Z`);
        if (orderDate < start) return false;
      }
      if (endDate) {
        const orderDate = new Date(o.created_at);
        const end = new Date(`${endDate}T23:59:59.999Z`);
        if (orderDate > end) return false;
      }

      return true;
    });
  }, [orders, search, selectedStatus, startDate, endDate]);

  // Compute status counts across all loaded orders
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Compute summary stats for the filtered set
  const filteredTotalRevenue = useMemo(() => {
    return filtered.reduce((acc, o) => acc + Number(o.total || 0), 0);
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer purchases, workshop production IDs, and logistics tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3.5 py-2 rounded-md transition shadow-xs cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Create Manual Order</span>
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 text-xs border border-border px-3 py-2 rounded-md hover:bg-accent transition cursor-pointer"
            title="Refresh order records"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs scrollbar-thin">
        {STATUS_OPTIONS.map((st) => {
          const count = statusCounts[st] || 0;
          const isActive = selectedStatus === st;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span>{st === 'ALL' ? 'All Orders' : st}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date Range, Search & Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Order # (SW...), Production # (P-...), or customer name/email…"
              className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1.5 rounded-lg text-xs shadow-xs">
              <Calendar size={13} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-background border border-border px-2.5 py-1.5 rounded-lg text-xs shadow-xs">
              <Calendar size={13} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className="px-2 py-1 text-[11px] rounded bg-muted/60 hover:bg-muted text-foreground transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('yesterday')}
                className="px-2 py-1 text-[11px] rounded bg-muted/60 hover:bg-muted text-foreground transition cursor-pointer"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('week')}
                className="px-2 py-1 text-[11px] rounded bg-muted/60 hover:bg-muted text-foreground transition cursor-pointer"
              >
                Last 7d
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('month')}
                className="px-2 py-1 text-[11px] rounded bg-muted/60 hover:bg-muted text-foreground transition cursor-pointer"
              >
                This Month
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Metrics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              Showing <strong className="text-foreground">{filtered.length}</strong> of{' '}
              {orders.length} orders
            </span>
            <span>•</span>
            <span>
              Filtered Revenue:{' '}
              <strong className="text-foreground font-mono">
                AED {filteredTotalRevenue.toFixed(2)}
              </strong>
            </span>
          </div>

          {/* Quick Active Indicators */}
          {(startDate || endDate || selectedStatus !== 'ALL') && (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              {selectedStatus !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Status: {selectedStatus}
                  <X
                    size={11}
                    className="cursor-pointer hover:opacity-70"
                    onClick={() => setSelectedStatus('ALL')}
                  />
                </span>
              )}
              {startDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                  From: {startDate}
                  <X
                    size={11}
                    className="cursor-pointer hover:opacity-70"
                    onClick={() => setStartDate('')}
                  />
                </span>
              )}
              {endDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                  To: {endDate}
                  <X
                    size={11}
                    className="cursor-pointer hover:opacity-70"
                    onClick={() => setEndDate('')}
                  />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-muted-foreground animate-pulse space-y-2">
            <RefreshCw size={20} className="animate-spin mx-auto text-primary" />
            <p>Loading orders with production records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground space-y-3">
            <p className="text-sm font-medium text-foreground">No orders found matching your filters.</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your date range, status selector, or search keyword.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border text-xs">
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-4 py-3">Production #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Courier / Tracking</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-accent/30 transition">
                    {/* Order Number (e.g. SW20250001) */}
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="font-mono font-bold text-foreground hover:text-primary transition underline decoration-dotted"
                      >
                        {ord.order_number}
                      </Link>
                    </td>

                    {/* Production Number (e.g. P-1000) */}
                    <td className="px-4 py-3">
                      {ord.production_no ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 shadow-2xs"
                          title="Workshop & Tailoring Production Number"
                        >
                          <Factory size={11} className="text-amber-500" />
                          <span>{ord.production_no}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGenerateProductionNo(ord.id)}
                          disabled={generatingProdId === ord.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition cursor-pointer"
                          title="Generate workshop production ID"
                        >
                          {generatingProdId === ord.id ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : (
                            <Sparkles size={10} />
                          )}
                          <span>Generate</span>
                        </button>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">
                        {ord.customer?.first_name} {ord.customer?.last_name}
                      </p>
                      <p className="text-muted-foreground text-xs">{ord.customer?.email}</p>
                    </td>

                    {/* Items */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-[180px]">
                        {(ord.items || []).slice(0, 3).map((item, idx) => {
                          const img = getItemFeaturedImage(item);
                          return (
                            <div
                              key={item.id || idx}
                              className="relative w-9 h-9 rounded-md overflow-hidden bg-muted border border-border shrink-0 shadow-xs"
                              title={`${item.product_name} (${item.quantity}x)`}
                            >
                              {img ? (
                                <img
                                  src={img}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-semibold bg-muted/50">
                                  Item
                                </div>
                              )}
                              {item.quantity > 1 && (
                                <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] font-bold px-1 rounded-tl">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {(ord.items?.length || 0) > 3 && (
                          <span className="text-xs text-muted-foreground font-semibold">
                            +{ord.items!.length - 3}
                          </span>
                        )}
                        {(!ord.items || ord.items.length === 0) && (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(ord.created_at).toLocaleDateString('en-AE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      AED {Number(ord.total).toFixed(2)}
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          ord.payment_status === 'PAID'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}
                      >
                        {ord.payment_status}
                      </span>
                    </td>

                    {/* Status with Quick Update */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                          STATUS_COLORS[ord.status] || ''
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    {/* Courier / Tracking */}
                    <td className="px-4 py-3">
                      {ord.delivery_partner ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Truck size={12} className="text-primary" />
                            {ord.delivery_partner}
                          </span>
                          {ord.tracking_number && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                              <span>#{ord.tracking_number}</span>
                              {ord.tracking_url && (
                                <a
                                  href={ord.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center"
                                  title="Track package"
                                >
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {updatingId === ord.id ? (
                          <span className="text-muted-foreground text-xs animate-pulse">Saving…</span>
                        ) : (
                          <select
                            className="bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
                            value={ord.status}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.filter((s) => s !== 'ALL').map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="p-1.5 border border-border rounded hover:bg-accent text-muted-foreground hover:text-foreground transition shadow-2xs"
                          title="View order details"
                        >
                          <Eye size={13} />
                        </Link>
                        <button
                          onClick={() => handleDelete(ord.id)}
                          className="p-1.5 border border-border rounded text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition cursor-pointer shadow-2xs"
                          title="Delete order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Pagination Controls ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border bg-card/60 text-xs">
              <div className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{orders.length === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-foreground">{Math.min(page * limit, totalOrders || orders.length)}</span> of{' '}
                <span className="font-semibold text-foreground">{totalOrders || orders.length}</span> orders
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 border border-border rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium"
                  >
                    Previous
                  </button>
                  <span className="px-2 py-1 text-muted-foreground">
                    Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                    <span className="font-semibold text-foreground">{Math.max(1, Math.ceil((totalOrders || orders.length) / limit))}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= (totalOrders || orders.length)}
                    className="px-2.5 py-1 border border-border rounded hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateManualOrderModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onOrderCreated={() => fetchOrders()}
        token={token}
      />
    </div>
  );
}
