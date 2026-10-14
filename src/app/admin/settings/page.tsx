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
  MapPin,
  Plus,
  Phone,
  Mail,
  Clock,
  X,
  Edit2,
  Database,
  Server,
  CreditCard,
  ShieldCheck,
  Check,
  Activity,
  Layers,
  Key,
} from 'lucide-react';

interface BranchItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
}

export default function SiteSettingsPage() {
  const token = useSelector((state: any) => state.auth.token);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Active top-level tab: 'store' | 'media' | 'system'
  const [activeTab, setActiveTab] = useState<'store' | 'media' | 'system'>('store');

  // Cache clearing state
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheClearMessage, setCacheClearMessage] = useState('');

  // Storage Status and Migration
  const [storageStatus, setStorageStatus] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  // Storage connection testing state
  const [testingStorage, setTestingStorage] = useState<string | null>(null);
  const [storageTestResults, setStorageTestResults] = useState<Record<string, { success: boolean; message: string; latency?: number }>>({});

  // Dynamic Redis state
  const [redisStatus, setRedisStatus] = useState<{
    enabled: boolean;
    hasUrl: boolean;
    connected: boolean;
    healthy: boolean;
    pingMs: number | null;
    lastError: string | null;
  } | null>(null);
  const [testingRedis, setTestingRedis] = useState(false);
  const [redisTestResult, setRedisTestResult] = useState<{ success: boolean; message: string; pingMs?: number } | null>(null);

  // Dynamic Multiple Branches State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<BranchItem>({
    id: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    hours: '',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ecommerce/site-settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.footer_branches_json) {
          try {
            const parsed = JSON.parse(data.footer_branches_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBranches(parsed);
            }
          } catch {}
        } else {
          setBranches([
            {
              id: 'branch-1',
              name: 'Abu Hail Main Showroom',
              address: data.footer_address_1 || 'Suit No: M-49, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
              phone: data.footer_phone_1 || '+971 55 642 4758',
              email: 'abuhail@sabaalwadi.com',
              hours: 'Sat-Thu: 09:00am-11:00pm | Fri: 04:00pm-10:00pm',
            },
            {
              id: 'branch-2',
              name: 'Abu Hail Second Suite',
              address: data.footer_address_2 || 'Suit No: M-104, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
              phone: data.footer_phone_2 || '+971 55 79 17 409',
              email: 'deira@sabaalwadi.com',
              hours: 'Sat-Thu: 09:00am-11:00pm',
            },
            {
              id: 'branch-3',
              name: 'Abu Hail Studio & Atelier',
              address: data.footer_address_3 || 'Suit No: M-16, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
              phone: data.footer_phone_4 || '+971 55 467 5285',
              email: 'contact@sabaalwadi.com',
              hours: 'Sat-Thu: 10:00am-10:00pm',
            },
          ]);
        }
      }
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

  const fetchRedisStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/redis/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRedisStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchSettings();
    fetchStorageStatus();
    fetchRedisStatus();
  }, [token]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      id: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      hours: '',
    });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b: BranchItem) => {
    setEditingBranch(b);
    setBranchForm({ ...b });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranchForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim() || !branchForm.address.trim()) return;

    let updated: BranchItem[];
    if (editingBranch) {
      updated = branches.map((b) => (b.id === branchForm.id ? { ...branchForm } : b));
    } else {
      updated = [...branches, { ...branchForm, id: `branch-${Date.now()}` }];
    }
    setBranches(updated);
    handleChange('footer_branches_json', JSON.stringify(updated));
    setIsBranchModalOpen(false);
    setEditingBranch(null);
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm('Are you sure you want to remove this branch?')) {
      const updated = branches.filter((b) => b.id !== id);
      setBranches(updated);
      handleChange('footer_branches_json', JSON.stringify(updated));
    }
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        fetchRedisStatus();
      } else {
        setError('Failed to save settings.');
      }
    } catch (_) {
      setError('Network error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestStorage = async (driver: 'r2' | 's3' | 'cloudinary') => {
    if (!token) return;
    setTestingStorage(driver);
    setStorageTestResults((prev) => ({ ...prev, [driver]: undefined as any }));

    try {
      const res = await fetch(`${API_BASE_URL}/admin/media/test-storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          driver,
          config: settings,
        }),
      });
      const data = await res.json();
      setStorageTestResults((prev) => ({ ...prev, [driver]: data }));
    } catch (err: any) {
      setStorageTestResults((prev) => ({
        ...prev,
        [driver]: { success: false, message: err.message || 'Failed to reach server' },
      }));
    } finally {
      setTestingStorage(null);
    }
  };

  const handleTestRedis = async () => {
    if (!token) return;
    setTestingRedis(true);
    setRedisTestResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/redis/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: settings.REDIS_URL || '' }),
      });
      const data = await res.json();
      setRedisTestResult(data);
      fetchRedisStatus();
    } catch (err: any) {
      setRedisTestResult({ success: false, message: err.message || 'Failed to connect to Redis' });
    } finally {
      setTestingRedis(false);
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
    const confirmText =
      direction === 'cloudinary'
        ? 'This will upload all local image files to Cloudinary and update database URLs to Cloudinary HTTPS links. Proceed?'
        : 'This will download all Cloudinary assets to local internal storage (/uploads/migrated/) and update database URLs. Proceed?';

    if (!confirm(confirmText)) return;

    setMigrating(true);
    setMigrationMessage('');
    setError('');

    try {
      const endpoint =
        direction === 'cloudinary'
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

  const activeDriver = settings.STORAGE_DRIVER || 'local';
  const isRedisEnabled = settings.REDIS_ENABLED === 'true' || settings.REDIS_ENABLED === '1';

  return (
    <div className="space-y-6 max-w-5xl text-foreground pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">System &amp; Store Configuration</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your store settings, cloud storage drivers (Cloudflare R2, AWS S3, Cloudinary), and dynamic Redis cache.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchSettings();
              fetchStorageStatus();
              fetchRedisStatus();
            }}
            className="p-2.5 border border-border rounded-lg hover:bg-accent transition cursor-pointer text-muted-foreground hover:text-foreground shadow-xs"
            title="Refresh All Configurations"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 btn-luxury rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60 shadow-sm"
          >
            {saved ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Save size={14} />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-card/60 border border-border rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'store'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Globe size={15} />
          <span>Store &amp; General Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'media'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Cloud size={15} />
          <span>Media &amp; Cloud Storage</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full uppercase font-mono bg-background/20 font-bold">
            {activeDriver}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'system'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <Server size={15} />
          <span>System &amp; Infrastructure</span>
          {isRedisEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Redis Enabled" />
          )}
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>Settings saved and dynamic services reconnected successfully!</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm animate-pulse flex flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="animate-spin text-primary" />
          <span>Loading system configurations…</span>
        </div>
      ) : (
        <div>
          {/* ========================================================================= */}
          {/* TAB 1: STORE & GENERAL SETTINGS                                           */}
          {/* ========================================================================= */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              {/* Branding Section */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-primary/10 text-primary">
                    <Globe size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Branding &amp; Identity</h2>
                    <p className="text-[11px] text-muted-foreground">Store name, taglines, and brand logos</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Site Name
                      </label>
                      <input
                        type="text"
                        placeholder="Saba Al Wadi"
                        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={settings.site_name || ''}
                        onChange={(e) => handleChange('site_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Site Tagline
                      </label>
                      <input
                        type="text"
                        placeholder="Luxury Modest Wear — UAE"
                        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={settings.site_tagline || ''}
                        onChange={(e) => handleChange('site_tagline', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Brand Logo Image URL
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="url"
                        placeholder="https://cdn.example.com/logo.png"
                        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        value={settings.logo_url || ''}
                        onChange={(e) => handleChange('logo_url', e.target.value)}
                      />
                      <div className="relative w-fit">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSettingsImageUpload(e, 'logo_url')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button
                          type="button"
                          className="px-3 py-1.5 border border-border rounded text-[10px] uppercase font-semibold tracking-wider hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
                        >
                          <Upload size={12} /> Upload Logo File
                        </button>
                      </div>
                      {settings.logo_url && (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={settings.logo_url}
                            alt="Logo preview"
                            className="max-h-20 rounded-lg border border-border object-contain bg-zinc-950 p-1.5 shadow-sm"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          <button
                            type="button"
                            onClick={() => handleChange('logo_url', '')}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SEO & Meta Tags */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-500/10 text-blue-500">
                    <Search size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">SEO &amp; Meta Descriptions</h2>
                    <p className="text-[11px] text-muted-foreground">Search engine previews, keywords, and title tags</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Default Page Title
                    </label>
                    <input
                      type="text"
                      placeholder="Saba Al Wadi | Luxury Abayas & Modest Wear"
                      className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={settings.seo_title || ''}
                      onChange={(e) => handleChange('seo_title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Shop the finest custom abayas and luxury modest wear in UAE..."
                      className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                      value={settings.seo_description || ''}
                      onChange={(e) => handleChange('seo_description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Meta Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="abaya, modest wear, luxury uae, dubai borka"
                      className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={settings.seo_keywords || ''}
                      onChange={(e) => handleChange('seo_keywords', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Favicon & Social OG Image */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-yellow-500/10 text-yellow-500">
                    <Image size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Icons &amp; Social Share Media</h2>
                    <p className="text-[11px] text-muted-foreground">Favicon and OpenGraph image preview</p>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Favicon URL (.ico / .png)
                    </label>
                    <input
                      type="url"
                      placeholder="https://cdn.example.com/favicon.ico"
                      className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={settings.favicon_url || ''}
                      onChange={(e) => handleChange('favicon_url', e.target.value)}
                    />
                    <div className="relative w-fit">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSettingsImageUpload(e, 'favicon_url')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 border border-border rounded text-[10px] uppercase font-semibold tracking-wider hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
                      >
                        <Upload size={12} /> Upload Favicon
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      OG Share Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://cdn.example.com/og.jpg"
                      className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={settings.og_image_url || ''}
                      onChange={(e) => handleChange('og_image_url', e.target.value)}
                    />
                    <div className="relative w-fit">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSettingsImageUpload(e, 'og_image_url')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 border border-border rounded text-[10px] uppercase font-semibold tracking-wider hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
                      >
                        <Upload size={12} /> Upload OG Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flash Sale & Campaigns */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-rose-500/10 text-rose-500">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Flash Sale &amp; Campaigns</h2>
                    <p className="text-[11px] text-muted-foreground">Toggle real-time countdown banner on the homepage</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Display Flash Sale Section on Storefront</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Controls visibility of active campaign cards and countdown timers on the landing page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleChange(
                          'flash_sale_enabled',
                          settings.flash_sale_enabled === 'true' ? 'false' : 'true',
                        )
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.flash_sale_enabled === 'true' ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                          settings.flash_sale_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Size Chart Configuration */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-violet-500/10 text-violet-500">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Size Chart Configuration</h2>
                    <p className="text-[11px] text-muted-foreground">Global size guide graphic displayed across all product sheets</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Size Chart Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="Upload or paste image URL of the official size chart"
                      className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={settings.size_chart_file || ''}
                      onChange={(e) => handleChange('size_chart_file', e.target.value)}
                    />
                    <div className="relative w-fit mt-1.5">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleSettingsImageUpload(e, 'size_chart_file')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 border border-border rounded text-[10px] uppercase font-semibold tracking-wider hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
                      >
                        <Upload size={12} /> Upload Size Chart Graphic
                      </button>
                    </div>
                    {settings.size_chart_file && (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={settings.size_chart_file}
                          alt="Size Chart preview"
                          className="max-h-36 rounded-lg border border-border object-contain bg-zinc-950 p-2 shadow-sm"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <button
                          type="button"
                          onClick={() => handleChange('size_chart_file', '')}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Multiple Branches & Footer Contacts */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-amber-500/10 text-amber-500">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Footer, Helplines &amp; Boutiques</h2>
                    <p className="text-[11px] text-muted-foreground">Store contacts and interactive physical branches</p>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Brand Description (Footer Column 1)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Saba Al Wadi is an online business specializing in selling high-quality Abayas..."
                      className="w-full text-sm bg-background border border-border rounded-md px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                      value={settings.footer_about_text || ''}
                      onChange={(e) => handleChange('footer_about_text', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Help Line 1 (Tel)
                      </label>
                      <input
                        type="text"
                        placeholder="Tel: +971 55 642 4758"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.footer_phone_1 || ''}
                        onChange={(e) => handleChange('footer_phone_1', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Help Line 2 (Mob)
                      </label>
                      <input
                        type="text"
                        placeholder="Mob: +971 55 79 17 409"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.footer_phone_2 || ''}
                        onChange={(e) => handleChange('footer_phone_2', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Public Email
                      </label>
                      <input
                        type="text"
                        placeholder="contact@sabaalwadi.com"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                        value={settings.footer_email || ''}
                        onChange={(e) => handleChange('footer_email', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Branches Box */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                          <MapPin size={15} className="text-primary" />
                          Multiple Store Branches &amp; Boutiques ({branches.length})
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Physical boutiques displayed in footer columns and contact sheets.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddBranch}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                      >
                        <Plus size={13} /> Add New Branch
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {branches.map((b) => (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-xl border border-border bg-background space-y-2 relative group shadow-xs hover:border-primary/40 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-foreground line-clamp-1">{b.name}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditBranch(b)}
                                className="p-1 rounded text-muted-foreground hover:text-primary transition cursor-pointer"
                                title="Edit branch"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBranch(b.id)}
                                className="p-1 rounded text-muted-foreground hover:text-red-500 transition cursor-pointer"
                                title="Delete branch"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{b.address}</p>
                          <div className="pt-1 border-t border-border/40 space-y-1 text-[10px]">
                            {b.phone && (
                              <p className="text-primary font-mono flex items-center gap-1">
                                <Phone size={10} /> {b.phone}
                              </p>
                            )}
                            {b.email && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Mail size={10} /> {b.email}
                              </p>
                            )}
                            {b.hours && (
                              <p className="text-muted-foreground/75 italic flex items-center gap-1">
                                <Clock size={10} /> {b.hours}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency & Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Currency */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-green-500/10 text-green-500">
                      <RefreshCw size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Currency &amp; Exchange Rates</h2>
                      <p className="text-[11px] text-muted-foreground">Base AED and dynamic conversion ratios</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Default Base Currency
                      </label>
                      <input
                        type="text"
                        placeholder="AED"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono font-bold"
                        value={settings.default_currency || 'AED'}
                        onChange={(e) => handleChange('default_currency', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          USD Rate (AED Base)
                        </label>
                        <input
                          type="text"
                          placeholder="0.272"
                          className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                          value={settings.currency_rate_usd || '0.272'}
                          onChange={(e) => handleChange('currency_rate_usd', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          GBP Rate (AED Base)
                        </label>
                        <input
                          type="text"
                          placeholder="0.213"
                          className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                          value={settings.currency_rate_gbp || '0.213'}
                          onChange={(e) => handleChange('currency_rate_gbp', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery charges */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-amber-500/10 text-amber-500">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Delivery &amp; Shipping Charges</h2>
                      <p className="text-[11px] text-muted-foreground">Base fee and automated free shipping rules</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Standard Fee (AED)
                        </label>
                        <input
                          type="number"
                          placeholder="30"
                          className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                          value={settings.shipping_base_fee || '30'}
                          onChange={(e) => handleChange('shipping_base_fee', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Free Shipping Min (AED)
                        </label>
                        <input
                          type="number"
                          placeholder="500"
                          className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                          value={settings.free_shipping_threshold || '500'}
                          onChange={(e) => handleChange('free_shipping_threshold', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Discount Min (AED)
                        </label>
                        <input
                          type="number"
                          placeholder="600"
                          className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-2"
                          value={settings.shipping_discount_min_order || '600'}
                          onChange={(e) => handleChange('shipping_discount_min_order', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Discount Type
                        </label>
                        <select
                          className="w-full text-xs bg-background border border-border rounded-md px-2 py-2"
                          value={settings.shipping_discount_type || 'PERCENTAGE'}
                          onChange={(e) => handleChange('shipping_discount_type', e.target.value)}
                        >
                          <option value="PERCENTAGE">% Off</option>
                          <option value="FIXED">Fixed AED Off</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Discount Value
                        </label>
                        <input
                          type="number"
                          placeholder="30"
                          className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-2"
                          value={settings.shipping_discount_value || '30'}
                          onChange={(e) => handleChange('shipping_discount_value', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MEDIA & CLOUD STORAGE (Local, Cloudinary, Cloudflare R2, AWS S3)  */}
          {/* ========================================================================= */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Storage Driver Selector Cards */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Cloud size={16} className="text-primary" />
                    Select Active Media Storage Provider
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Newly uploaded product graphics, banners, and blog photos will be automatically processed and delivered via the selected provider.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Option 1: Local Internal */}
                  <div
                    onClick={() => handleChange('STORAGE_DRIVER', 'local')}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                      activeDriver === 'local'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-border bg-background hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <HardDrive size={18} />
                      </div>
                      {activeDriver === 'local' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary text-primary-foreground rounded-full flex items-center gap-1">
                          <Check size={10} /> Active
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Local Server Disk</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Stored inside <code className="text-primary font-mono">/uploads</code>. Zero external cost.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Cloudflare R2 */}
                  <div
                    onClick={() => handleChange('STORAGE_DRIVER', 'r2')}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                      activeDriver === 'r2'
                        ? 'border-orange-500 bg-orange-500/5 shadow-xs'
                        : 'border-border bg-background hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Cloud size={18} />
                      </div>
                      {activeDriver === 'r2' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-600 text-white rounded-full flex items-center gap-1">
                          <Check size={10} /> Active
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Cloudflare R2</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        S3-compatible, ultra fast, <strong className="text-orange-500">Zero Egress Fees</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: AWS S3 */}
                  <div
                    onClick={() => handleChange('STORAGE_DRIVER', 's3')}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                      activeDriver === 's3'
                        ? 'border-sky-500 bg-sky-500/5 shadow-xs'
                        : 'border-border bg-background hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                        <Server size={18} />
                      </div>
                      {activeDriver === 's3' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-600 text-white rounded-full flex items-center gap-1">
                          <Check size={10} /> Active
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Amazon AWS S3</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        High redundancy enterprise storage (e.g. UAE me-central-1).
                      </p>
                    </div>
                  </div>

                  {/* Option 4: Cloudinary */}
                  <div
                    onClick={() => handleChange('STORAGE_DRIVER', 'cloudinary')}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                      activeDriver === 'cloudinary'
                        ? 'border-indigo-500 bg-indigo-500/5 shadow-xs'
                        : 'border-border bg-background hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Sparkles size={18} />
                      </div>
                      {activeDriver === 'cloudinary' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full flex items-center gap-1">
                          <Check size={10} /> Active
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Cloudinary CDN</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Global edge media network with on-the-fly transformations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Asset Counts */}
              {storageStatus && (
                <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Layers size={14} className="text-primary" />
                      Live Asset Distribution Across Storage Providers
                    </span>
                    <button
                      type="button"
                      onClick={fetchStorageStatus}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} /> Refresh
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
                    <div className="bg-background border border-border p-3 rounded-lg">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase">Local Assets</div>
                      <div className="text-base font-bold mt-1 text-foreground">{storageStatus.localAssets}</div>
                    </div>
                    <div className="bg-background border border-border p-3 rounded-lg">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase text-orange-500">Cloudflare R2</div>
                      <div className="text-base font-bold mt-1 text-foreground">{storageStatus.r2Assets || 0}</div>
                    </div>
                    <div className="bg-background border border-border p-3 rounded-lg">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase text-sky-500">AWS S3</div>
                      <div className="text-base font-bold mt-1 text-foreground">{storageStatus.s3Assets || 0}</div>
                    </div>
                    <div className="bg-background border border-border p-3 rounded-lg">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase text-indigo-500">Cloudinary</div>
                      <div className="text-base font-bold mt-1 text-foreground">{storageStatus.cloudinaryAssets}</div>
                    </div>
                    <div className="bg-background border border-border p-3 rounded-lg">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase text-blue-500">External</div>
                      <div className="text-base font-bold mt-1 text-foreground">{storageStatus.externalAssets}</div>
                    </div>
                    <div className="bg-background border border-border p-3 rounded-lg">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase text-emerald-500">Total Media</div>
                      <div className="text-base font-bold mt-1 text-foreground">{storageStatus.totalAssets}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cloudflare R2 Configuration Card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-orange-500/10 text-orange-500">
                      <Cloud size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        Cloudflare R2 Configuration
                        {activeDriver === 'r2' && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                            Selected Driver
                          </span>
                        )}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">Compatible with S3 client, zero egress fees</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestStorage('r2')}
                    disabled={testingStorage === 'r2'}
                    className="px-3.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50 self-start sm:self-auto"
                  >
                    <Activity size={13} className={testingStorage === 'r2' ? 'animate-spin' : ''} />
                    <span>{testingStorage === 'r2' ? 'Testing R2...' : 'Test R2 Connection'}</span>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {storageTestResults['r2'] && (
                    <div
                      className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        storageTestResults['r2'].success
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                          : 'bg-red-500/10 border border-red-500/30 text-red-500'
                      }`}
                    >
                      {storageTestResults['r2'].success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span>{storageTestResults['r2'].message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Cloudflare Account ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9b7d4e5f6a1b2c3d4e5f6a1b2c3d4e5f"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.R2_ACCOUNT_ID || ''}
                        onChange={(e) => handleChange('R2_ACCOUNT_ID', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        R2 Bucket Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. borkacommerce-assets"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.R2_BUCKET_NAME || ''}
                        onChange={(e) => handleChange('R2_BUCKET_NAME', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        R2 Access Key ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 7f3a1c8b9d2e4f5a6b7c8d9e"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.R2_ACCESS_KEY_ID || ''}
                        onChange={(e) => handleChange('R2_ACCESS_KEY_ID', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        R2 Secret Access Key
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.R2_SECRET_ACCESS_KEY || ''}
                        onChange={(e) => handleChange('R2_SECRET_ACCESS_KEY', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Public Custom Domain / CDN URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://media.sabaalwadi.com or https://pub-xxx.r2.dev"
                      className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                      value={settings.R2_PUBLIC_DOMAIN || ''}
                      onChange={(e) => handleChange('R2_PUBLIC_DOMAIN', e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      If left blank, will default to direct Cloudflare bucket public URL.
                    </p>
                  </div>
                </div>
              </div>

              {/* AWS S3 Configuration Card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-sky-500/10 text-sky-500">
                      <Server size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        Amazon AWS S3 Configuration
                        {activeDriver === 's3' && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20">
                            Selected Driver
                          </span>
                        )}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">Standard Amazon Simple Storage Service</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestStorage('s3')}
                    disabled={testingStorage === 's3'}
                    className="px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50 self-start sm:self-auto"
                  >
                    <Activity size={13} className={testingStorage === 's3' ? 'animate-spin' : ''} />
                    <span>{testingStorage === 's3' ? 'Testing S3...' : 'Test S3 Connection'}</span>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {storageTestResults['s3'] && (
                    <div
                      className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        storageTestResults['s3'].success
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                          : 'bg-red-500/10 border border-red-500/30 text-red-500'
                      }`}
                    >
                      {storageTestResults['s3'].success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span>{storageTestResults['s3'].message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        AWS Region
                      </label>
                      <input
                        type="text"
                        placeholder="me-central-1"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.AWS_S3_REGION || 'me-central-1'}
                        onChange={(e) => handleChange('AWS_S3_REGION', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        S3 Bucket Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. sabaalwadi-product-media"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.AWS_S3_BUCKET_NAME || ''}
                        onChange={(e) => handleChange('AWS_S3_BUCKET_NAME', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        AWS Access Key ID
                      </label>
                      <input
                        type="text"
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.AWS_S3_ACCESS_KEY_ID || ''}
                        onChange={(e) => handleChange('AWS_S3_ACCESS_KEY_ID', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        AWS Secret Access Key
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.AWS_S3_SECRET_ACCESS_KEY || ''}
                        onChange={(e) => handleChange('AWS_S3_SECRET_ACCESS_KEY', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Public CloudFront / CDN Domain (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://d111111abcdef8.cloudfront.net"
                      className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                      value={settings.AWS_S3_PUBLIC_DOMAIN || ''}
                      onChange={(e) => handleChange('AWS_S3_PUBLIC_DOMAIN', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Cloudinary Configuration Card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        Cloudinary CDN Configuration
                        {activeDriver === 'cloudinary' && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                            Selected Driver
                          </span>
                        )}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">Edge CDN with dynamic compression and webp optimization</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestStorage('cloudinary')}
                    disabled={testingStorage === 'cloudinary'}
                    className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50 self-start sm:self-auto"
                  >
                    <Activity size={13} className={testingStorage === 'cloudinary' ? 'animate-spin' : ''} />
                    <span>{testingStorage === 'cloudinary' ? 'Testing...' : 'Test Cloudinary Connection'}</span>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {storageTestResults['cloudinary'] && (
                    <div
                      className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        storageTestResults['cloudinary'].success
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                          : 'bg-red-500/10 border border-red-500/30 text-red-500'
                      }`}
                    >
                      {storageTestResults['cloudinary'].success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span>{storageTestResults['cloudinary'].message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Cloudinary Cloud Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. dxyz1234"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.CLOUDINARY_CLOUD_NAME || ''}
                        onChange={(e) => handleChange('CLOUDINARY_CLOUD_NAME', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Root Upload Folder
                      </label>
                      <input
                        type="text"
                        placeholder="borkacommerce"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.CLOUDINARY_FOLDER || 'borkacommerce'}
                        onChange={(e) => handleChange('CLOUDINARY_FOLDER', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Cloudinary API Key
                      </label>
                      <input
                        type="text"
                        placeholder="123456789012345"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.CLOUDINARY_API_KEY || ''}
                        onChange={(e) => handleChange('CLOUDINARY_API_KEY', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Cloudinary API Secret
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.CLOUDINARY_API_SECRET || ''}
                        onChange={(e) => handleChange('CLOUDINARY_API_SECRET', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Migration Action Tools */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <ArrowRightLeft size={14} className="text-primary" />
                    Bi-Directional Asset Migration Tools
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Move existing media records in bulk between local server disk and remote cloud CDN.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    <span>{migrationMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SYSTEM & INFRASTRUCTURE (Dynamic Redis, Stripe, SMTP, OAuth, etc.)  */}
          {/* ========================================================================= */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              {/* Dynamic Redis Cache Card */}
              <div className="bg-gradient-to-br from-card via-card to-red-500/5 border border-border rounded-xl p-5 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                      <Database size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-foreground">Dynamic Redis Cache Service</h2>
                        {redisStatus?.enabled ? (
                          redisStatus.connected ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected {redisStatus.pingMs ? `(${redisStatus.pingMs}ms)` : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Disconnected
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground border border-border">
                            Disabled (In-Memory Fallback)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        High-speed memory buffer for product listings, translations, rate limiting, and session caching.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={fetchRedisStatus}
                      className="p-2 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer text-xs"
                      title="Refresh Redis Status"
                    >
                      <RefreshCw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleTestRedis}
                      disabled={testingRedis}
                      className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs disabled:opacity-50"
                    >
                      <Activity size={13} className={testingRedis ? 'animate-spin' : ''} />
                      <span>{testingRedis ? 'Testing Ping...' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>

                {/* Redis Test Result Banner */}
                {redisTestResult && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      redisTestResult.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                        : 'bg-red-500/10 border border-red-500/30 text-red-500'
                    }`}
                  >
                    {redisTestResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{redisTestResult.message}</span>
                  </div>
                )}

                {/* Toggle & Dynamic URL String */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Enable / Disable Switch */}
                  <div className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Enable Redis Cache</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isRedisEnabled ? 'Redis is active' : 'Disabled (Direct DB/RAM)'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleChange('REDIS_ENABLED', isRedisEnabled ? 'false' : 'true')
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isRedisEnabled ? 'bg-emerald-600' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isRedisEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Redis Connection URL */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Redis Dynamic Connection String (URI)</span>
                      <span className="text-[9px] text-primary lowercase">e.g. redis://user:pass@host:6379</span>
                    </label>
                    <input
                      type="text"
                      placeholder="redis://default:password@127.0.0.1:6379 or rediss://... (leave empty to disable)"
                      className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      value={settings.REDIS_URL || ''}
                      onChange={(e) => handleChange('REDIS_URL', e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Supports standalone Redis, Upstash, AWS ElastiCache, or Redis Cloud. Reconnects on the fly upon saving.
                    </p>
                  </div>
                </div>
              </div>

              {/* Unified Cache Control */}
              <div className="bg-gradient-to-r from-card to-accent/20 border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      Unified System Cache Control
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">
                      Storefront + Admin + Server
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Purge all in-memory translation caches, API response buffers, and browser storage so clients immediately receive fresh updates.
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{cacheClearMessage}</span>
                </div>
              )}

              {/* Payment Gateway (Stripe) */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-purple-500/10 text-purple-500">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Payment Gateways &amp; Stripe</h2>
                    <p className="text-[11px] text-muted-foreground">Secure credit card checkout keys and webhooks</p>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Stripe Secret Key
                    </label>
                    <input
                      type="password"
                      placeholder="sk_test_••••••••••••••••••••••••"
                      className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                      value={settings.STRIPE_SECRET_KEY || ''}
                      onChange={(e) => handleChange('STRIPE_SECRET_KEY', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Stripe Webhook Secret
                    </label>
                    <input
                      type="password"
                      placeholder="whsec_••••••••••••••••••••••••"
                      className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                      value={settings.STRIPE_WEBHOOK_SECRET || ''}
                      onChange={(e) => handleChange('STRIPE_WEBHOOK_SECRET', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SMTP Mail Configuration */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-sky-500/10 text-sky-500">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">SMTP Dynamic Email Server</h2>
                    <p className="text-[11px] text-muted-foreground">Automated customer order receipts and system alerts</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        SMTP Host Server
                      </label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.SMTP_HOST || 'smtp.gmail.com'}
                        onChange={(e) => handleChange('SMTP_HOST', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        placeholder="587"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.SMTP_PORT || '587'}
                        onChange={(e) => handleChange('SMTP_PORT', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        SMTP Username / Email
                      </label>
                      <input
                        type="text"
                        placeholder="notifications@sabaalwadi.ae"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                        value={settings.SMTP_USER || ''}
                        onChange={(e) => handleChange('SMTP_USER', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        SMTP Password / App Secret
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.SMTP_PASS || ''}
                        onChange={(e) => handleChange('SMTP_PASS', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sender Display Name &amp; Email
                      </label>
                      <input
                        type="text"
                        placeholder="Saba Al Wadi <no-reply@sabaalwadi.ae>"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                        value={settings.EMAIL_FROM || ''}
                        onChange={(e) => handleChange('EMAIL_FROM', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Use SSL/TLS
                      </label>
                      <select
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                        value={settings.SMTP_SECURE || 'false'}
                        onChange={(e) => handleChange('SMTP_SECURE', e.target.value)}
                      >
                        <option value="false">STARTTLS / Port 587 (Recommended)</option>
                        <option value="true">Direct SSL / Port 465</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social OAuth Login & Security */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OAuth */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                      <Globe size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Social OAuth Login</h2>
                      <p className="text-[11px] text-muted-foreground">Google &amp; Facebook authentication credentials</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Google OAuth Client ID
                      </label>
                      <input
                        type="text"
                        placeholder="••••.apps.googleusercontent.com"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.GOOGLE_CLIENT_ID || ''}
                        onChange={(e) => handleChange('GOOGLE_CLIENT_ID', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Google OAuth Secret
                      </label>
                      <input
                        type="password"
                        placeholder="GOCSPX-••••••••••••"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.GOOGLE_CLIENT_SECRET || ''}
                        onChange={(e) => handleChange('GOOGLE_CLIENT_SECRET', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Cloudflare Turnstile */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                    <div className="h-8 w-8 rounded-md flex items-center justify-center bg-amber-500/10 text-amber-500">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Cloudflare Turnstile Captcha</h2>
                      <p className="text-[11px] text-muted-foreground">Bot mitigation and checkout protection</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Turnstile Site Key
                      </label>
                      <input
                        type="text"
                        placeholder="1x00000000000000000000AA"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                        onChange={(e) => handleChange('CLOUDFLARE_TURNSTILE_SITE_KEY', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Turnstile Secret Key
                      </label>
                      <input
                        type="password"
                        placeholder="1x0000000000000000000000000000000AA"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2 font-mono"
                        value={settings.CLOUDFLARE_TURNSTILE_SECRET_KEY || ''}
                        onChange={(e) => handleChange('CLOUDFLARE_TURNSTILE_SECRET_KEY', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Access & Stock alerts */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-background/50">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                    <Key size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Admin Access &amp; Stock Alerts</h2>
                    <p className="text-[11px] text-muted-foreground">Authorized administrative emails and low stock thresholds</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Privileged Admin Emails (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="admin@example.com, srabon@example.com"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                        value={settings.ADMIN_EMAILS || ''}
                        onChange={(e) => handleChange('ADMIN_EMAILS', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Low Stock Alert Limit (units)
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        className="w-full text-xs bg-background border border-border rounded-md px-3 py-2"
                        value={settings.low_stock_threshold || '5'}
                        onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating/Fixed Save Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
            <p className="text-xs text-muted-foreground">
              Tip: Switching storage drivers or redis connections will take effect dynamically without restarting the server.
            </p>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 btn-luxury rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60 shadow-md"
            >
              {saved ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Save size={14} />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save All Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-foreground">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-background">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <h3 className="font-serif text-base font-bold text-foreground">
                  {editingBranch ? 'Edit Store Branch' : 'Add New Store Branch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBranchForm} className="p-5 space-y-3.5 bg-card text-xs">
              <div>
                <label className="block font-semibold mb-1 uppercase text-[10px] tracking-wider text-muted-foreground">
                  Branch / Boutique Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abu Hail Main Showroom"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 uppercase text-[10px] tracking-wider text-muted-foreground">
                  Full Physical Address *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Suit No: M-49, 2nd Floor, Al Habtoor Building, Abu Hail, Deira-Dubai, P.O Box-67242"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 uppercase text-[10px] tracking-wider text-muted-foreground">
                    Contact Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +971 55 642 4758"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 uppercase text-[10px] tracking-wider text-muted-foreground">
                    Branch Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. abuhail@sabaalwadi.com"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 uppercase text-[10px] tracking-wider text-muted-foreground">
                  Visiting / Business Hours
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sat-Thu: 09:00am-11:00pm | Fri: 04:00pm-10:00pm"
                  value={branchForm.hours}
                  onChange={(e) => setBranchForm({ ...branchForm, hours: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs transition cursor-pointer shadow-sm"
                >
                  {editingBranch ? 'Update Branch' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
