'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { RefreshCw, Eye, Trash2, Search, PlusCircle, Truck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import CreateManualOrderModal from '@/components/admin/CreateManualOrderModal';

interface Order {
  id: string;
  order_number: string;
  customer: { first_name: string; last_name: string; email: string };
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  delivery_partner?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  created_at: string;
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

export default function OrdersAdminPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders(await res.json());
    } catch (_) {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o)));
    } catch (_) {}
    finally { setUpdatingId(null); }
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

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q) ||
      `${o.customer.first_name} ${o.customer.last_name}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Orders</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{orders.length} total orders in the system.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3.5 py-2 rounded-md transition shadow-xs cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Create Manual Order</span>
          </button>
          <button onClick={fetchOrders} className="flex items-center gap-2 text-xs border border-border px-3 py-2 rounded-md hover:bg-accent transition cursor-pointer">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by order #, customer name or email…"
          className="w-full pl-9 pr-3 py-2.5 text-xs bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border text-[10px]">
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Courier / Tracking</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-accent/30 transition">
                    <td className="px-5 py-3 font-mono font-bold text-foreground">{ord.order_number}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{ord.customer.first_name} {ord.customer.last_name}</p>
                      <p className="text-muted-foreground text-[10px]">{ord.customer.email}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(ord.created_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 font-semibold">AED {Number(ord.total).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${ord.payment_status === 'PAID' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        {ord.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_COLORS[ord.status] || ''}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {ord.delivery_partner ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Truck size={12} className="text-primary" />
                            {ord.delivery_partner}
                          </span>
                          {ord.tracking_number && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
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
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {updatingId === ord.id ? (
                          <span className="text-muted-foreground text-[10px]">Saving…</span>
                        ) : (
                          <select
                            className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none cursor-pointer"
                            value={ord.status}
                            onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          >
                            {['PENDING','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                        <Link href={`/admin/orders/${ord.id}`} className="p-1.5 border border-border rounded hover:bg-accent text-muted-foreground hover:text-foreground transition">
                          <Eye size={12} />
                        </Link>
                        <button
                          onClick={() => handleDelete(ord.id)}
                          className="p-1.5 border border-border rounded text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
