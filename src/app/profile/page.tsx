'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSession } from '../../store/authSlice';
import Link from 'next/link';
import {
  Package,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Camera,
  Check,
  AlertCircle,
  Truck,
  ExternalLink,
  Trash2,
  Star,
  ShieldCheck,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  X,
  User,
  Phone,
  Mail,
  Save,
  MessageSquare,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

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
  subtotal?: number | string;
  discount?: number | string;
  shipping?: number | string;
  total: number | string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method?: 'STRIPE' | 'CASH_ON_DELIVERY' | string | null;
  currency?: string | null;
  delivery_partner?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  delivery_notes?: string | null;
  shipping_country?: string | null;
  shipping_city?: string | null;
  shipping_area?: string | null;
  shipping_street?: string | null;
  shipping_building?: string | null;
  shipping_postal_code?: string | null;
  created_at: string;
  items: OrderItem[];
}

interface CustomerAddress {
  id: string;
  country: string;
  city: string;
  area: string;
  street: string;
  building?: string | null;
  postal_code?: string | null;
  is_default: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Profile Edit state
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation Modal state (Custom luxury dialog replacing browser default alert/confirm)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [confirmModalLoading, setConfirmModalLoading] = useState(false);
  const [orderActionMsg, setOrderActionMsg] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);

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
    fetchAddresses();
  }, [token]);

  const fetchAddresses = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(Array.isArray(data) ? data : []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/addresses/${id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch {}
  };

  const handleDeleteAddress = (id: string) => {
    if (!token) return;
    setConfirmModal({
      title: 'Remove Saved Address',
      message: 'Are you sure you want to remove this delivery address from your saved addresses list?',
      confirmText: 'Remove Address',
      cancelText: 'Keep Address',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmModalLoading(true);
          const res = await fetch(`${API_BASE_URL}/ecommerce/addresses/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            fetchAddresses();
            setConfirmModal(null);
          }
        } catch {
          // ignore
        } finally {
          setConfirmModalLoading(false);
        }
      },
    });
  };

  const handleCancelOrder = (order: Order) => {
    if (!token) return;
    setConfirmModal({
      title: `Cancel Order #${order.order_number}`,
      message: `Are you sure you want to cancel this order? This Cash on Delivery order will be immediately cancelled and all reserved stock will be released back to inventory.`,
      confirmText: 'Yes, Cancel Order',
      cancelText: 'Keep Order',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmModalLoading(true);
          const res = await fetch(`${API_BASE_URL}/ecommerce/orders/${order.id}/cancel`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (res.ok) {
            setOrders((prev) =>
              prev.map((o) => (o.id === order.id ? { ...o, status: 'CANCELLED' } : o))
            );
            setOrderActionMsg({ id: order.id, type: 'success', text: 'Order has been cancelled successfully.' });
            setTimeout(() => setOrderActionMsg(null), 4000);
            setConfirmModal(null);
          } else {
            setOrderActionMsg({ id: order.id, type: 'error', text: data.message || 'Failed to cancel order.' });
            setConfirmModal(null);
          }
        } catch {
          setOrderActionMsg({ id: order.id, type: 'error', text: 'Network error while cancelling order.' });
          setConfirmModal(null);
        } finally {
          setConfirmModalLoading(false);
        }
      },
    });
  };

  const handleOpenCancelRefundChat = (order: Order) => {
    const isCod = order.payment_method === 'CASH_ON_DELIVERY' || !order.payment_method;
    const details = [
      `Hello Saba Support, I would like to request Cancellation / Refund assistance for my order.`,
      ``,
      `📋 Order Details:`,
      `• Order Number: ${order.order_number}`,
      `• Status: ${order.status}`,
      `• Payment Method: ${isCod ? 'Cash on Delivery (COD)' : 'Credit Card / Online Payment'}`,
      `• Total Amount: ${order.currency || 'AED'} ${Number(order.total ?? 0).toFixed(2)}`,
      `• Order Date: ${new Date(order.created_at).toLocaleDateString()}`,
      `• Items:`,
      ...(order.items || []).map(
        (item) => `   - ${item.product_name} (SKU: ${item.sku}) x ${item.quantity} = ${order.currency || 'AED'} ${Number(item.subtotal ?? 0).toFixed(2)}`
      ),
      ``,
      `Please assist me with this request. Thank you!`,
    ].join('\n');

    window.dispatchEvent(
      new CustomEvent('open-support-chat', {
        detail: { text: details },
      })
    );
  };

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

  const openEditProfile = () => {
    if (user) {
      setProfileFirstName(user.first_name || '');
      setProfileLastName(user.last_name || '');
      setProfilePhone(user.phone || '');
    }
    setProfileMsg(null);
    setShowEditProfileModal(true);
  };

  const openChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordMsg(null);
    setShowChangePasswordModal(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!profileFirstName.trim() || !profileLastName.trim()) {
      setProfileMsg({ type: 'error', text: 'First name and last name are required.' });
      return;
    }

    setUpdatingProfile(true);
    setProfileMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: profileFirstName.trim(),
          last_name: profileLastName.trim(),
          phone: profilePhone.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        dispatch(
          setSession({
            user: data.user,
            token,
          })
        );
        setProfileMsg({ type: 'success', text: data.message || 'Profile updated successfully!' });
        setTimeout(() => {
          setShowEditProfileModal(false);
          setProfileMsg(null);
        }, 1200);
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error while updating profile.' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setChangingPassword(true);
    setPasswordMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: data.message || 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordMsg(null);
        }, 1400);
      } else {
        setPasswordMsg({ type: 'error', text: data.message || 'Failed to change password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error while changing password.' });
    } finally {
      setChangingPassword(false);
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

  const getItemAttributes = (item: any) => {
    if (!item) return [];

    // 1. Relational attributes attached to variant
    const relationalAttrs = (item.variant?.attributes || [])
      .map((a: any) => {
        const name = a.attribute_value?.attribute?.name || a.attribute?.name || 'Option';
        const val = a.attribute_value?.value || a.value || '';
        return val ? { name, val } : null;
      })
      .filter(Boolean);
    if (relationalAttrs.length > 0) return relationalAttrs;

    // 2. Snapshot variant_name string (e.g. "Size: 52, Color: Dusty Rose")
    const rawVariant = (item.variant_name || '').trim();
    if (rawVariant && !rawVariant.startsWith('SW-') && rawVariant !== item.sku) {
      if (rawVariant.includes(':') || rawVariant.includes(',')) {
        const parts = rawVariant.split(/[,|]/).map((s: string) => s.trim());
        const parsed = parts
          .map((p: string) => {
            if (p.includes(':')) {
              const [k, v] = p.split(':');
              return { name: k.trim(), val: v.trim() };
            }
            return { name: 'Option', val: p };
          })
          .filter((p: { name: string; val: string }) => Boolean(p.val));
        if (parsed.length > 0) return parsed;
      } else {
        return [{ name: 'Option', val: rawVariant }];
      }
    }

    // 3. Fallback: Parse SKU suffix for size (e.g. SW-DUSTY-RO-125-52 -> Size: 52)
    const sku = (item.sku || '').trim();
    const sizeMatch = sku.match(/-(\d{2})$/);
    if (sizeMatch && sizeMatch[1]) {
      return [{ name: 'Size', val: sizeMatch[1] }];
    }

    return [];
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

            {/* Quick Profile & Password Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-border bg-background hover:border-primary text-foreground hover:text-primary transition shadow-2xs cursor-pointer"
              >
                <Edit3 size={13} className="text-primary" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={openChangePassword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-border bg-background hover:border-primary text-foreground hover:text-primary transition shadow-2xs cursor-pointer"
              >
                <Lock size={13} className="text-primary" />
                <span>Change Password</span>
              </button>
            </div>
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
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-medium text-xs text-foreground truncate">{item.product_name}</h4>
                              {(() => {
                                const attrs = getItemAttributes(item);
                                if (attrs.length === 0) return null;
                                return (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    {attrs.map((attr: { name: string; val: string }, idx: number) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/70"
                                      >
                                        <span className="text-muted-foreground mr-1">{attr.name}:</span>
                                        <span className="font-semibold text-foreground">{attr.val}</span>
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
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

                    {/* Order-specific Delivery Address */}
                    <div className="bg-muted/40 border border-border/80 rounded-md p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between text-foreground">
                        <span className="font-semibold flex items-center gap-1.5 text-primary">
                          <MapPin size={13} /> Delivery Address (Order #{order.order_number}):
                        </span>
                        {order.shipping_country && (
                          <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded bg-background border border-border">
                            {order.shipping_country}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground pl-4 leading-relaxed font-light">
                        {[
                          order.shipping_building,
                          order.shipping_street,
                          order.shipping_area,
                          order.shipping_city,
                          order.shipping_country,
                          order.shipping_postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ') || 'Address recorded with order'}
                      </p>
                      {((order as any).customer?.phone || (user as any)?.phone) && (
                        <div className="flex items-center gap-2 pl-4 pt-1.5 border-t border-border/50 text-muted-foreground">
                          <Phone size={12} className="text-primary shrink-0" />
                          <span className="font-medium">Phone / Contact:</span>
                          <span className="font-bold text-foreground font-mono">
                            {(order as any).customer?.phone || (user as any)?.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Financial Breakdown: Subtotal, Discount, Delivery Charge, Total */}
                    <div className="border-t border-border pt-3.5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Items Subtotal</span>
                        <span>{order.currency || 'AED'} {Number(order.subtotal ?? (Number(order.total) - Number(order.shipping ?? 0) + Number(order.discount ?? 0))).toFixed(2)}</span>
                      </div>
                      {Number(order.discount ?? 0) > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                          <span>Coupon Discount</span>
                          <span>-{order.currency || 'AED'} {Number(order.discount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Delivery Charge</span>
                        <span>
                          {Number(order.shipping ?? 0) === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free Delivery</span>
                          ) : (
                            `${order.currency || 'AED'} ${Number(order.shipping).toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div className="border-t border-border/70 pt-2 flex justify-between items-center text-sm font-semibold">
                        <span className="text-foreground font-serif">Total Amount</span>
                        <span className="text-primary font-serif font-bold text-base">
                          {order.currency || 'AED'} {Number(order.total ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Order Action Buttons (Cancel / Chat Refund) */}
                    <div className="border-t border-border/70 pt-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        Method: <span className="font-semibold text-foreground">{order.payment_method === 'CASH_ON_DELIVERY' || !order.payment_method ? 'Cash on Delivery (COD)' : 'Online Payment'}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'CANCELLED' ? (
                          <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded">
                            Order Cancelled
                          </span>
                        ) : order.status === 'REFUNDED' ? (
                          <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
                            Order Refunded
                          </span>
                        ) : (
                          <>
                            {(order.payment_method === 'CASH_ON_DELIVERY' || !order.payment_method) &&
                            (order.status === 'PENDING' || order.status === 'CONFIRMED') ? (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order)}
                                className="px-3 py-1.5 text-xs font-semibold rounded border border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <XCircle size={13} />
                                <span>Cancel Order</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleOpenCancelRefundChat(order)}
                              className="px-3 py-1.5 text-xs font-semibold rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              <MessageSquare size={13} />
                              <span>Cancel / Refund Support</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {orderActionMsg && orderActionMsg.id === order.id && (
                      <div
                        className={`p-2.5 rounded text-xs font-medium flex items-center gap-2 ${
                          orderActionMsg.type === 'success'
                            ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {orderActionMsg.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
                        <span>{orderActionMsg.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Sidebar */}
        <div className="space-y-6">
          {/* Account Details & Security Card */}
          <div className="bg-card border border-border p-6 rounded-md shadow-sm space-y-4">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" /> Profile & Security
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User size={13} className="text-muted-foreground" /> Full Name
                </span>
                <span className="font-semibold text-foreground">
                  {user.first_name} {user.last_name}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail size={13} className="text-muted-foreground" /> Email
                </span>
                <span className="font-medium text-foreground truncate max-w-[170px]" title={user.email}>
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone size={13} className="text-muted-foreground" /> Phone
                </span>
                <span className="font-medium text-foreground">
                  {user.phone || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Lock size={13} className="text-muted-foreground" /> Password
                </span>
                <span className="font-mono text-muted-foreground text-xs">••••••••</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={openEditProfile}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition shadow-2xs cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={openChangePassword}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-border bg-background hover:border-primary text-foreground hover:text-primary transition shadow-2xs cursor-pointer"
              >
                <Lock size={13} />
                <span>Password</span>
              </button>
            </div>
          </div>

          {/* Saved Addresses for Next Orders */}
          <div className="bg-card border border-border p-6 rounded-md shadow-sm space-y-5">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                <MapPin size={18} className="text-primary" /> Saved Addresses
              </h3>
              <span className="text-xs text-muted-foreground font-medium">For Next Orders</span>
            </div>

            {/* Saved Addresses List */}
            <div className="space-y-3.5">
              {loadingAddresses ? (
                <p className="text-xs text-muted-foreground font-light">Loading addresses...</p>
              ) : savedAddresses.length === 0 ? (
                <div className="p-3.5 border border-dashed border-border rounded-lg text-center space-y-1 bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium">No saved addresses yet.</p>
                  <p className="text-xs text-muted-foreground/75 leading-relaxed">
                    Check "Save address for next order" at checkout to save addresses here.
                  </p>
                </div>
              ) : (
                savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-3 rounded-lg border text-xs space-y-2 transition ${
                      addr.is_default
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin size={12} className={addr.is_default ? 'text-primary' : 'text-muted-foreground'} />
                        {addr.city}, {addr.country}
                      </span>
                      {addr.is_default ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] text-muted-foreground hover:text-primary transition underline cursor-pointer"
                        >
                          Make Default
                        </button>
                      )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed pl-4 font-light">
                      {[addr.building, addr.street, addr.area, addr.city, addr.country, addr.postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>

                    <div className="flex items-center justify-end pt-1 border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs text-rose-500 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer font-medium"
                        title="Delete address"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-1 pt-3 border-t border-border text-xs text-muted-foreground">
                <span className="font-medium text-foreground text-xs uppercase block tracking-wider">Shipping Method</span>
                <p>Aramex Express Delivery (1-2 Working Days in UAE)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !updatingProfile && setShowEditProfileModal(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 sm:p-7 space-y-5 z-10">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">Edit Profile</h3>
                  <p className="text-xs text-muted-foreground">Update your personal account details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                disabled={updatingProfile}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}
              >
                {profileMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    disabled={updatingProfile}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-primary transition"
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground block">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    disabled={updatingProfile}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-primary transition"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  disabled={updatingProfile}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-primary transition"
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground block">Email Address (Registered)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-md text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">Email is tied to your account credentials.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  disabled={updatingProfile}
                  className="px-4 py-2 border border-border rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2 btn-luxury rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {updatingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !changingPassword && setShowChangePasswordModal(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 sm:p-7 space-y-5 z-10">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">Change Password</h3>
                  <p className="text-xs text-muted-foreground">Update your account login security</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                disabled={changingPassword}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}
              >
                {passwordMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={changingPassword}
                    className="w-full px-3 py-2 pr-9 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-primary transition"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={changingPassword}
                    className="w-full px-3 py-2 pr-9 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-primary transition"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={changingPassword}
                    className={`w-full px-3 py-2 pr-9 bg-background border rounded-md text-foreground focus:outline-none transition ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-rose-500'
                        : 'border-border focus:border-primary'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-500">Passwords do not match.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  disabled={changingPassword}
                  className="px-4 py-2 border border-border rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword || (confirmPassword ? newPassword !== confirmPassword : false)}
                  className="px-5 py-2 btn-luxury rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Luxury Confirmation Modal (No Browser Alerts!) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !confirmModalLoading && setConfirmModal(null)}
          />
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 sm:p-7 space-y-4 z-10">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-full shrink-0 ${
                  confirmModal.isDestructive
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed font-light">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={confirmModalLoading}
                className="px-4 py-2 border border-border rounded-md text-xs font-medium text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                disabled={confirmModalLoading}
                className={`px-5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                  confirmModal.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'btn-luxury'
                }`}
              >
                {confirmModalLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmModal.confirmText || 'Confirm'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
