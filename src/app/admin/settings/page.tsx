'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Save, Globe, Search, Image, RefreshCw, CheckCircle2, Upload, Trash2, Sparkles } from 'lucide-react';

const SETTING_GROUPS = [
  {
    title: 'Branding',
    icon: Globe,
    color: 'text-primary',
    bg: 'bg-primary/10',
    fields: [
      { key: 'site_name',    label: 'Site Name',    placeholder: 'Saba Al Wadi',                type: 'text' },
      { key: 'site_tagline', label: 'Tagline',       placeholder: 'Luxury Modest Wear — UAE',   type: 'text' },
      { key: 'logo_url',     label: 'Logo Image URL', placeholder: 'https://cdn.example.com/logo.png', type: 'url' },
    ],
  },
  {
    title: 'SEO',
    icon: Search,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    fields: [
      { key: 'seo_title',       label: 'Default Page Title',        placeholder: 'Saba Al Wadi | Luxury Abayas & Modest Wear', type: 'text' },
      { key: 'seo_description', label: 'Meta Description',          placeholder: 'Shop the finest custom abayas…',            type: 'textarea' },
      { key: 'seo_keywords',    label: 'Meta Keywords (comma-sep)', placeholder: 'abaya, modest wear, luxury uae',             type: 'text' },
    ],
  },
  {
    title: 'Icons & Images',
    icon: Image,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    fields: [
      { key: 'favicon_url',  label: 'Favicon URL',    placeholder: 'https://cdn.example.com/favicon.ico', type: 'url' },
      { key: 'og_image_url', label: 'OG Image URL',   placeholder: 'https://cdn.example.com/og.jpg',      type: 'url' },
    ],
  },
  {
    title: 'Currency & Rates',
    icon: RefreshCw,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    fields: [
      { key: 'default_currency',  label: 'Default Base Currency',             placeholder: 'AED',   type: 'text' },
      { key: 'currency_rate_usd', label: 'USD Rate (Relative to AED Base)',   placeholder: '0.272', type: 'text' },
      { key: 'currency_rate_gbp', label: 'GBP Rate (Relative to AED Base)',   placeholder: '0.213', type: 'text' },
    ],
  },
  {
    title: 'Dynamic Delivery & Shipping Charges',
    icon: RefreshCw,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    fields: [
      { key: 'shipping_base_fee',          label: 'Standard Delivery Fee (AED)',          placeholder: '30',          type: 'number' },
      { key: 'free_shipping_threshold',    label: 'Free Shipping Min Order (AED) [0=Off]', placeholder: '500',         type: 'number' },
      { key: 'shipping_discount_min_order', label: 'Tiered Discount Min Order (AED)',      placeholder: '600',         type: 'number' },
      { key: 'shipping_discount_type',      label: 'Discount Type (PERCENTAGE or FIXED)',  placeholder: 'PERCENTAGE',  type: 'text' },
      { key: 'shipping_discount_value',     label: 'Discount Value (% or AED amount)',     placeholder: '30',          type: 'number' },
    ],
  },
  {
    title: 'SMTP Dynamic Email Configuration',
    icon: Globe,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    fields: [
      { key: 'SMTP_HOST',   label: 'SMTP Host Server',          placeholder: 'smtp.gmail.com',                       type: 'text' },
      { key: 'SMTP_PORT',   label: 'SMTP Port',                 placeholder: '587',                                  type: 'number' },
      { key: 'SMTP_USER',   label: 'SMTP Username / Email',     placeholder: 'notifications@sabaalwadi.ae',          type: 'text' },
      { key: 'SMTP_PASS',   label: 'SMTP Password / App Secret', placeholder: '••••••••••••••••',                    type: 'password' },
      { key: 'SMTP_SECURE', label: 'Use SSL/TLS (true/false)',  placeholder: 'false',                                type: 'text' },
      { key: 'EMAIL_FROM',  label: 'Sender Display Name & Email', placeholder: 'Saba Al Wadi <no-reply@sabaalwadi.ae>', type: 'text' },
    ],
  },
  {
    title: 'Payment Gateway & Infrastructure',
    icon: RefreshCw,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    fields: [
      { key: 'STRIPE_SECRET_KEY',     label: 'Stripe Secret Key',      placeholder: 'sk_test_••••••••••••', type: 'password' },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret',  placeholder: 'whsec_••••••••••••',   type: 'password' },
      { key: 'REDIS_URL',              label: 'Redis Cache Connection (Optional - leave empty to disable)', placeholder: 'Leave empty to disable', type: 'text' },
    ],
  },
  {
    title: 'Social OAuth Login',
    icon: Globe,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    fields: [
      { key: 'GOOGLE_CLIENT_ID',     label: 'Google OAuth Client ID',      placeholder: '••••.apps.googleusercontent.com', type: 'text' },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Google OAuth Secret',         placeholder: 'GOCSPX-••••••••••••',            type: 'password' },
      { key: 'FACEBOOK_APP_ID',      label: 'Facebook App ID',             placeholder: '987654321098765',                 type: 'text' },
      { key: 'FACEBOOK_APP_SECRET',  label: 'Facebook App Secret',         placeholder: '••••••••••••••••••••••••',        type: 'password' },
    ],
  },
  {
    title: 'Cloudflare Turnstile Captcha',
    icon: Search,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    fields: [
      { key: 'CLOUDFLARE_TURNSTILE_SITE_KEY',   label: 'Turnstile Site Key',   placeholder: '1x00000000000000000000AA',                 type: 'text' },
      { key: 'CLOUDFLARE_TURNSTILE_SECRET_KEY', label: 'Turnstile Secret Key', placeholder: '1x0000000000000000000000000000000AA',         type: 'password' },
    ],
  },
  {
    title: 'Inventory & Stock Configuration',
    icon: RefreshCw,
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    fields: [
      { key: 'low_stock_threshold', label: 'Low Stock Alert Threshold (units)', placeholder: '5', type: 'number' },
    ],
  },
  {
    title: 'Security & Access Control',
    icon: Search,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    fields: [
      { key: 'ADMIN_EMAILS', label: 'Privileged Admin Emails (comma-separated)', placeholder: 'admin@example.com,srabon@example.com', type: 'text' },
      { key: 'ADMIN_EMAIL',  label: 'Admin Notification Email (Order Alerts)',   placeholder: 'admin@sabaalwadi.ae',                   type: 'text' },
    ],
  },
  {
    title: 'Size Chart & Sizing Guide',
    icon: Sparkles,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    fields: [
      { key: 'size_chart_guide_text', label: 'Size Guide Notice / Instructions', placeholder: 'Abaya lengths are standard shoulder-to-hem measurements in inches...', type: 'textarea' },
      { key: 'size_chart_image', label: 'Size Chart Graphic Image URL (Optional)', placeholder: 'https://cdn.example.com/size-guide.jpg', type: 'url' },
      { key: 'size_chart_table', label: 'Size Measurements Table (JSON format)', placeholder: '[{"size":"50","height":"5\'0\\" - 5\'1\\"","length":"50 in","bust":"40 in","sleeve":"26 in"},...]', type: 'textarea' },
    ],
  },
];

