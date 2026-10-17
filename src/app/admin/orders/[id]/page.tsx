'use client';

import { API_BASE_URL } from '@/config/api';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Download,
  Pencil,
  Plus,
  Minus,
  Trash2,
  Save,
  XCircle,
  PlusCircle,
  Search,
  RefreshCw,
  ExternalLink,
  Factory,
} from 'lucide-react';
import { COUNTRIES_LIST } from '@/constants/countries';

interface OrderItem {
  id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  price: number | string;
  quantity: number;
  discount: number | string;
  subtotal: number | string;
  variant?: {
    images?: { image: string }[];
    product?: {
      name?: string;
      images?: { image_url: string; is_thumbnail?: boolean }[];
    };
  };
}

const getOrderItemFeaturedImage = (item: any) => {
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

interface OrderDetail {
  id: string;
  order_number: string;
  production_no?: string | null;
  customer_id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  subtotal: number | string;
  discount: number | string;
  shipping: number | string;
  tax: number | string;
  total: number | string;
  currency: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    is_blocked: boolean;
  };
  address?: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postal_code?: string;
    building?: string;
    area?: string;
  };
  shipping_country?: string;
  shipping_city?: string;
  shipping_area?: string;
  shipping_street?: string;
  shipping_building?: string;
  shipping_postal_code?: string;
  items: OrderItem[];
  payments?: {
    id: string;
    provider: string;
    provider_payment_intent?: string;
    amount: number | string;
    currency: string;
    status: string;
    paid_at?: string;
  }[];
  delivery_partner?: string;
  tracking_number?: string;
  tracking_url?: string;
  delivery_notes?: string;
}

const STATUS_OPTIONS = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PACKED: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  SHIPPED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  DELIVERED: 'bg-green-500/10 text-green-600 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
  REFUNDED: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
};

