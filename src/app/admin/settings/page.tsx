'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Save,
  Globe,
  Search,
  Image,
  RefreshCw,
  CheckCircle2,
  Upload,
  Trash2,
  Sparkles,
  Cloud,
  HardDrive,
  ArrowRightLeft,
  AlertCircle,
  FileText,
} from 'lucide-react';

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
    title: 'Icons & Media Assets',
    icon: Image,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    fields: [
      { key: 'favicon_url',  label: 'Favicon URL',    placeholder: 'https://cdn.example.com/favicon.ico', type: 'url' },
      { key: 'og_image_url', label: 'OG Image URL',   placeholder: 'https://cdn.example.com/og.jpg',      type: 'url' },
    ],
  },
  {
    title: 'Asset Storage Driver & Cloudinary',
    icon: Cloud,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    fields: [
      {
        key: 'STORAGE_DRIVER',
        label: 'Active Media Storage Driver (local or cloudinary)',
        placeholder: 'local',
        type: 'select',
        options: [
          { value: 'local', label: 'Internal Server Storage (/uploads)' },
          { value: 'cloudinary', label: 'Cloudinary Cloud CDN (Fast Global Delivery)' },
        ],
      },
      { key: 'CLOUDINARY_CLOUD_NAME', label: 'Cloudinary Cloud Name', placeholder: 'e.g. dxyz1234',       type: 'text' },
      { key: 'CLOUDINARY_API_KEY',    label: 'Cloudinary API Key',    placeholder: 'e.g. 123456789012345', type: 'text' },
      { key: 'CLOUDINARY_API_SECRET', label: 'Cloudinary API Secret', placeholder: '••••••••••••••••••••', type: 'password' },
      { key: 'CLOUDINARY_FOLDER',     label: 'Cloudinary Root Folder', placeholder: 'borkacommerce',        type: 'text' },
    ],
  },
  {
    title: 'Flash Sale & Campaign Spotlight',
    icon: Sparkles,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    fields: [
      {
        key: 'flash_sale_enabled',
        label: 'Display Flash Sale Banner & Countdown on Homepage',
        placeholder: 'true',
        type: 'select',
        options: [
          { value: 'true', label: 'Enabled (Show active Flash Sale with Real-time Countdown)' },
          { value: 'false', label: 'Disabled (Hide Flash Sale section)' },
        ],
      },
    ],
  },
  {
    title: 'Size Chart Configuration',
    icon: FileText,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    fields: [
      {
        key: 'size_chart_file',
        label: 'Size Chart Graphic Image / Document File',
        placeholder: 'Upload or paste image URL of the official size chart',
        type: 'url',
      },
    ],
  },
  {
    title: 'Dynamic Footer & Store Contact Information',
    icon: Globe,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    fields: [
      { key: 'footer_about_text',    label: 'Brand Description (Column 1)', placeholder: 'Saba Al Wadi is an online business specializing in selling high-quality Abayas...', type: 'textarea' },
      { key: 'footer_phone_1',       label: 'Help Line 1 (Tel)',           placeholder: 'Tel: +971 55 642 4758',                                                  type: 'text' },
      { key: 'footer_phone_2',       label: 'Help Line 2 (Mob)',           placeholder: 'Mob: +971 55 79 17 409',                                                 type: 'text' },
      { key: 'footer_phone_3',       label: 'Help Line 3 (Mob)',           placeholder: 'Mob: +971 50 93 75 919',                                                 type: 'text' },
      { key: 'footer_phone_4',       label: 'Help Line 4 / Branch Contact', placeholder: 'Mob: +971 55 467 5285 (Suit No: M-16 Contact Number)',                  type: 'text' },
      { key: 'footer_email',         label: 'Public Contact Email',        placeholder: 'contact@sabaalwadi.com',                                                 type: 'text' },
      { key: 'footer_hours_sat_thu', label: 'Business Hours (Sat-Thu)',     placeholder: 'Sat-Thu: 09:00am-11:00pm',                                               type: 'text' },
      { key: 'footer_hours_fri',     label: 'Business Hours (Friday)',      placeholder: 'Friday: 04:00pm-10:00pm',                                                type: 'text' },
      { key: 'footer_address_1',     label: 'Branch Address 1',            placeholder: 'Suit No: M-49, 2nd Floor, Al Habtoor Building...',                      type: 'text' },
      { key: 'footer_address_2',     label: 'Branch Address 2',            placeholder: 'Suit No: M-104, 2nd Floor, Al Habtoor Building...',                     type: 'text' },
      { key: 'footer_address_3',     label: 'Branch Address 3',            placeholder: 'Suit No: M-16, 2nd Floor, Al Habtoor Building...',                      type: 'text' },
      { key: 'social_facebook',      label: 'Facebook Page URL',           placeholder: 'https://facebook.com/sabaalwadi',                                        type: 'url' },
      { key: 'social_instagram',     label: 'Instagram Page URL',          placeholder: 'https://instagram.com/sabaalwadi',                                       type: 'url' },
      { key: 'social_youtube',       label: 'YouTube Channel URL',         placeholder: 'https://youtube.com/@sabaalwadi',                                        type: 'url' },
      { key: 'social_pinterest',     label: 'Pinterest Profile URL',       placeholder: 'https://pinterest.com/sabaalwadi',                                       type: 'url' },
      { key: 'social_tiktok',        label: 'TikTok Profile URL',          placeholder: 'https://tiktok.com/@sabaalwadi',                                        type: 'url' },
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

  // Storage Status and Migration
  const [storageStatus, setStorageStatus] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/site-settings`);
      if (res.ok) setSettings(await res.json());
    } catch (_) {}
    finally { setLoading(false); }
  };

  const fetchStorageStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/media/storage-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStorageStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchSettings();
    fetchStorageStatus();
  }, [token]);

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
        fetchStorageStatus();
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

  const handleMigrate = async (direction: 'cloudinary' | 'local') => {
    if (!token) return;
    const confirmText = direction === 'cloudinary'
      ? 'This will upload all local image files to Cloudinary and update all image URLs in the database to Cloudinary HTTPS links. Proceed?'
      : 'This will download all Cloudinary assets to the local internal server storage (/uploads/migrated/) and update database URLs to local paths. Proceed?';
    
    if (!confirm(confirmText)) return;

    setMigrating(true);
    setMigrationMessage('');
    setError('');

    try {
      const endpoint = direction === 'cloudinary'
        ? `${API_BASE_URL}/admin/media/migrate-to-cloudinary`
        : `${API_BASE_URL}/admin/media/migrate-to-local`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMigrationMessage(data.message || `Migration completed! ${data.migratedCount} assets processed.`);
        fetchStorageStatus();
        fetchSettings();
      } else {
        setError(data.message || 'Migration encountered an error.');
      }
    } catch (err: any) {
      setError(err?.message || 'Migration failed: Network error.');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl text-foreground pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Site & Asset Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure branding, cloud vs internal asset storage, size charts, dynamic delivery, and campaigns.
          </p>
        </div>
        <button
          onClick={() => { fetchSettings(); fetchStorageStatus(); }}
          className="p-2 border border-border rounded-md hover:bg-accent transition cursor-pointer text-muted-foreground hover:text-foreground"
          title="Refresh Settings"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Asset Storage & Live Migration Card */}
      <div className="bg-gradient-to-br from-card via-card to-accent/30 border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                Asset Storage & Bi-directional Migration
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  (settings.STORAGE_DRIVER || 'local') === 'cloudinary'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  Active: {settings.STORAGE_DRIVER || 'local'}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Seamlessly store files locally or on Cloudinary CDN, and migrate all existing DB assets with 1 click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStorageStatus}
            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={12} /> Refresh counts
          </button>
        </div>

        {/* Live Asset Counts */}
        {storageStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-background/80 border border-border p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-semibold">
                <HardDrive size={13} className="text-amber-500" /> Local Server Assets
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">{storageStatus.localAssets}</div>
            </div>
            <div className="bg-background/80 border border-border p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-semibold">
                <Cloud size={13} className="text-indigo-500" /> Cloudinary CDN Assets
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">{storageStatus.cloudinaryAssets}</div>
            </div>
            <div className="bg-background/80 border border-border p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-semibold">
                <Globe size={13} className="text-blue-500" /> External / Unsplash
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">{storageStatus.externalAssets}</div>
            </div>
            <div className="bg-background/80 border border-border p-3 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-semibold">
                <Sparkles size={13} className="text-emerald-500" /> Total Media Records
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">{storageStatus.totalAssets}</div>
            </div>
          </div>
        )}

        {/* Migration Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleMigrate('cloudinary')}
            disabled={migrating}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <ArrowRightLeft size={14} />
            <span>{migrating ? 'Migrating assets...' : 'Migrate Internal ➔ Cloudinary'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleMigrate('local')}
            disabled={migrating}
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <ArrowRightLeft size={14} />
            <span>{migrating ? 'Migrating assets...' : 'Migrate Cloudinary ➔ Internal Storage'}</span>
          </button>
        </div>

        {migrationMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{migrationMessage}</span>
          </div>
        )}
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
                {fields.map((field: any) => {
                  const { key, label, placeholder, type, options } = field;
                  const isImageField = key === 'logo_url' || key === 'og_image_url' || key === 'favicon_url' || key === 'size_chart_file';

                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {label}
                      </label>

                      {type === 'select' ? (
                        <select
                          className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          value={settings[key] || (options?.[0]?.value ?? '')}
                          onChange={(e) => handleChange(key, e.target.value)}
                        >
                          {options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : type === 'textarea' ? (
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

                          {isImageField && (
                            <div className="relative w-fit">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleSettingsImageUpload(e, key)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <button
                                type="button"
                                className="px-3 py-1.5 border border-border rounded text-[10px] uppercase font-semibold tracking-wider hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
                              >
                                <Upload size={12} /> Upload File ({key === 'size_chart_file' ? 'Chart Graphic' : 'Image'})
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline preview for image/file URLs */}
                      {isImageField && settings[key] && (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={settings[key]}
                            alt={`${label} preview`}
                            className="max-h-28 rounded-lg border border-border object-contain bg-zinc-950 p-1.5 shadow-sm"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          <button
                            type="button"
                            onClick={() => handleChange(key, '')}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center gap-4 pt-2">
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
