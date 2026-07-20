'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { DollarSign, PackageOpen, AlertTriangle, Clock, RefreshCw, Eye, Trash2, TrendingUp, Users, Image, Settings } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  customer: { first_name: string; last_name: string; email: string };
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  DELIVERED:  'bg-green-500/10 text-green-500 border-green-500/20',
  SHIPPED:    'bg-purple-500/10 text-purple-500 border-purple-500/20',
  CONFIRMED:  'bg-blue-500/10 text-blue-500 border-blue-500/20',
  PACKED:     'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  PENDING:    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  CANCELLED:  'bg-red-500/10 text-red-500 border-red-500/20',
  REFUNDED:   'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const QUICK_LINKS = [
  { href: '/admin/banners',  icon: Image,    label: 'Manage Banners',   desc: 'Edit homepage hero slides' },
  { href: '/admin/products', icon: PackageOpen, label: 'Products',      desc: 'Add or update products' },
  { href: '/admin/customers',icon: Users,    label: 'Customers',        desc: 'View customer list' },
  { href: '/admin/settings', icon: Settings, label: 'Site Settings',    desc: 'SEO, logo, favicon' },
];

export default function AdminDashboard() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/admin/orders', {
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
      await fetch(`http://localhost:8080/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o)));
    } catch (_) {}
    finally { setUpdatingId(null); }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Delete this order permanently?')) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (_) {}
  };

  const totalRevenue = orders.filter((o) => o.payment_status === 'PAID').reduce((a, o) => a + Number(o.total), 0);
  const pendingCount  = orders.filter((o) => o.status === 'PENDING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground font-light mt-0.5">Real-time store overview and order management.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-xs border border-border px-3 py-2 rounded-md hover:bg-accent transition cursor-pointer"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: `AED ${totalRevenue.toFixed(2)}`, icon: DollarSign,     color: 'text-primary',      bg: 'bg-primary/10' },
          { label: 'Total Orders',  value: orders.length,                    icon: PackageOpen,     color: 'text-blue-500',     bg: 'bg-blue-500/10' },
          { label: 'Pending',       value: pendingCount,                     icon: Clock,           color: 'text-yellow-500',   bg: 'bg-yellow-500/10' },
          { label: 'Delivered',     value: deliveredCount,                   icon: TrendingUp,      color: 'text-green-500',    bg: 'bg-green-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border p-5 rounded-lg shadow-sm flex items-center gap-4">
            <div className={`h-11 w-11 rounded-full flex items-center justify-center ${bg}`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
              <p className="text-xl font-serif font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Module Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_LINKS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-card border border-border p-4 rounded-lg hover:border-primary/40 hover:shadow-md transition-all group space-y-2"
          >
            <div className="h-9 w-9 bg-primary/10 rounded-md flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
              <Icon size={16} />
            </div>
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground font-light">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders Table */}
      <section className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-background">
          <h2 className="font-serif text-base font-bold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-primary hover:underline font-medium">View All →</Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted animate-pulse">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border text-[10px]">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 10).map((ord) => (
                  <tr key={ord.id} className="hover:bg-accent/30 transition">
                    <td className="px-5 py-3 font-mono font-bold text-foreground">{ord.order_number}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{ord.customer.first_name} {ord.customer.last_name}</p>
                      <p className="text-muted-foreground text-[10px]">{ord.customer.email}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold">AED {Number(ord.total).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        ord.payment_status === 'PAID'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>{ord.payment_status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_COLORS[ord.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {updatingId === ord.id ? (
                          <span className="text-muted text-[10px]">Saving…</span>
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
                          onClick={() => handleDeleteOrder(ord.id)}
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
      </section>
    </div>
  );
}