import { useModal } from '@/components/common/LuxuryModal';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const token = useSelector((state: RootState) => state.auth.token);
  const { showAlert } = useModal();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Edit order items state
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editableItems, setEditableItems] = useState<{
    variant_id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    price: number;
    quantity: number;
  }[]>([]);
  const [editShipping, setEditShipping] = useState<number>(0);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [savingItems, setSavingItems] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // Catalog products for adding items
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [searchCatalog, setSearchCatalog] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Delivery Partner & Tracking state
  const [deliveryPartners, setDeliveryPartners] = useState<{ id: string; name: string; tracking_url_template?: string; contact_phone?: string }[]>([]);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [customCourierName, setCustomCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Dynamic Courier Management
  const [showManageCouriers, setShowManageCouriers] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerTemplate, setNewPartnerTemplate] = useState('');
  const [addingPartner, setAddingPartner] = useState(false);
  const [partnerMsg, setPartnerMsg] = useState('');

  // Shipping Address Edit State (Allowed only when order.status === 'PENDING')
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    country: 'United Arab Emirates',
    city: '',
    area: '',
    street: '',
    building: '',
    postal_code: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  // Load delivery partners list
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/admin/delivery-partners`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDeliveryPartners(data);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error(`Order #${orderId} not found`);
        }

        const data = await res.json();
        setOrder(data);
        setCourierName(data.delivery_partner || '');
        setTrackingNumber(data.tracking_number || '');
        setTrackingUrl(data.tracking_url || '');
        setDeliveryNotes(data.delivery_notes || '');

        const resolvedCountry = data.shipping_country || data.address?.country || (data.customer as any)?.addresses?.[0]?.country || 'United Arab Emirates';
        const resolvedCity = data.shipping_city || data.address?.city || (data.customer as any)?.addresses?.[0]?.city || '';
        const resolvedArea = data.shipping_area || data.address?.area || (data.customer as any)?.addresses?.[0]?.area || '';
        const resolvedStreet = data.shipping_street || data.address?.street || (data.customer as any)?.addresses?.[0]?.street || '';
        const resolvedBuilding = data.shipping_building || data.address?.building || (data.customer as any)?.addresses?.[0]?.building || '';
        const resolvedPostal = data.shipping_postal_code || data.address?.postal_code || (data.customer as any)?.addresses?.[0]?.postal_code || '';

        setAddressForm({
          country: resolvedCountry,
          city: resolvedCity,
          area: resolvedArea,
          street: resolvedStreet,
          building: resolvedBuilding,
          postal_code: resolvedPostal,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token, router]);

  const [generatingProdNo, setGeneratingProdNo] = useState(false);
  const handleGenerateProductionNo = async () => {
    if (!order || !token) return;
    setGeneratingProdNo(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/generate-production-no`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrder((prev) => (prev ? { ...prev, production_no: data.production_no } : prev));
      }
    } catch (_) {}
    finally {
      setGeneratingProdNo(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!order || !token) return;
    if (order.status !== 'PENDING') {
      setAddressError('Address can only be updated before order confirmation (status must be PENDING).');
      return;
    }

    setSavingAddress(true);
    setAddressError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/address`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update address');
      }

      const updated = await res.json();
      setOrder(updated);
      setIsEditingAddress(false);
      setSuccessMsg('Shipping address updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setAddressError(err.message || 'Error updating address');
    } finally {
      setSavingAddress(false);
    }
  };

  const generateLiveTrackingUrl = (partner: string, num: string) => {
    if (!num.trim()) return '';
    const cleanNum = encodeURIComponent(num.trim());
    const found = deliveryPartners.find((p) => p.name.toLowerCase() === partner.toLowerCase());
    if (found?.tracking_url_template) {
      return found.tracking_url_template.replace('{tracking_number}', cleanNum);
    }
    const lower = partner.toLowerCase();
    if (lower.includes('steadfast')) return `https://steadfast.com.bd/t/${cleanNum}`;
    if (lower.includes('aramex')) return `https://www.aramex.com/track/results?shipmentNumber=${cleanNum}`;
    if (lower.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${cleanNum}`;
    if (lower.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${cleanNum}`;
    if (lower.includes('redx')) return `https://redx.com.bd/track/${cleanNum}`;
    if (lower.includes('pathao')) return `https://pathao.com/courier/tracking/?consignment_id=${cleanNum}`;
    if (lower.includes('paperfly')) return `https://paperfly.com.bd/tracking.php?tracking_id=${cleanNum}`;
    return '';
  };

  const handleSelectCourier = (name: string) => {
    setCourierName(name);
    const targetName = name === 'Custom Courier' ? customCourierName : name;
    if (trackingNumber.trim()) {
      const generated = generateLiveTrackingUrl(targetName, trackingNumber);
      if (generated) setTrackingUrl(generated);
    }
  };

  const handleTrackingNumberChange = (num: string) => {
    setTrackingNumber(num);
    const targetName = courierName === 'Custom Courier' ? customCourierName : courierName;
    if (targetName && num.trim()) {
      const generated = generateLiveTrackingUrl(targetName, num);
      if (generated) setTrackingUrl(generated);
    }
  };

  const handleAddDeliveryPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim() || !token) return;
    setAddingPartner(true);
    setPartnerMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/delivery-partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPartnerName.trim(),
          tracking_url_template: newPartnerTemplate.trim() || null,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setDeliveryPartners((prev) => [...prev.filter((p) => p.id !== created.id), created]);
        setCourierName(created.name);
        if (trackingNumber.trim() && created.tracking_url_template) {
          setTrackingUrl(created.tracking_url_template.replace('{tracking_number}', encodeURIComponent(trackingNumber.trim())));
        }
        setNewPartnerName('');
        setNewPartnerTemplate('');
        setShowManageCouriers(false);
        setPartnerMsg('New courier partner registered and selected!');
        setTimeout(() => setPartnerMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to add delivery partner:', err);
    } finally {
      setAddingPartner(false);
    }
  };

  const handleDeleteDeliveryPartner = async (partnerId: string) => {
    if (!token || !confirm('Are you sure you want to delete this courier partner?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/delivery-partners/${partnerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeliveryPartners((prev) => prev.filter((p) => p.id !== partnerId));
      }
    } catch (err) {
      console.error('Failed to delete delivery partner:', err);
    }
  };

  const handleSaveDeliveryInfo = async () => {
    if (!order || !token) return;
    setSavingDelivery(true);
    try {
      const finalCourier = courierName === 'Custom Courier' ? customCourierName.trim() : courierName.trim();
      const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          delivery_partner: finalCourier || null,
          tracking_number: trackingNumber.trim() || null,
          tracking_url: trackingUrl.trim() || null,
          delivery_notes: deliveryNotes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update delivery partner');
      const updated = await res.json();
      setOrder(updated);
      setIsEditingDelivery(false);
      setSuccessMsg('Delivery courier and tracking information updated!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update tracking');
    } finally {
      setSavingDelivery(false);
    }
  };

  const onSelectStatusChange = (newStatus: string) => {
    if (!order || newStatus === order.status) return;
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async (sendEmail: boolean) => {
    if (!order || !token || !pendingStatus) return;
    setUpdating(true);
    setSuccessMsg(null);
    setShowStatusModal(false);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: pendingStatus,
          notify_customer: sendEmail,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setOrder({ ...order, status: pendingStatus as any });
      setSuccessMsg(
        `Order status updated to ${pendingStatus}${sendEmail ? ' and email notification sent to customer' : ''}`,
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      showAlert(err.message || 'Failed to update order status', 'Status Update Failed', 'error');
    } finally {
      setUpdating(false);
      setPendingStatus(null);
    }
  };

  const startEditingItems = async () => {
    if (!order) return;
    setEditableItems(
      (order.items || []).map((it) => ({
        variant_id: it.variant_id,
        product_name: it.product_name,
        variant_name: it.variant_name || '',
        sku: it.sku || '',
        price: Number(it.price),
        quantity: it.quantity,
      })),
    );
    setEditShipping(Number(order.shipping));
    setEditDiscount(Number(order.discount));
    setIsEditingItems(true);
    setItemError(null);

    if (catalogProducts.length === 0 && token) {
      setLoadingCatalog(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCatalogProducts(data);
        }
      } catch (_) {}
      finally {
        setLoadingCatalog(false);
      }
    }
  };

  const cancelEditingItems = () => {
    setIsEditingItems(false);
    setItemError(null);
  };

  const handleUpdateItemQty = (variantId: string, delta: number) => {
    setEditableItems((prev) =>
      prev
        .map((it) => {
          if (it.variant_id === variantId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as any[],
    );
  };

  const handleSetItemQty = (variantId: string, qty: number) => {
    if (isNaN(qty) || qty <= 0) return;
    setEditableItems((prev) =>
      prev.map((it) => (it.variant_id === variantId ? { ...it, quantity: qty } : it)),
    );
  };

  const handleRemoveItem = (variantId: string) => {
    if (editableItems.length <= 1) {
      setItemError('An order must have at least one item. To cancel the order, change status to CANCELLED.');
      return;
    }
    setEditableItems((prev) => prev.filter((it) => it.variant_id !== variantId));
  };

  const handleAddItemFromCatalog = (product: any, variant: any) => {
    const existingIndex = editableItems.findIndex((it) => it.variant_id === variant.id);
    if (existingIndex > -1) {
      setEditableItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it,
        ),
      );
    } else {
      setEditableItems((prev) => [
        ...prev,
        {
          variant_id: variant.id,
          product_name: product.name,
          variant_name: variant.sku,
          sku: variant.sku,
          price: Number(variant.price),
          quantity: 1,
        },
      ]);
    }
    setItemError(null);
  };

  const handleSaveItems = async () => {
    if (!order || !token) return;
    if (editableItems.length === 0) {
      setItemError('Order must have at least one item');
      return;
    }

    setSavingItems(true);
    setItemError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${order.id}/items`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: editableItems.map((it) => ({
            variant_id: it.variant_id,
            quantity: it.quantity,
            price: it.price,
          })),
          shipping: editShipping,
          discount: editDiscount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update order items');
      }

      const updatedOrder = await res.json();
      setOrder(updatedOrder);
      setIsEditingItems(false);
      setSuccessMsg('Order items, quantities, and totals updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setItemError(err.message || 'Failed to save order item changes.');
    } finally {
      setSavingItems(false);
    }
  };

  const buildPrintableInvoiceHtml = (ord: OrderDetail) => {
    const d = new Date(ord.created_at);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const customerName = `${ord.customer?.first_name || ''} ${ord.customer?.last_name || ''}`.trim() || 'Valued Customer';
    const customerPhone = ord.customer?.phone || ord.shipping_area || '+971 50 000 0000';
    const customerEmail = ord.customer?.email || 'customer@example.com';
    const addressLine1 = [ord.shipping_building, ord.shipping_street, ord.address?.street].filter(Boolean).join(', ') || 'Tempore blanditiis, Maiores ut labore ve';
    const addressLine2 = [ord.shipping_area, ord.shipping_city || ord.address?.city, ord.shipping_country || ord.address?.country || 'United Arab Emirates'].filter(Boolean).join(', ');

    const rowsHtml = (ord.items || []).map((it) => {
      // Determine Code (SKU or slug)
      const code = it.sku || (it.product_name ? it.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'prod-code');

      // Determine Size & measurement breakdown
      let sizeText = 'XS';
      let fabricText = 'Bridel (بريدل)';
      let colorText = 'Black (اسود)';
      const rawVariant = (it.variant_name || '').trim();

      if (rawVariant) {
        const parts = rawVariant.split(/[\/,•|]/).map((s) => s.trim());
        for (const p of parts) {
          const lower = p.toLowerCase();
          if (lower.includes('size') || /^(xs|s|m|l|xl|xxl|\d{2})/i.test(p)) {
            sizeText = p.replace(/^size\s*[:=]\s*/i, '');
          } else if (lower.includes('color') || lower.includes('black') || lower.includes('white') || lower.includes('green') || lower.includes('blue')) {
            colorText = p.replace(/^color\s*[:=]\s*/i, '');
          } else if (lower.includes('fabric') || lower.includes('bridel') || lower.includes('nada') || lower.includes('crepe') || lower.includes('silk')) {
            fabricText = p.replace(/^fabric\s*[:=]\s*/i, '');
          }
        }
      }

      return `
        <tr>
          <td style="padding: 10px; border: 1px solid #d1d5db; font-size: 11px; font-family: monospace; vertical-align: top; color: #111827;">
            ${code}
          </td>
          <td style="padding: 10px; border: 1px solid #d1d5db; font-size: 12px; vertical-align: top; color: #111827;">
            <div style="font-weight: 600;">${it.product_name}</div>
            <div style="font-size: 11px; color: #4b5563; margin-top: 3px;">Fabric: ${fabricText.split(' ')[0]}</div>
          </td>
          <td style="padding: 10px; border: 1px solid #d1d5db; font-size: 12px; vertical-align: top; color: #111827;">
            <div style="font-weight: bold; font-size: 13px;">${sizeText}</div>
          </td>
          <td style="padding: 10px; border: 1px solid #d1d5db; font-size: 12px; vertical-align: top; text-align: center; color: #111827;">
            ${fabricText}
          </td>
          <td style="padding: 10px; border: 1px solid #d1d5db; font-size: 12px; vertical-align: top; text-align: center; color: #111827;">
            ${colorText}
          </td>
          <td style="padding: 10px; border: 1px solid #d1d5db; font-size: 12px; vertical-align: top; text-align: center; font-weight: 600; color: #111827;">
            ${it.quantity}
          </td>
          <td style="padding: 10px; border: 1px solid #d1d5db; font-size: 12px; vertical-align: top; text-align: right; font-weight: 600; color: #111827; white-space: nowrap;">
            ${Number(it.price).toFixed(2)}<br/><span style="font-size: 11px; font-weight: normal;">(AED)</span>
          </td>
        </tr>
      `;
    }).join('');

    const netTotal = Number(ord.subtotal || 0).toFixed(2);
    const discount = Number(ord.discount || 0).toFixed(2);
    const delivery = Number(ord.shipping || 0).toFixed(2);
    const grandTotal = Number(ord.total || 0).toFixed(2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice_${ord.order_number}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #111827;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.4;
    }
    .invoice-wrapper {
      max-width: 820px;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .navy-banner {
      background-color: #30206b !important;
      color: #ffffff !important;
      padding: 12px 20px;
      text-align: center;
      border-radius: 2px;
    }
    .navy-banner h1 {
      margin: 0 0 4px 0;
      font-size: 21px;
      font-weight: 700;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      letter-spacing: 0.5px;
    }
    .navy-banner h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .sub-address {
      text-align: right;
      font-size: 11px;
      color: #1f2937;
      margin-top: 6px;
      line-height: 1.4;
    }
    .meta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 18px 0 20px 0;
      gap: 16px;
    }
    .contact-col {
      font-size: 12px;
      line-height: 1.5;
      color: #1e3a8a;
      font-weight: 500;
    }
    .badge-cash {
      border: 2px solid #30206b;
      border-radius: 12px;
      padding: 7px 22px;
      text-align: center;
      color: #30206b;
      font-family: 'Segoe UI', sans-serif;
    }
    .badge-specialist {
      background-color: #30206b !important;
      color: #ffffff !important;
      padding: 8px 18px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }
    .bill-meta-table {
      width: 100%;
      margin: 16px 0 20px 0;
      border-collapse: collapse;
    }
    .order-details-title {
      font-size: 14px;
      font-weight: bold;
      color: #111827;
      margin: 20px 0 8px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d1d5db;
    }
    .items-table th {
      background-color: #f9fafb !important;
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: bold;
      color: #111827;
      text-align: left;
    }
    .totals-box {
      width: 320px;
      margin-left: auto;
      margin-top: 14px;
      border: 1px solid #9ca3af;
      border-collapse: collapse;
      font-size: 12px;
    }
    .totals-box td {
      padding: 6px 12px;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 85px;
      padding: 0 10px;
    }
    .signature-box {
      width: 220px;
    }
    .signature-line {
      border-bottom: 2px solid #111827;
      margin-bottom: 6px;
    }
    .footer-bar {
      margin-top: 60px;
      font-size: 10px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #f3f4f6;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <!-- TOP HEADER -->
    <table class="header-table">
      <tr>
        <td style="width: 120px; vertical-align: top; padding-right: 16px;">
          <!-- Circular SW Monogram Logo -->
          <svg width="105" height="105" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="56" stroke="#30206b" stroke-width="3" fill="#ffffff" />
            <circle cx="60" cy="60" r="50" stroke="#c99736" stroke-width="1.5" stroke-dasharray="2 2" fill="none" />
            <path id="curve" d="M 28 60 A 32 32 0 0 1 92 60" fill="none" />
            <text font-size="7" font-weight="bold" fill="#c99736" letter-spacing="2">
              <textPath href="#curve" startOffset="50%" text-anchor="middle">SABA AL WADI</textPath>
            </text>
            <text x="44" y="74" font-family="'Times New Roman', Georgia, serif" font-size="44" font-weight="bold" fill="#c99736" font-style="italic">S</text>
            <text x="64" y="78" font-family="'Times New Roman', Georgia, serif" font-size="40" font-weight="bold" fill="#30206b" font-style="italic">W</text>
          </svg>
        </td>
        <td style="vertical-align: top;">
          <div class="navy-banner">
            <h1>صبا الوادي للعبايات والشيلة ذ.م.م (فرع)</h1>
            <h2>SABA AL WADI ABAYA &amp; SHAILA L.L.C (BR)</h2>
          </div>
          <div class="sub-address">
            Suit No: M-49, M-104, 2nd Floor, Al Habtoor Building, Abu Hail Street, Deira-Dubai. P.O Box: 67242<br/>
            E-mail: contact@sabaalwadi.com
          </div>
        </td>
      </tr>
    </table>

    <!-- CONTACT DETAILS & BADGES -->
    <div class="meta-bar">
      <div class="contact-col">
        <div>+971 55 79 17 409 &#128222;</div>
        <div>+971 50 93 75 919 &#128222;</div>
        <div>Tel: +971 55 642 4758</div>
        <div>&#128247; @saba_al_wadi</div>
      </div>

      <div class="badge-cash">
        <div style="font-size: 13px; font-weight: bold;">فاتورة النقد / الخصم</div>
        <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">CASH / DEBIT INVOICE</div>
      </div>

      <div class="badge-specialist">
        Specialist Designer in Abaya &amp; Sheila
      </div>
    </div>

    <!-- BILLING INFO & ORDER META -->
    <table class="bill-meta-table">
      <tr>
        <td style="vertical-align: top; width: 60%; font-size: 12px; line-height: 1.5; color: #111827;">
          <div style="font-weight: 700; margin-bottom: 2px;">INVOICE TO</div>
          <div style="font-weight: 600;">${customerName}</div>
          <div>${customerPhone}</div>
          <div>${customerEmail}</div>
          <div>${addressLine1}</div>
          <div>${addressLine2}</div>
        </td>
        <td style="vertical-align: top; text-align: right; font-size: 12px; line-height: 1.5; color: #111827;">
          <div style="font-weight: 700;">ORDER NO.</div>
          <div style="margin-bottom: 6px; font-size: 13px;">${ord.order_number}</div>
          ${ord.production_no ? `<div style="font-weight: 700;">PRODUCT NO.</div><div style="margin-bottom: 6px; font-size: 13px; font-family: monospace; font-weight: bold; color: #30206b;">${ord.production_no}</div>` : ''}
          <div style="font-weight: 700;">DATE</div>
          <div style="font-size: 13px;">${formattedDate}</div>
        </td>
      </tr>
    </table>

    <!-- ORDER DETAILS TABLE -->
    <div class="order-details-title">Order Details</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 15%;">Code</th>
          <th style="width: 20%;">Product</th>
          <th style="width: 32%;">Size</th>
          <th style="width: 11%; text-align: center;">Fabric</th>
          <th style="width: 10%; text-align: center;">Color</th>
          <th style="width: 5%; text-align: center;">Qty</th>
          <th style="width: 7%; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- TOTALS BOX -->
    <table class="totals-box">
      <tr>
        <td style="border-bottom: 1px solid #e5e7eb; font-weight: 500;">Net Total:</td>
        <td style="border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${netTotal} (AED)</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #e5e7eb; font-weight: 500;">Discount:</td>
        <td style="border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${discount} (AED)</td>
      </tr>
      <tr>
        <td style="border-bottom: 2px solid #111827; font-weight: 500;">Delivery Charge:</td>
        <td style="border-bottom: 2px solid #111827; text-align: right; font-weight: 600;">${delivery} (AED)</td>
      </tr>
      <tr style="font-weight: bold; font-size: 13px;">
        <td style="padding: 8px 12px;">Total:</td>
        <td style="padding: 8px 12px; text-align: right;">${grandTotal} (AED)</td>
      </tr>
    </table>

    <!-- SIGNATURES -->
    <div class="signature-row">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div style="font-weight: 600; font-size: 13px; color: #111827;">Sales by</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div style="font-weight: 600; font-size: 13px; color: #111827;">Customer</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-bar">
      <span>Thank you for shopping with Saba Al Wadi Abaya &amp; Shaila</span>
      <span>1/1</span>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (!order) return;
    const invoiceHtml = buildPrintableInvoiceHtml(order);

    // Print seamlessly using a hidden iframe without opening a new window/tab
    let printIframe = document.getElementById('invoice-print-frame') as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'invoice-print-frame';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.visibility = 'hidden';
      document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (doc && printIframe.contentWindow) {
      doc.open();
      doc.write(invoiceHtml);
      doc.close();
      printIframe.contentWindow.focus();
      setTimeout(() => {
        printIframe?.contentWindow?.print();
      }, 300);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    const invoiceHtml = buildPrintableInvoiceHtml(order);
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_SABA_AL_WADI_${order.order_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-serif font-bold text-foreground">Order Not Found</h2>
        <p className="text-sm text-muted-foreground">{error || `No order found with ID ${orderId}`}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-xs font-semibold hover:bg-primary/90 transition"
        >
          <ArrowLeft size={14} /> Back to All Orders
        </Link>
      </div>
    );
  }

  const subtotal = Number(order.subtotal || 0);
  const discount = Number(order.discount || 0);
  const shipping = Number(order.shipping || 0);
  const tax = Number(order.tax || 0);
  const total = Number(order.total || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="p-2 border border-border rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Order {order.order_number}
              </h1>
              {order.production_no ? (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 shadow-2xs"
                  title="Product Number"
                >
                  <Factory size={13} className="text-amber-500" />
                  <span>Product #{order.production_no}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateProductionNo}
                  disabled={generatingProdNo}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition cursor-pointer"
                  title="Generate Product Number"
                >
                  <Factory size={13} />
                  <span>{generatingProdNo ? 'Generating…' : '+ Generate Product #'}</span>
                </button>
              )}
              <span className={`px-2.5 py-1 rounded text-xs font-bold border ${STATUS_COLORS[order.status] || ''}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString('en-AE', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs font-medium hover:bg-accent transition cursor-pointer"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs font-medium hover:bg-accent transition text-amber-500 cursor-pointer"
          >
            <Download size={14} /> Download Invoice
          </button>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-md">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <select
              disabled={updating}
              value={order.status}
              onChange={(e) => onSelectStatusChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-popover text-popover-foreground">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 rounded-md text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-base font-bold flex items-center gap-2">
                <Package size={16} className="text-primary" /> {isEditingItems ? 'Edit Order Items' : `Purchased Items (${order.items?.length || 0})`}
              </h2>
              <div>
                {!isEditingItems ? (
                  <button
                    type="button"
                    onClick={startEditingItems}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded text-xs font-semibold transition"
                  >
                    <Pencil size={13} />
                    Edit Items
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelEditingItems}
                      disabled={savingItems}
                      className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded text-xs font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveItems}
                      disabled={savingItems}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs font-semibold shadow-sm transition disabled:opacity-50"
                    >
                      {savingItems ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Save size={13} />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error in edit mode */}
            {isEditingItems && itemError && (
              <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{itemError}</span>
              </div>
            )}

            {/* Catalog search bar when editing */}
            {isEditingItems && (
              <div className="p-4 bg-muted/20 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <PlusCircle size={14} className="text-primary" /> Add Product to Order
                  </span>
                  {loadingCatalog && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" /> Loading catalog...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search catalog by product name or SKU..."
                    value={searchCatalog}
                    onChange={(e) => setSearchCatalog(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {searchCatalog.trim() && (
                  <div className="max-h-48 overflow-y-auto border border-border rounded-md bg-card divide-y divide-border">
                    {catalogProducts
                      .filter(
                        (p) =>
                          p.name?.toLowerCase().includes(searchCatalog.toLowerCase()) ||
                          p.variants?.some((v: any) => v.sku?.toLowerCase().includes(searchCatalog.toLowerCase())),
                      )
                      .slice(0, 8)
                      .map((product) => (
                        <div key={product.id} className="p-2 space-y-1">
                          <p className="text-xs font-medium text-foreground">{product.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(product.variants || []).map((variant: any) => (
                              <button
                                key={variant.id}
                                type="button"
                                onClick={() => {
                                  handleAddItemFromCatalog(product, variant);
                                  setSearchCatalog('');
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded transition"
                              >
                                <Plus size={11} />
                                <span>{variant.sku || 'SKU'}</span>
                                <span className="font-semibold">AED {Number(variant.price || 0).toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground">({variant.inventory?.available_quantity ?? 0} in stock)</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {!isEditingItems ? (
              <div className="divide-y divide-border">
                {(order.items || []).map((item) => {
                  const itemImg = getOrderItemFeaturedImage(item);
                  return (
                    <div key={item.id} className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border shrink-0 shadow-xs relative">
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
                          <h3 className="text-sm font-semibold text-foreground truncate">{item.product_name}</h3>
                          <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                          <p className="text-xs font-mono text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          AED {Number(item.price || 0).toFixed(2)} &times; {item.quantity}
                        </p>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          AED {Number(item.subtotal || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {editableItems.map((item) => {
                  const origItem = order.items?.find((it) => it.variant_id === item.variant_id);
                  const itemImg = origItem ? getOrderItemFeaturedImage(origItem) : '';
                  return (
                    <div key={item.variant_id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border shrink-0 shadow-xs">
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
                          <h3 className="text-sm font-semibold text-foreground truncate">{item.product_name}</h3>
                          <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                          <p className="text-xs font-mono text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Price input */}
                      <div className="text-right">
                        <label className="text-xs uppercase font-semibold text-muted-foreground block">Price (AED)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEditableItems((prev) =>
                              prev.map((it) => (it.variant_id === item.variant_id ? { ...it, price: val } : it)),
                            );
                          }}
                          className="w-20 px-2 py-1 text-xs text-right bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Quantity Stepper */}
                      <div className="text-center">
                        <label className="text-xs uppercase font-semibold text-muted-foreground block">Qty</label>
                        <div className="flex items-center border border-border rounded overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.variant_id, -1)}
                            className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground transition"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleSetItemQty(item.variant_id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center text-xs bg-background text-foreground py-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.variant_id, 1)}
                            className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Line Subtotal */}
                      <div className="w-24 text-right">
                        <label className="text-xs uppercase font-semibold text-muted-foreground block">Line Total</label>
                        <span className="text-xs font-bold text-foreground">
                          AED {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.variant_id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Financial Summary */}
            {!isEditingItems ? (
              <div className="bg-muted/30 p-5 border-t border-border space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>AED {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount Applied</span>
                    <span>-AED {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping ({shipping === 0 ? 'Free Express' : 'Standard'})</span>
                  <span>AED {shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-3">
                  <span>Total Amount</span>
                  <span className="text-primary font-serif text-base">AED {total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 p-5 border-t border-border space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-border">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Shipping / Delivery Charge (AED)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editShipping}
                      onChange={(e) => setEditShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Discount (AED)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Live financial recalculation */}
                {(() => {
                  const liveSub = editableItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
                  const liveTot = Math.max(0, liveSub - editDiscount + editShipping);
                  return (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>New Subtotal</span>
                        <span>AED {liveSub.toFixed(2)}</span>
                      </div>
                      {editDiscount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Discount Applied</span>
                          <span>-AED {editDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping Charge</span>
                        <span>AED {editShipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2">
                        <span>New Total Amount</span>
                        <span className="text-primary font-serif text-base">AED {liveTot.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Payment & Audit Info */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <h2 className="font-serif text-base font-bold flex items-center gap-2">
              <CreditCard size={16} className="text-primary" /> Payment & Transaction
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-semibold">Method</span>
                <span className="font-semibold text-foreground">{order.payment_method}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-semibold">Payment Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border mt-0.5 ${
                  order.payment_status === 'PAID'
                    ? 'bg-green-500/10 text-green-600 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                }`}>
                  {order.payment_status}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-semibold">Currency</span>
                <span className="font-semibold text-foreground">{order.currency || 'AED'}</span>
              </div>
            </div>

            {order.payments && order.payments.length > 0 && (
              <div className="border-t border-border pt-3 text-xs text-muted-foreground font-mono space-y-1">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span>Provider: {p.provider} ({p.status})</span>
                    <span>Intent ID: {p.provider_payment_intent || 'N/A'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Customer & Shipping */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <h2 className="font-serif text-base font-bold flex items-center gap-2">
              <User size={16} className="text-primary" /> Customer Profile
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground text-xs uppercase font-semibold block">Full Name</span>
                <span className="font-semibold text-foreground text-sm">
                  {order.customer.first_name} {order.customer.last_name}
                </span>
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded font-semibold uppercase">
                  {order.customer.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={14} className="text-primary" />
                <a href={`mailto:${order.customer.email}`} className="hover:underline text-foreground">
                  {order.customer.email}
                </a>
              </div>
              {order.customer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} className="text-primary" />
                  <span className="text-foreground">{order.customer.phone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <Link
                href={`/admin/customers`}
                className="text-primary text-xs font-semibold hover:underline flex items-center justify-between"
              >
                <span>Manage Customer in Admin</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Delivery & Shipping Address + Delivery Partner & Tracking */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base font-bold flex items-center gap-2">
                <Truck size={16} className="text-primary" /> Shipping & Delivery Courier
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingDelivery(!isEditingDelivery)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Pencil size={12} />
                <span>{isEditingDelivery ? 'Close' : 'Edit Courier'}</span>
              </button>
            </div>

            {/* Courier & Tracking Information */}
            <div className="bg-muted/40 p-3.5 rounded-lg border border-border space-y-2.5">
              {!isEditingDelivery ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery Partner:</span>
                    <span className="font-bold text-foreground px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {order.delivery_partner || 'Not Assigned Yet'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tracking Number:</span>
                    {order.tracking_number ? (
                      <span className="font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {order.tracking_number}
                      </span>
                    ) : (
                      <span className="text-muted italic">No tracking ID</span>
                    )}
                  </div>

                  {order.tracking_url && (
                    <div className="pt-1 flex justify-end">
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 underline"
                      >
                        <ExternalLink size={12} /> Track Package Live
                      </a>
                    </div>
                  )}

                  {order.delivery_notes && (
                    <div className="pt-2 border-t border-border/60 text-xs">
                      <span className="text-muted-foreground block font-medium">Delivery Notes:</span>
                      <p className="text-foreground italic">{order.delivery_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Select Delivery Partner / Courier
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowManageCouriers(!showManageCouriers)}
                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={11} /> {showManageCouriers ? 'Close Management' : '+ Add / Manage Couriers'}
                      </button>
                    </div>

                    {/* Manage / Add Courier inline panel */}
                    {showManageCouriers && (
                      <div className="mb-3 p-3 bg-background/90 border border-primary/30 rounded-lg space-y-2.5 animate-in fade-in shadow-inner">
                        <span className="text-xs font-bold text-foreground block">
                          ➕ Register New Courier Partner
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-xs text-muted-foreground uppercase block mb-0.5">Courier Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Steadfast, Aramex, Sundarban"
                              value={newPartnerName}
                              onChange={(e) => setNewPartnerName(e.target.value)}
                              className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground uppercase block mb-0.5">Tracking URL Template</label>
                            <input
                              type="text"
                              placeholder="https://.../t/{tracking_number}"
                              value={newPartnerTemplate}
                              onChange={(e) => setNewPartnerTemplate(e.target.value)}
                              className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground font-mono focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-xs text-muted-foreground italic">
                            Use <code className="text-primary font-bold">{'{tracking_number}'}</code> as placeholder in URL.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddDeliveryPartner}
                            disabled={addingPartner || !newPartnerName.trim()}
                            className="px-3 py-1 bg-primary text-primary-foreground font-semibold rounded text-xs hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
                          >
                            {addingPartner ? 'Saving...' : 'Save Partner'}
                          </button>
                        </div>

                        {/* Existing Couriers List for quick deletion */}
                        {deliveryPartners.length > 0 && (
                          <div className="pt-2 border-t border-border/60">
                            <span className="text-xs text-muted-foreground font-semibold uppercase block mb-1">
                              Active Registered Couriers:
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {deliveryPartners.map((dp) => (
                                <span
                                  key={dp.id}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-muted/40 border border-border rounded text-xs text-foreground"
                                >
                                  <span className="font-medium">{dp.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDeliveryPartner(dp.id)}
                                    className="text-muted-foreground hover:text-red-500 transition cursor-pointer"
                                    title={`Delete ${dp.name}`}
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {partnerMsg && (
                      <div className="mb-2 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded text-xs font-semibold">
                        {partnerMsg}
                      </div>
                    )}

                    <select
                      value={courierName}
                      onChange={(e) => handleSelectCourier(e.target.value)}
                      className="w-full text-xs bg-background border border-border rounded px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="">-- Choose Courier Partner --</option>
                      {deliveryPartners.map((dp) => (
                        <option key={dp.id} value={dp.name}>
                          {dp.name} {dp.tracking_url_template ? '⚡ (Live Auto-Tracking)' : ''}
                        </option>
                      ))}
                      <option value="Custom Courier">Custom Courier / Other</option>
                    </select>
                  </div>

                  {courierName === 'Custom Courier' && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                        Custom Courier Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Local Delivery Service, Speed Courier"
                        value={customCourierName}
                        onChange={(e) => {
                          setCustomCourierName(e.target.value);
                          if (trackingNumber.trim()) {
                            const gen = generateLiveTrackingUrl(e.target.value, trackingNumber);
                            if (gen) setTrackingUrl(gen);
                          }
                        }}
                        className="w-full text-xs bg-background border border-border rounded px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                      Tracking Number / Waybill ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ARX-982348123 or waybill code"
                      value={trackingNumber}
                      onChange={(e) => handleTrackingNumberChange(e.target.value)}
                      className="w-full text-xs bg-background border border-border rounded px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Live Tracking URL (Optional)
                      </label>
                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 underline"
                        >
                          <ExternalLink size={11} /> Test Live Link ↗
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="https://... (auto-filled from courier template or manual)"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full text-xs bg-background border border-border rounded px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                      Delivery / Special Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Call customer before delivery"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={savingDelivery}
                      onClick={() => setIsEditingDelivery(false)}
                      className="px-3 py-1.5 border border-border rounded text-xs text-muted-foreground hover:bg-accent cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingDelivery}
                      onClick={handleSaveDeliveryInfo}
                      className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded text-xs hover:bg-primary/90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save size={12} />
                      {savingDelivery ? 'Saving...' : 'Save Courier Info'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Destination Shipping Address (Admin can edit before confirmation) */}
            <div className="text-xs space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" /> Destination Address
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingAddress(!isEditingAddress);
                    setAddressError(null);
                  }}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Pencil size={11} /> {isEditingAddress ? 'Cancel' : 'Edit Address'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="bg-muted/40 p-3.5 rounded-lg border border-primary/30 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-foreground">
                    Edit Customer Shipping Address
                  </div>

                  {addressError && (
                    <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-xs flex items-center gap-1.5 font-medium">
                      <AlertCircle size={13} />
                      <span>{addressError}</span>
                    </div>
                  )}

                  {/* Searchable Country Dropdown */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                      Country * (Search &amp; Select)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCountryOpen(!isCountryOpen)}
                      className="w-full text-xs bg-background border border-border rounded px-3 py-2 flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50 transition"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>
                          {COUNTRIES_LIST.find((c) => c.name.toLowerCase() === addressForm.country?.toLowerCase())?.flag || '🌐'}
                        </span>
                        <span className="font-medium text-foreground">
                          {addressForm.country || 'Select Country'}
                        </span>
                      </span>
                      <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isCountryOpen ? 'rotate-180 text-primary' : ''}`} />
                    </button>

                    {isCountryOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                        <div className="p-2 border-b border-border bg-muted/40">
                          <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="Search country name or code..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full bg-background border border-border rounded pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
                          {COUNTRIES_LIST.filter(
                            (c) =>
                              c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                              c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
                              c.dial_code.includes(countrySearch),
                          ).length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">
                              No countries matching "{countrySearch}"
                            </div>
                          ) : (
                            COUNTRIES_LIST.filter(
                              (c) =>
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.dial_code.includes(countrySearch),
                            ).map((c) => {
                              const isSelected = addressForm.country?.toLowerCase() === c.name.toLowerCase();
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setAddressForm((prev) => ({
                                      ...prev,
                                      country: c.name,
                                    }));
                                    setIsCountryOpen(false);
                                    setCountrySearch('');
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'hover:bg-muted/60 text-foreground'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 truncate">
                                    <span>{c.flag}</span>
                                    <span className="truncate">{c.name}</span>
                                  </span>
                                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                                    {c.code}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dubai"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                        Area / State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Downtown / Deira"
                        value={addressForm.area}
                        onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                        className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Al Wasl Road, Street 24B"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                        Building / Villa / Apt
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Villa 14, Tower A"
                        value={addressForm.building}
                        onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                        className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 00000"
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                        className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                    <button
                      type="button"
                      disabled={savingAddress}
                      onClick={() => setIsEditingAddress(false)}
                      className="px-3 py-1.5 border border-border rounded text-xs text-muted-foreground hover:bg-accent cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingAddress}
                      onClick={handleSaveAddress}
                      className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded text-xs hover:bg-primary/90 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save size={12} />
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </div>
              ) : (
                (() => {
                  const country = order.shipping_country || order.address?.country || (order.customer as any)?.addresses?.[0]?.country || 'United Arab Emirates';
                  const city = order.shipping_city || order.address?.city || (order.customer as any)?.addresses?.[0]?.city;
                  const area = order.shipping_area || order.address?.area || (order.customer as any)?.addresses?.[0]?.area;
                  const street = order.shipping_street || order.address?.street || (order.customer as any)?.addresses?.[0]?.street;
                  const building = order.shipping_building || order.address?.building || (order.customer as any)?.addresses?.[0]?.building;
                  const postal = order.shipping_postal_code || order.address?.postal_code || (order.customer as any)?.addresses?.[0]?.postal_code;

                  return (
                    <div className="bg-muted/30 p-3 rounded-lg border border-border leading-relaxed text-foreground space-y-1">
                      {building && <p className="font-medium">{building}</p>}
                      {street && <p>{street}</p>}
                      {area && <p>{area}</p>}
                      <p className="font-semibold text-primary">{city ? `${city}, ` : ''}{country}</p>
                      {postal && <p className="font-mono text-xs text-muted-foreground">Postal Code: {postal}</p>}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATUS UPDATE & EMAIL NOTIFICATION MODAL */}
      {showStatusModal && pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-foreground">
                  Update Order Status
                </h3>
                <p className="text-xs text-muted-foreground">
                  Order #{order.order_number}
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Status:</span>
                <span className="font-bold text-foreground px-2 py-0.5 rounded bg-primary/20 text-primary">
                  {pendingStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium text-foreground">
                  {order.customer.first_name} {order.customer.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-mono text-foreground text-xs">
                  {order.customer.email}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Send Email Notification?
              </p>
              <p className="text-xs text-amber-200/80">
                Would you like to send an official luxury status update email to the customer informing them of this change?
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                disabled={updating}
                onClick={() => confirmStatusUpdate(true)}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Mail size={14} />
                {updating ? 'Updating...' : 'Update Status & Send Email Notification'}
              </button>
              <button
                disabled={updating}
                onClick={() => confirmStatusUpdate(false)}
                className="w-full py-2.5 px-4 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Update Status Only (Do Not Send Email)
              </button>
              <button
                disabled={updating}
                onClick={() => {
                  setShowStatusModal(false);
                  setPendingStatus(null);
                }}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