export default function SiteSettingsPage() {
  const token = useSelector((state: any) => state.auth.token);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheClearMessage, setCacheClearMessage] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/site-settings`);
      if (res.ok) setSettings(await res.json());
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSettingsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        handleChange(key, data.imageUrl);
      } else {
        const err = await res.json();
        setError(err.message || 'File upload failed');
      }
    } catch (_) {
      setError('File upload failed (Backend offline)');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/site-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save settings.');
      }
    } catch (_) {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAllCaches = async () => {
    if (!token) return;
    setClearingCache(true);
    setCacheClearMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/cache/clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Purge frontend browser storage caches
      try {
        if (typeof window !== 'undefined') {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('borka_') || k.includes('cache') || k.includes('trans'))) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        }
      } catch (_) {}

      if (res.ok) {
        const data = await res.json();
        setCacheClearMessage(data.message || 'All caches purged successfully!');
        setTimeout(() => setCacheClearMessage(''), 5000);
      } else {
        setCacheClearMessage('Failed to clear backend caches.');
      }
    } catch (_) {
      setCacheClearMessage('Error clearing caches: Backend offline or unreachable.');
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Site Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage SEO, branding, sizing guide, delivery and system configuration.</p>
        </div>
        <button
          onClick={fetchSettings}
          className="p-2 border border-border rounded-md hover:bg-accent transition cursor-pointer text-muted-foreground hover:text-foreground"
          title="Refresh Settings"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Global Cache Clearing Action Card */}
      <div className="bg-gradient-to-r from-card to-accent/20 border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              Unified System Cache Control
            </span>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">
              Storefront + Admin + Server
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            Flush all in-memory translation caches, API response caches, Redis buffers, and storefront browser storage so customers and admins instantly see updated configurations.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearAllCaches}
          disabled={clearingCache}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
        >
          <Trash2 size={14} />
          <span>{clearingCache ? 'Purging Caches...' : 'Clear All Caches'}</span>
        </button>
      </div>

      {cacheClearMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{cacheClearMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm animate-pulse">Loading settings…</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {SETTING_GROUPS.map(({ title, icon: Icon, color, bg, fields }) => (
            <div key={title} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              {/* Group header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${bg}`}>
                  <Icon size={15} className={color} />
                </div>
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              </div>

              {/* Fields */}
              <div className="p-5 space-y-4">
                {fields.map(({ key, label, placeholder, type }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {label}
                    </label>
                    {type === 'textarea' ? (
                      <textarea
                        rows={3}
                        placeholder={placeholder}
                        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                        value={settings[key] || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input
                          type={type}
                          placeholder={placeholder}
                          className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={settings[key] || ''}
                          onChange={(e) => handleChange(key, e.target.value)}
                        />
                        {(key === 'logo_url' || key === 'og_image_url' || key === 'favicon_url' || key === 'size_chart_image') && (
                          <div className="relative w-fit">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSettingsImageUpload(e, key)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button
                              type="button"
                              className="px-3 py-1.5 border border-border rounded text-[10px] uppercase font-semibold tracking-wider hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
                            >
                              <Upload size={12} /> Upload Image File
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline previews for image URLs */}
                    {(key === 'logo_url' || key === 'og_image_url' || key === 'favicon_url' || key === 'size_chart_image') && settings[key] && (
                      <img
                        src={settings[key]}
                        alt={`${label} preview`}
                        className="mt-1 max-h-24 rounded border border-border object-contain bg-zinc-900 p-1"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          {/* Save button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60"
            >
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Settings'}
            </button>
            {saved && (
              <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Settings saved successfully.
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
