'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Plus, Check, Percent, Tag, Calendar, ShieldAlert } from 'lucide-react';

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
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [activeTab, setActiveTab] = useState<'offers' | 'coupons'>('offers');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form toggles
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);

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
      const offRes = await fetch(`${API_BASE_URL}/admin/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (offRes.status === 401) {
        router.push('/admin/login?reason=expired');
        return;
      }
      if (offRes.ok) setOffers(await offRes.json());

      const coupRes = await fetch(`${API_BASE_URL}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (coupRes.status === 401) {
        router.push('/admin/login?reason=expired');
        return;
      }
      if (coupRes.ok) setCoupons(await coupRes.json());
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...offerForm,
      priority: Number(offerForm.priority),
      discount_value: Number(offerForm.discount_value),
      start_date: new Date(offerForm.start_date).toISOString(),
      end_date: new Date(offerForm.end_date).toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/admin/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess('Promotion campaign created atomically!');
        setShowOfferForm(false);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.message || 'Creation failed');
      }
    } catch (err) {
      const newMock: Offer = {
        id: `mock-off-${Date.now()}`,
        name: offerForm.name,
        type: offerForm.type,
        priority: Number(offerForm.priority),
        discount_type: offerForm.discount_type,
        discount_value: Number(offerForm.discount_value),
        start_date: offerForm.start_date,
        end_date: offerForm.end_date,
        status: offerForm.status,
      };
      setOffers((prev) => [newMock, ...prev]);
      setSuccess('Campaign preview generated locally! (Backend offline)');
      setShowOfferForm(false);
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...couponForm,
      discount_value: Number(couponForm.discount_value),
      minimum_amount: couponForm.minimum_amount ? Number(couponForm.minimum_amount) : null,
      usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      start_date: new Date(couponForm.start_date).toISOString(),
      end_date: new Date(couponForm.end_date).toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess('Coupon code generated successfully!');
        setShowCouponForm(false);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.message || 'Creation failed');
      }
    } catch (err) {
      const newMock: Coupon = {
        id: `mock-coup-${Date.now()}`,
        code: couponForm.code.toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        minimum_amount: couponForm.minimum_amount ? Number(couponForm.minimum_amount) : null,
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
        start_date: couponForm.start_date,
        end_date: couponForm.end_date,
        status: couponForm.status,
      };
      setCoupons((prev) => [newMock, ...prev]);
      setSuccess('Coupon preview generated locally! (Backend offline)');
      setShowCouponForm(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Campaigns & Promotions</h1>
          <p className="text-xs text-muted-foreground font-light">Set up automated discount structures or checkout codes.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowOfferForm(!showOfferForm);
              setShowCouponForm(false);
            }}
            className="px-4 py-2 border border-border rounded text-xs hover:bg-accent cursor-pointer text-foreground"
          >
            New Offer Campaign
          </button>
          <button
            onClick={() => {
              setShowCouponForm(!showCouponForm);
              setShowOfferForm(false);
            }}
            className="px-4 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> New Coupon
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

      {/* Offer creation form */}
      {showOfferForm && (
        <form onSubmit={handleOfferSubmit} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="font-serif text-md font-bold">Create New Campaigns</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Campaign Name</label>
              <input
                type="text"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={offerForm.name}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Offer Type</label>
              <select
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 text-foreground focus:outline-none"
                value={offerForm.type}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="GENERIC">Generic Promo</option>
                <option value="EID_SALE">Eid Festive Sale</option>
                <option value="FLASH_SALE">Flash Discount</option>
                <option value="RAMADAN_OFFER">Ramadan Offer</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Priority Weight</label>
              <input
                type="number"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={offerForm.priority}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Discount Type</label>
              <select
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 text-foreground focus:outline-none"
                value={offerForm.discount_type}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, discount_type: e.target.value }))}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed AED Discount</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Discount Value</label>
              <input
                type="number"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={offerForm.discount_value}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, discount_value: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Campaign Status</label>
              <select
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 text-foreground focus:outline-none"
                value={offerForm.status}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Campaign Start</label>
              <input
                type="date"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={offerForm.start_date}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Campaign End</label>
              <input
                type="date"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={offerForm.end_date}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowOfferForm(false)}
              className="px-3 py-1.5 border border-border rounded text-xs hover:bg-accent cursor-pointer"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
              Launch Campaign
            </button>
          </div>
        </form>
      )}

      {/* Coupon creation form */}
      {showCouponForm && (
        <form onSubmit={handleCouponSubmit} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="font-serif text-md font-bold">Generate Coupon Code</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. SAVE20"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={couponForm.code}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Discount Type</label>
              <select
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 text-foreground focus:outline-none"
                value={couponForm.discount_type}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, discount_type: e.target.value }))}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed AED Discount</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Discount Value</label>
              <input
                type="number"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={couponForm.discount_value}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, discount_value: Number(e.target.value) }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Minimum Spend (AED)</label>
              <input
                type="number"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={couponForm.minimum_amount}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, minimum_amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Global Usage Limit</label>
              <input
                type="number"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={couponForm.usage_limit}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, usage_limit: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Coupon Status</label>
              <select
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 text-foreground focus:outline-none"
                value={couponForm.status ? 'true' : 'false'}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, status: e.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Active Date</label>
              <input
                type="date"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={couponForm.start_date}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Expiry Date</label>
              <input
                type="date"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                value={couponForm.end_date}
                onChange={(e) => setCouponForm((prev) => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCouponForm(false)}
              className="px-3 py-1.5 border border-border rounded text-xs hover:bg-accent cursor-pointer"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
              Generate Code
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border text-xs uppercase tracking-wider font-semibold">
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-6 py-3 border-b-2 transition ${
            activeTab === 'offers' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Active Campaigns
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-3 border-b-2 transition ${
            activeTab === 'coupons' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Checkout Coupons
        </button>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="p-8 text-center text-sm text-muted font-light">Loading catalog listings...</div>
      ) : activeTab === 'offers' ? (
        <section className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                <th className="p-4">Offer Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Discount Applied</th>
                <th className="p-4">Timeline</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-light text-foreground">
              {offers.map((off) => (
                <tr key={off.id} className="hover:bg-accent/40">
                  <td className="p-4 font-medium flex items-center gap-2">
                    <Percent size={14} className="text-primary" />
                    {off.name}
                  </td>
                  <td className="p-4 text-muted uppercase font-mono">{off.type}</td>
                  <td className="p-4 font-semibold">
                    {off.discount_type === 'PERCENTAGE' ? `${off.discount_value}% Off` : `AED ${off.discount_value} Off`}
                  </td>
                  <td className="p-4 flex items-center gap-1.5 text-muted">
                    <Calendar size={12} />
                    {new Date(off.start_date).toLocaleDateString()} - {new Date(off.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-4">{off.priority}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                        off.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                      }`}
                    >
                      {off.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                <th className="p-4">Promo Code</th>
                <th className="p-4">Discount Applied</th>
                <th className="p-4">Min. Order Threshold</th>
                <th className="p-4">Usage Limit</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-light text-foreground">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-accent/40">
                  <td className="p-4 font-semibold flex items-center gap-2">
                    <Tag size={14} className="text-primary" />
                    {c.code}
                  </td>
                  <td className="p-4 font-semibold">
                    {c.discount_type === 'PERCENTAGE' ? `${c.discount_value}% Off` : `AED ${c.discount_value} Off`}
                  </td>
                  <td className="p-4 text-muted">
                    {c.minimum_amount ? `AED ${c.minimum_amount}` : 'No Minimum'}
                  </td>
                  <td className="p-4">{c.usage_limit ? `${c.usage_limit} claims` : 'Unlimited'}</td>
                  <td className="p-4 text-muted">{new Date(c.end_date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                        c.status
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}
                    >
                      {c.status ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
