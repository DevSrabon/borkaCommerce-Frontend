'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Package, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  total: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  created_at: string;
  items: OrderItem[];
}

export default function ProfilePage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && !token) {
      router.push('/login');
    }
  }, [mounted, token]);

  useEffect(() => {
    if (!token) return;

    const fetchMyOrders = async () => {
      try {
        const res = await fetch('http://localhost:8080/ecommerce/orders/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        } else {
          loadMockOrders();
        }
      } catch (err) {
        loadMockOrders();
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [token]);

  const loadMockOrders = () => {
    setOrders([
      {
        id: 'mock-ord-1',
        order_number: 'BC-1721469032-4829',
        status: 'SHIPPED',
        total: 232.50, // classic black abaya + shipping
        payment_status: 'PAID',
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
        items: [
          {
            id: 'mock-item-1',
            product_name: 'Classic Black Nidha Abaya',
            variant_name: 'ABA-BLK-54-NID',
            sku: 'ABA-BLK-54-NID',
            price: 212.50,
            quantity: 1,
            subtotal: 212.50,
          },
        ],
      },
    ]);
  };

  if (!mounted || !user) return null;

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'CONFIRMED':
      case 'PACKED':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SHIPPED':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'DELIVERED':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-12">
      {/* Welcome Banner */}
      <div className="border border-border bg-card p-8 rounded-md shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">My Account Dashboard</span>
          <h1 className="font-serif text-3xl font-bold">Welcome, {user.first_name}!</h1>
          <p className="text-xs text-muted-foreground font-light">{user.email} &bull; {user.phone || 'No phone registered'}</p>
        </div>

        <div className="flex gap-4">
          <div className="px-4 py-2 border border-border rounded text-center">
            <span className="block text-xl font-serif font-bold text-primary">{orders.length}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Orders</span>
          </div>
          {user.email === 'srabon@example.com' || user.email === 'admin@example.com' ? (
            <Link href="/admin" className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium rounded text-xs tracking-wider flex items-center justify-center uppercase transition">
              Open Admin Panel
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-serif text-xl font-bold flex items-center gap-2 border-b border-border pb-3">
            <Package size={20} className="text-primary" /> Order History
          </h2>

          {loading ? (
            <p className="text-sm text-muted font-light">Loading orders list...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-md">
              <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
              <Link href="/catalog" className="text-primary text-xs font-semibold hover:underline mt-2 inline-block">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border border-border bg-card rounded-md overflow-hidden shadow-sm">
                  {/* Order Header */}
                  <div className="bg-background border-b border-border p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Order Number</span>
                      <span className="font-mono text-xs font-bold text-foreground">{order.order_number}</span>
                    </div>

                    <div className="flex gap-4 text-xs font-light">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-muted" />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-muted" />
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase font-semibold border px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="space-y-0.5">
                          <h4 className="font-medium text-xs text-foreground">{item.product_name}</h4>
                          <p className="text-[10px] text-muted-foreground font-mono">SKU: {item.sku} &bull; Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-xs">AED {item.subtotal}</span>
                      </div>
                    ))}

                    <div className="border-t border-border pt-4 flex justify-between items-center text-sm font-semibold">
                      <span className="text-muted text-xs font-light">Total Paid</span>
                      <span className="text-primary font-serif">AED {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold border-b border-border pb-3 flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Delivery Info
            </h3>

            {/* Quick delivery instructions mock details */}
            <div className="space-y-4 text-xs font-light text-muted-foreground leading-relaxed">
              <div className="space-y-1">
                <span className="font-medium text-foreground text-[10px] uppercase block tracking-wider">Default Shipping Address</span>
                <p className="border-l-2 border-primary/50 pl-3">
                  {user.first_name} {user.last_name} <br />
                  Marina Heights, Flat 12B <br />
                  Dubai Marina, Dubai, UAE <br />
                  Phone: {user.phone || '+971 50 123 4567'}
                </p>
              </div>

              <div className="space-y-1 pt-3 border-t border-border">
                <span className="font-medium text-foreground text-[10px] uppercase block tracking-wider">Shipping Method</span>
                <p>Aramex Express Delivery (1-2 Working Days in UAE)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';
