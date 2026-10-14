'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSession } from '../../store/authSlice';
import { Package, MapPin, Calendar, Clock, ChevronRight, Camera, Check, AlertCircle, Truck, ExternalLink } from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  price: number | string;
  quantity: number;
  subtotal: number | string;
}

interface Order {
  id: string;
  order_number: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  total: number | string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  currency?: string | null;
  delivery_partner?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  delivery_notes?: string | null;
  created_at: string;
  items: OrderItem[];
}

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        const res = await fetch(`${API_BASE_URL}/ecommerce/orders/my-orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, [token]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (!file.type.match(/^image\/(jpeg|png|webp|avif|gif)$/i)) {
      setAvatarMsg({ type: 'error', text: 'Please select an image file (JPG, PNG, WEBP, AVIF)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'Image file size must be under 5MB' });
      return;
    }

    setUploadingAvatar(true);
    setAvatarMsg(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/auth/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        dispatch(
          setSession({
            user: data.user,
            token,
          })
        );
        setAvatarMsg({ type: 'success', text: 'Avatar uploaded and updated!' });
        setTimeout(() => setAvatarMsg(null), 3500);
      } else {
        setAvatarMsg({ type: 'error', text: data.message || 'Avatar upload failed' });
      }
    } catch (err: any) {
      setAvatarMsg({ type: 'error', text: 'Network error while uploading avatar' });
    } finally {
      setUploadingAvatar(false);
    }
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

  const getItemImage = (item: any) => {
    if (!item) return '';
    const variantImg = item.variant?.images?.[0]?.image;
    if (variantImg) {
      return variantImg.startsWith('http') ? variantImg : `${API_BASE_URL}${variantImg.startsWith('/') ? '' : '/'}${variantImg}`;
    }
    const thumb = item.variant?.product?.images?.find((img: any) => img.is_thumbnail)?.image_url;
    if (thumb) {
      return thumb.startsWith('http') ? thumb : `${API_BASE_URL}${thumb.startsWith('/') ? '' : '/'}${thumb}`;
    }
    const first = item.variant?.product?.images?.[0]?.image_url;
    if (first) {
      return first.startsWith('http') ? first : `${API_BASE_URL}${first.startsWith('/') ? '' : '/'}${first}`;
    }
    return '';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-12">
      {/* Welcome Banner */}
      <div className="border border-border bg-card p-6 sm:p-8 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Upload Container (Device File ONLY) */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50 bg-background shadow-inner flex items-center justify-center text-primary font-serif font-bold text-2xl">
              {(user as any)?.avatar_url ? (
                <img
                  src={
                    (user as any).avatar_url.startsWith('http')
                      ? (user as any).avatar_url
                      : `${API_BASE_URL}${(user as any).avatar_url}`
                  }
                  alt={user.first_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user.first_name?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>

            {/* Hidden file input (Device upload ONLY) */}
            <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs cursor-pointer transition">
              <Camera size={18} className="text-primary mb-0.5" />
              <span>Upload</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={handleAvatarFileChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>

            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest block">My Account Dashboard</span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Welcome, {user.first_name}!
            </h1>
            <p className="text-xs text-muted-foreground font-light">{user.email} &bull; {user.phone || 'No phone registered'}</p>
            {avatarMsg && (
              <p className={`text-xs font-medium flex items-center gap-1 ${avatarMsg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {avatarMsg.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
                <span>{avatarMsg.text}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="px-5 py-3 border border-border rounded-lg text-center bg-background/50">
            <span className="block text-2xl font-serif font-bold text-primary">{orders.length}</span>
            <span className="text-xs text-muted-foreground uppercase font-semibold">Total Orders</span>
          </div>
          {user.email === 'srabon@example.com' || user.email === 'admin@example.com' || (user as any).role === 'ADMIN' ? (
            <Link href="/admin" className="px-4 py-3 border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-medium rounded text-xs tracking-wider flex items-center justify-center uppercase transition">
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
                      <span className="text-xs text-muted-foreground uppercase font-semibold block">Order Number</span>
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
                      <span className={`text-xs uppercase font-semibold border px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 space-y-4">
                    {(order.items || []).map((item) => {
                      const itemImg = getItemImage(item);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-sm gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border shrink-0 shadow-xs relative">
                              {itemImg ? (
                                <img
                                  src={itemImg}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-semibold bg-muted/40">
                                  Item
                                </div>
                              )}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="font-medium text-xs text-foreground truncate">{item.product_name}</h4>
                              <p className="text-xs text-muted-foreground font-mono">
                                SKU: {item.sku} &bull; Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-xs shrink-0">
                            {order.currency || 'AED'} {Number(item.subtotal ?? 0).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}

                    {(order.delivery_partner || order.tracking_number) && (
                      <div className="bg-primary/5 border border-primary/20 rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-primary/10 rounded-full text-primary">
                            <Truck size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {order.delivery_partner || 'Courier Delivery'}
                            </p>
                            {order.tracking_number && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Tracking #: <span className="font-semibold text-foreground">{order.tracking_number}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {order.tracking_url && (
                          <a
                            href={order.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary/90 transition shadow-xs"
                          >
                            <span>Track Package</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    )}

                    <div className="border-t border-border pt-4 flex justify-between items-center text-sm font-semibold">
                      <span className="text-muted text-xs font-light">Total Paid</span>
                      <span className="text-primary font-serif">{order.currency || 'AED'} {Number(order.total ?? 0).toFixed(2)}</span>
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
                <span className="font-medium text-foreground text-xs uppercase block tracking-wider">Default Shipping Address</span>
                <p className="border-l-2 border-primary/50 pl-3">
                  {user.first_name} {user.last_name} <br />
                  Marina Heights, Flat 12B <br />
                  Dubai Marina, Dubai, UAE <br />
                  Phone: {user.phone || '+971 50 123 4567'}
                </p>
              </div>

              <div className="space-y-1 pt-3 border-t border-border">
                <span className="font-medium text-foreground text-xs uppercase block tracking-wider">Shipping Method</span>
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
