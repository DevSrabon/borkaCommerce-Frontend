'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, ExternalLink, X, Save, Image, Upload, Layers } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  alt_text: string | null;
  size_type: string;
  size_description: string | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  cta_text: '',
  cta_link: '',
  image_url: '',
  mobile_image_url: '',
  alt_text: '',
  size_type: 'HERO',
  size_description: 'Desktop: 1920x800px | Mobile: 800x1000px',
  is_active: true,
  sort_order: 0,
};

const SIZE_PRESETS = {
  HERO: {
    label: 'Hero Main Slider',
    desc: 'Desktop: 1920x800px | Mobile: 800x1000px',
    guide: 'Desktop: 1920 × 800 px (Landscape 2.4:1). Mobile: 800 × 1000 px (Portrait 4:5 or 800x800 square). Max 2MB each.',
  },
  SMALL: {
    label: 'Small Promotional Card',
    desc: 'Promo Card: 600x400px (Small Banner)',
    guide: 'Recommended: 600 × 400 px (Landscape 3:2 ratio, Max 1MB). Displayed in homepage middle promo spotlight grid.',
  },
};

export default function BannersAdminPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'HERO' | 'SMALL'>('ALL');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBanners(await res.json());
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBanners(); }, [token]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, sort_order: banners.length });
    setShowForm(true);
    setError('');
  };

  const openEdit = (b: Banner) => {
    setEditId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      cta_text: b.cta_text || '',
      cta_link: b.cta_link || '',
      image_url: b.image_url,
      mobile_image_url: b.mobile_image_url || '',
      alt_text: b.alt_text || '',
      size_type: b.size_type || 'HERO',
      size_description: b.size_description || (b.size_type === 'SMALL' ? SIZE_PRESETS.SMALL.desc : SIZE_PRESETS.HERO.desc),
      is_active: b.is_active,
      sort_order: b.sort_order,
    });
    setShowForm(true);
    setError('');
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/uploads/banner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, image_url: data.imageUrl }));
      } else {
        const err = await res.json();
        setError(err.message || 'File upload failed');
      }
    } catch (err) {
      setError('File upload failed (Backend offline)');
    } finally {
      setUploading(false);
    }
  };

  const handleMobileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMobile(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/uploads/banner`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, mobile_image_url: data.imageUrl }));
      } else {
        const err = await res.json();
        setError(err.message || 'Mobile image upload failed');
      }
    } catch (err) {
      setError('Mobile image upload failed');
    } finally {
      setUploadingMobile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) {
      setError('Title and Image URL are required.');
      return;
    }
    setSaving(true);
    try {
      const url = editId
        ? `${API_BASE_URL}/admin/banners/${editId}`
        : `${API_BASE_URL}/admin/banners`;
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        await fetchBanners();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save banner.');
      }
    } catch (_) {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner permanently?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (_) {}
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/banners/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !b.is_active }),
      });
      if (res.ok) {
        setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
      }
    } catch (_) {}
  };

  const filteredBanners = banners.filter((b) => {
    if (activeTab === 'ALL') return true;
    return (b.size_type || 'HERO') === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Banners & Spotlights</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage top hero sliders and small promotional grid banners with dimension specs.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-sm"
        >
          <Plus size={14} /> New Banner
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {(['ALL', 'HERO', 'SMALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {tab === 'ALL' && `All Banners (${banners.length})`}
            {tab === 'HERO' && `Hero Sliders (${banners.filter((b) => (b.size_type || 'HERO') === 'HERO').length})`}
            {tab === 'SMALL' && `Small Banners (${banners.filter((b) => b.size_type === 'SMALL').length})`}
          </button>
        ))}
      </div>

      {/* Slide-in Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-serif text-base font-bold text-foreground">
                {editId ? 'Edit Banner' : 'Create Banner'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Banner Size Selection */}
              <div className="space-y-2 bg-accent/30 p-3 rounded-lg border border-border">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Banner Placement & Size Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        size_type: 'HERO',
                        size_description: SIZE_PRESETS.HERO.desc,
                      }))
                    }
                    className={`p-2.5 rounded border text-left cursor-pointer transition ${
                      form.size_type === 'HERO'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="text-xs font-semibold">🌟 Hero Slider</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">1920 × 800 px</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        size_type: 'SMALL',
                        size_description: SIZE_PRESETS.SMALL.desc,
                      }))
                    }
                    className={`p-2.5 rounded border text-left cursor-pointer transition ${
                      form.size_type === 'SMALL'
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="text-xs font-semibold">🏷️ Small Banner</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">600 × 400 px</div>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  {form.size_type === 'SMALL' ? SIZE_PRESETS.SMALL.guide : SIZE_PRESETS.HERO.guide}
                </p>
              </div>

              {/* Size description input */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Size Description / Dimension Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Desktop: 1920x800px | Mobile: 800x800px"
                  className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                  value={form.size_description || ''}
                  onChange={(e) => setForm({ ...form, size_description: e.target.value })}
                />
              </div>

              {/* Desktop Banner Image */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Desktop Banner Image *
                  </label>
                  <span className="text-[10px] text-muted-foreground">Recommended: 1920 × 800 px</span>
                </div>

                {form.image_url && (
                  <div
                    className={`w-full rounded-lg overflow-hidden border border-border bg-zinc-900 mb-2 ${
                      form.size_type === 'SMALL' ? 'h-36 max-w-xs mx-auto' : 'h-28 sm:h-32'
                    }`}
                  >
                    <img
                      src={form.image_url}
                      alt={form.alt_text || form.title || 'Desktop Preview'}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 border border-dashed border-border p-3 rounded bg-zinc-50/5">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-border rounded text-xs hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
                    >
                      <Upload size={12} /> {uploading ? 'Uploading Desktop Image...' : 'Upload Desktop Image File'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter desktop image URL manually..."
                    className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Image alt text"
                    className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                    value={form.alt_text}
                    onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                  />
                </div>
              </div>

              {/* Mobile Banner Image (Separate size for Mobile Devices) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span>📱 Mobile Banner Image</span>
                    <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Separate Size</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Recommended: 800 × 1000 px or 800 × 800 px</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Upload a vertical/square image specifically for smartphones & tablets. If left empty, the desktop image will be used.
                </p>

                {form.mobile_image_url && (
                  <div className="w-36 h-44 rounded-lg overflow-hidden border border-border bg-zinc-900 mx-auto my-2 shadow-xs">
                    <img
                      src={form.mobile_image_url}
                      alt="Mobile Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 border border-dashed border-amber-500/30 p-3 rounded bg-amber-500/5">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMobileImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-amber-500/40 rounded text-xs hover:bg-amber-500/10 flex items-center gap-1.5 text-foreground cursor-pointer"
                    >
                      <Upload size={12} className="text-amber-500" /> {uploadingMobile ? 'Uploading Mobile Image...' : 'Upload Mobile Image File'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter mobile image URL manually..."
                    className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                    value={form.mobile_image_url}
                    onChange={(e) => setForm({ ...form, mobile_image_url: e.target.value })}
                  />
                  {form.mobile_image_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mobile_image_url: '' })}
                      className="text-[10px] text-red-400 hover:underline self-end cursor-pointer"
                    >
                      Remove mobile image
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Title *</label>
                <input
                  type="text"
                  placeholder="New Eid Collection"
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subtitle</label>
                <input
                  type="text"
                  placeholder="Shop the finest handcrafted abayas…"
                  className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CTA Text</label>
                  <input
                    type="text"
                    placeholder="Shop Now"
                    className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.cta_text}
                    onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CTA Link</label>
                  <input
                    type="text"
                    placeholder="/catalog"
                    className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.cta_link}
                    onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full text-sm bg-background border border-border rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pb-2.5 text-foreground">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="accent-primary h-4 w-4"
                  />
                  Active (show on storefront)
                </label>
              </div>

              {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-60"
                >
                  <Save size={13} /> {saving ? 'Saving…' : 'Save Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-border rounded-md text-xs hover:bg-accent transition cursor-pointer text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading banners…</div>
      ) : filteredBanners.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl py-20 flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 bg-card rounded-full border border-border flex items-center justify-center text-muted-foreground">
            <Image size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No banners found</p>
            <p className="text-xs text-muted-foreground">Click "New Banner" to create hero sliders or small promo cards.</p>
          </div>
          <button onClick={openCreate} className="px-5 py-2 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer">
            <Plus size={12} className="inline mr-1.5" />Create First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBanners.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 bg-card border rounded-xl p-4 shadow-sm transition ${
                b.is_active ? 'border-border' : 'border-border opacity-60'
              }`}
            >
              {/* Drag handle visual */}
              <GripVertical size={16} className="text-muted-foreground shrink-0 cursor-grab hidden sm:block" />

              {/* Thumbnail(s) */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`rounded-md overflow-hidden border border-border bg-zinc-900 shrink-0 ${
                    b.size_type === 'SMALL' ? 'h-20 w-28 sm:w-32' : 'h-16 w-28 sm:w-36'
                  }`}
                  title="Desktop banner image"
                >
                  <img src={b.image_url} alt={b.alt_text || b.title} className="h-full w-full object-cover" />
                </div>
                {b.mobile_image_url && (
                  <div
                    className="rounded-md overflow-hidden border border-amber-500/40 bg-zinc-900 shrink-0 h-16 w-12"
                    title="Mobile banner image (Separate size)"
                  >
                    <img src={b.mobile_image_url} alt="Mobile preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{b.title}</p>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
                      b.size_type === 'SMALL'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {b.size_type === 'SMALL' ? 'Small Banner (600x400)' : 'Hero Slider (1920x800)'}
                  </span>
                  {b.mobile_image_url ? (
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-semibold">
                      📱 Mobile Size Set
                    </span>
                  ) : null}
                  {b.is_active ? (
                    <span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">
                      Live
                    </span>
                  ) : (
                    <span className="text-[9px] bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">
                      Hidden
                    </span>
                  )}
                </div>
                {b.size_description && (
                  <p className="text-[11px] text-primary/80 font-mono">{b.size_description}</p>
                )}
                {b.subtitle && <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Order: {b.sort_order}</span>
                  {b.cta_text && b.cta_link && (
                    <span className="flex items-center gap-1">
                      <ExternalLink size={10} /> {b.cta_text} → {b.cta_link}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleToggleActive(b)}
                  title={b.is_active ? 'Hide banner' : 'Show banner'}
                  className={`p-2 rounded-md border transition cursor-pointer ${
                    b.is_active
                      ? 'border-green-500/20 text-green-500 hover:bg-green-500/10'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {b.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-2 rounded-md border border-border text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
