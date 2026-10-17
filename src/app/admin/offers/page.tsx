'use client';

import { API_BASE_URL } from '@/config/api';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
  Plus,
  Check,
  Percent,
  Tag,
  Calendar,
  ShieldAlert,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Layers,
  Package,
  FolderTree,
  Search,
  ExternalLink,
} from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  type: string;
  priority: number;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  status: string;
  products?: { variant_id: string; variant?: { id: string; product?: { id: string; name: string } } }[];
  categories?: { category_id: string; category?: { id: string; name: string } }[];
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  minimum_amount: number | null;
  usage_limit: number | null;
  start_date: string;
  end_date: string;
  status: boolean;
}

export default function AdminOffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const tabParam = searchParams?.get('tab') as 'offers' | 'coupons' | null;
  const [activeTab, setActiveTabState] = useState<'offers' | 'coupons'>(
    tabParam === 'coupons' ? 'coupons' : 'offers'
  );

  const setActiveTab = (tab: 'offers' | 'coupons') => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const cur = searchParams?.get('tab') as 'offers' | 'coupons' | null;
    if (cur && (cur === 'offers' || cur === 'coupons') && cur !== activeTab) {
      setActiveTabState(cur);
    }
  }, [searchParams]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Available categories and products for targeting
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string }[]>([]);
  const [productsList, setProductsList] = useState<{ id: string; name: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Form toggles
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // Offer Form State
  const [offerForm, setOfferForm] = useState({
    name: '',
    type: 'GENERIC',
    priority: 1,
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
    target_type: 'ALL' as 'ALL' | 'CATEGORIES' | 'PRODUCTS',
    selected_categories: [] as string[],
    selected_products: [] as string[],
  });

  // Coupon Form State
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    minimum_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    status: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate admin
  useEffect(() => {
    if (!token || !user) {
      router.push('/login?redirect=admin/offers');
      return;
    }
    const adminEmails = ['srabon@example.com', 'admin@example.com'];
    if (!adminEmails.includes(user.email.toLowerCase())) {
      router.push('/');
    }
  }, [token, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [offRes, coupRes, catRes, prodRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/offers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/coupons`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/ecommerce/categories`),
        fetch(`${API_BASE_URL}/ecommerce/products?limit=100`),
      ]);

      if (offRes.status === 401 || coupRes.status === 401) {
        router.push('/admin/login?reason=expired');
        return;
      }

      if (offRes.ok) setOffers(await offRes.json());
      if (coupRes.ok) setCoupons(await coupRes.json());
      if (catRes.ok) setCategoriesList(await catRes.json());
      if (prodRes.ok) setProductsList(await prodRes.json());
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  // Open Create Offer
  const handleOpenCreateOffer = () => {
    setEditingOfferId(null);
    const now = new Date();
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setOfferForm({
      name: '',
      type: 'GENERIC',
      priority: 1,
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      start_date: now.toISOString().split('T')[0],
      end_date: nextMonth.toISOString().split('T')[0],
      status: 'ACTIVE',
      target_type: 'ALL',
      selected_categories: [],
      selected_products: [],
    });
    setShowOfferModal(true);
  };

  // Open Edit Offer
  const handleOpenEditOffer = (offer: Offer) => {
    setEditingOfferId(offer.id);

    // Determine target type
    let target: 'ALL' | 'CATEGORIES' | 'PRODUCTS' = 'ALL';
    const catIds = (offer.categories || []).map((c) => c.category_id);
    const prodIds: string[] = [];

    (offer.products || []).forEach((p) => {
      const prodId = p.variant?.product?.id;
      if (prodId && !prodIds.includes(prodId)) {
        prodIds.push(prodId);
      }
    });

    if (catIds.length > 0) {
      target = 'CATEGORIES';
    } else if (prodIds.length > 0 || (offer.products && offer.products.length > 0)) {
      target = 'PRODUCTS';
    }

    setOfferForm({
      name: offer.name,
      type: offer.type,
      priority: offer.priority,
      discount_type: offer.discount_type,
      discount_value: Number(offer.discount_value),
      start_date: offer.start_date ? new Date(offer.start_date).toISOString().split('T')[0] : '',
      end_date: offer.end_date ? new Date(offer.end_date).toISOString().split('T')[0] : '',
      status: offer.status,
      target_type: target,
      selected_categories: catIds,
      selected_products: prodIds,
    });
    setShowOfferModal(true);
  };

  // Submit Offer (Create or Update)
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload: any = {
      name: offerForm.name.trim(),
      type: offerForm.type,
      priority: Number(offerForm.priority),
      discount_type: offerForm.discount_type,
      discount_value: Number(offerForm.discount_value),
      start_date: new Date(offerForm.start_date).toISOString(),
      end_date: new Date(offerForm.end_date).toISOString(),
      status: offerForm.status,
      apply_to: offerForm.target_type,
    };

    if (offerForm.target_type === 'CATEGORIES') {
      if (offerForm.selected_categories.length === 0) {
        showNotification('Please select at least one category for this campaign', true);
        setSubmitting(false);
        return;
      }
      payload.category_ids = offerForm.selected_categories;
    } else if (offerForm.target_type === 'PRODUCTS') {
      if (offerForm.selected_products.length === 0) {
        showNotification('Please select at least one product for this campaign', true);
        setSubmitting(false);
        return;
      }
      payload.product_ids = offerForm.selected_products;
    }

    try {
      const url = editingOfferId
        ? `${API_BASE_URL}/admin/offers/${editingOfferId}`
        : `${API_BASE_URL}/admin/offers`;
      const method = editingOfferId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification(editingOfferId ? 'Campaign updated successfully!' : 'Campaign launched successfully!');
        setShowOfferModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Action failed', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Operation failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove campaign "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/offers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification(`Campaign "${name}" removed successfully!`);
        fetchData();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Failed to delete offer', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Error deleting offer', true);
    }
  };

  // Open Create Coupon
  const handleOpenCreateCoupon = () => {
    setEditingCouponId(null);
    const now = new Date();
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setCouponForm({
      code: '',
      discount_type: 'PERCENTAGE',
      discount_value: 10,
      minimum_amount: '',
      usage_limit: '',
      start_date: now.toISOString().split('T')[0],
      end_date: nextMonth.toISOString().split('T')[0],
      status: true,
    });
    setShowCouponModal(true);
  };

  // Open Edit Coupon
  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      minimum_amount: coupon.minimum_amount ? String(coupon.minimum_amount) : '',
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().split('T')[0] : '',
      end_date: coupon.end_date ? new Date(coupon.end_date).toISOString().split('T')[0] : '',
      status: coupon.status,
    });
    setShowCouponModal(true);
  };

  // Submit Coupon (Create or Update)
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload: any = {
      code: couponForm.code.toUpperCase().trim(),
      discount_type: couponForm.discount_type,
      discount_value: Number(couponForm.discount_value),
      minimum_amount: couponForm.minimum_amount ? Number(couponForm.minimum_amount) : null,
      usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      start_date: new Date(couponForm.start_date).toISOString(),
      end_date: new Date(couponForm.end_date).toISOString(),
      status: couponForm.status,
    };

    try {
      const url = editingCouponId
        ? `${API_BASE_URL}/admin/coupons/${editingCouponId}`
        : `${API_BASE_URL}/admin/coupons`;
      const method = editingCouponId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification(editingCouponId ? 'Coupon updated successfully!' : 'Coupon created successfully!');
        setShowCouponModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Coupon operation failed', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Operation failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification(`Coupon "${code}" deleted successfully!`);
        fetchData();
      } else {
        const err = await res.json();
        showNotification(err.message || 'Failed to delete coupon', true);
      }
    } catch (err: any) {
      showNotification(err.message || 'Error deleting coupon', true);
    }
  };

  const filteredProducts = productsList.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase().trim()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Percent className="text-primary" size={26} /> Campaigns &amp; Promotions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure automated promotional campaigns across all products, specific categories, or individual items.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateOffer}
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} /> New Campaign
          </button>
          <button
            type="button"
            onClick={handleOpenCreateCoupon}
            className="px-3.5 py-2 border border-border bg-card hover:bg-accent text-foreground font-semibold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Tag size={14} className="text-primary" /> New Coupon
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg animate-in fade-in">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-lg animate-in fade-in">
          <ShieldAlert size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-semibold gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('offers')}
          className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'offers'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Percent size={15} />
          <span>Active Campaigns ({offers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'coupons'
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag size={15} />
          <span>Checkout Coupons ({coupons.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin text-primary" />
          <span>Loading campaigns and promotional structures...</span>
        </div>
      ) : activeTab === 'offers' ? (
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Target Coverage</th>
                  <th className="py-3 px-4">Discount Applied</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {offers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No promotion campaigns found. Click &quot;New Campaign&quot; above to create one.
                    </td>
                  </tr>
                ) : (
                  offers.map((off) => {
                    const hasCategories = off.categories && off.categories.length > 0;
                    const hasProducts = off.products && off.products.length > 0;
                    const isAll = !hasCategories && !hasProducts;

                    return (
                      <tr key={off.id} className="hover:bg-muted/10 transition">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                              <Percent size={13} />
                            </span>
                            <div>
                              <span>{off.name}</span>
                              <span className="block text-xs text-muted-foreground font-mono font-normal">
                                {off.type}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isAll ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                              <Layers size={11} /> All Products
                            </span>
                          ) : hasCategories ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <FolderTree size={11} /> {off.categories!.length} {off.categories!.length === 1 ? 'Category' : 'Categories'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              <Package size={11} /> {off.products!.length} Variants
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {off.discount_type === 'PERCENTAGE'
                            ? `${off.discount_value}% OFF`
                            : `AED ${off.discount_value} OFF`}
                        </td>

                        <td className="py-3.5 px-4 text-muted-foreground">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar size={12} className="text-muted-foreground/70" />
                            <span>
                              {new Date(off.start_date).toLocaleDateString()} &ndash; {new Date(off.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-semibold">
                          {off.priority}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold border ${
                              off.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                            }`}
                          >
                            {off.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditOffer(off)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition cursor-pointer"
                              title="Edit Campaign"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOffer(off.id, off.name)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                              title="Delete Campaign"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min. Spend</th>
                  <th className="py-3 px-4 text-center">Usage Limit</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No coupon codes found. Click &quot;New Coupon&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/10 transition">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <Tag size={13} />
                          </span>
                          <span className="font-mono">{c.code}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {c.discount_type === 'PERCENTAGE'
                          ? `${c.discount_value}% OFF`
                          : `AED ${c.discount_value} OFF`}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {c.minimum_amount ? `AED ${c.minimum_amount}` : 'None'}
                      </td>

                      <td className="py-3.5 px-4 text-center text-muted-foreground font-mono">
                        {c.usage_limit ? `${c.usage_limit} claims` : 'Unlimited'}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground text-xs">
                        {new Date(c.start_date).toLocaleDateString()} &ndash; {new Date(c.end_date).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${
                            c.status
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-600 border-red-500/20'
                          }`}
                        >
                          {c.status ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCoupon(c)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* OFFER CREATE / EDIT MODAL                           */}
      {/* ==================================================== */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold">
                  {editingOfferId ? 'Edit Promotional Campaign' : 'Create Promotional Campaign'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Apply discounts storewide, to specific categories, or to individual products.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleOfferSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold block">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eid Al Fitr Mega Sale, Flash Promo 25% Off"
                    value={offerForm.name}
                    onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Campaign Type</label>
                  <select
                    value={offerForm.type}
                    onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="GENERIC">Generic Promotion</option>
                    <option value="FLASH_SALE">Flash Sale (Shows on Spotlight)</option>
                    <option value="EID_SALE">Eid Special Sale</option>
                    <option value="RAMADAN_OFFER">Ramadan Collection Offer</option>
                    <option value="BLACK_FRIDAY">Black Friday / Season Deal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Priority Rank</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={offerForm.priority}
                    onChange={(e) => setOfferForm({ ...offerForm, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Discount Method</label>
                  <select
                    value={offerForm.discount_type}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed AED Amount</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder={offerForm.discount_type === 'PERCENTAGE' ? '25' : '100'}
                    value={offerForm.discount_value}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={offerForm.start_date}
                    onChange={(e) => setOfferForm({ ...offerForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">End Date *</label>
                  <input
                    type="date"
                    required
                    value={offerForm.end_date}
                    onChange={(e) => setOfferForm({ ...offerForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold block">Campaign Status</label>
                  <select
                    value={offerForm.status}
                    onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="ACTIVE">Active (Live on Storefront)</option>
                    <option value="INACTIVE">Inactive (Draft / Suspended)</option>
                  </select>
                </div>
              </div>

              {/* TARGET SELECTION: ALL, CATEGORIES, PRODUCTS */}
              <div className="border-t border-border pt-4 space-y-3">
                <label className="font-semibold text-xs block text-foreground">
                  Where should this discount campaign apply?
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfferForm({ ...offerForm, target_type: 'ALL' })}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                      offerForm.target_type === 'ALL'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers size={16} />
                    <span className="mt-2 text-xs">All Products</span>
                    <span className="text-xs font-normal opacity-80">Storewide catalog</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOfferForm({ ...offerForm, target_type: 'CATEGORIES' })}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                      offerForm.target_type === 'CATEGORIES'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FolderTree size={16} />
                    <span className="mt-2 text-xs">Specific Categories</span>
                    <span className="text-xs font-normal opacity-80">Target collections</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOfferForm({ ...offerForm, target_type: 'PRODUCTS' })}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                      offerForm.target_type === 'PRODUCTS'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Package size={16} />
                    <span className="mt-2 text-xs">Specific Products</span>
                    <span className="text-xs font-normal opacity-80">Choose items</span>
                  </button>
                </div>

                {/* Sub-selector for CATEGORIES */}
                {offerForm.target_type === 'CATEGORIES' && (
                  <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2 animate-in fade-in">
                    <p className="text-xs font-medium text-muted-foreground">
                      Select which categories will receive this discount:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pt-1">
                      {categoriesList.map((cat) => {
                        const checked = offerForm.selected_categories.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition text-xs ${
                              checked
                                ? 'bg-primary/10 border-primary text-primary font-semibold'
                                : 'bg-card border-border text-foreground hover:bg-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOfferForm({
                                    ...offerForm,
                                    selected_categories: [...offerForm.selected_categories, cat.id],
                                  });
                                } else {
                                  setOfferForm({
                                    ...offerForm,
                                    selected_categories: offerForm.selected_categories.filter((id) => id !== cat.id),
                                  });
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="truncate">{cat.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-selector for PRODUCTS */}
                {offerForm.target_type === 'PRODUCTS' && (
                  <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2 animate-in fade-in">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search products by name..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded text-foreground focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pt-1">
                      {filteredProducts.map((prod) => {
                        const checked = offerForm.selected_products.includes(prod.id);
                        return (
                          <label
                            key={prod.id}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition text-xs ${
                              checked
                                ? 'bg-primary/10 border-primary text-primary font-semibold'
                                : 'bg-card border-border text-foreground hover:bg-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOfferForm({
                                    ...offerForm,
                                    selected_products: [...offerForm.selected_products, prod.id],
                                  });
                                } else {
                                  setOfferForm({
                                    ...offerForm,
                                    selected_products: offerForm.selected_products.filter((id) => id !== prod.id),
                                  });
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="truncate">{prod.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {offerForm.selected_products.length} product(s) selected
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-foreground transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw size={13} className="animate-spin" />}
                  <span>{editingOfferId ? 'Save Changes' : 'Launch Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* COUPON CREATE / EDIT MODAL                          */}
      {/* ==================================================== */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold">
                  {editingCouponId ? 'Edit Promo Coupon' : 'Create New Coupon'}
                </h2>
                <p className="text-xs text-muted-foreground">Checkout discount codes entered by customers.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCouponSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold block">Coupon Promo Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10, EID2026"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Discount Type</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed AED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="10"
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Minimum Spend (AED)</label>
                  <input
                    type="number"
                    placeholder="Optional (e.g. 500)"
                    value={couponForm.minimum_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, minimum_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Optional (e.g. 100 claims)"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={couponForm.start_date}
                    onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">End Date *</label>
                  <input
                    type="date"
                    required
                    value={couponForm.end_date}
                    onChange={(e) => setCouponForm({ ...couponForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block">Status</label>
                <select
                  value={couponForm.status ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setCouponForm({ ...couponForm, status: e.target.value === 'ACTIVE' })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="ACTIVE">Active (Redeemable at Checkout)</option>
                  <option value="INACTIVE">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-foreground transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw size={13} className="animate-spin" />}
                  <span>{editingCouponId ? 'Save Changes' : 'Create Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
