'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, ExternalLink, X, Save, Image, Upload } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string;
  alt_text: string | null;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  cta_text: '',
  cta_link: '',
  image_url: '',
  alt_text: '',
  is_active: true,
  sort_order: 0,
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
  const [error, setError] = useState('');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/admin/banners', {
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
      alt_text: b.alt_text || '',
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
      const res = await fetch('http://localhost:8080/admin/uploads/banner', {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.image_url.trim()) {
      setError('Title and Image URL are required.');
      return;
    }
    setSaving(true);
    try {
      const url = editId
        ? `http://localhost:8080/admin/banners/${editId}`
        : `http://localhost:8080/admin/banners`;
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
      const res = await fetch(`http://localhost:8080/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (_) {}
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/banners/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !b.is_active }),
      });
      if (res.ok) {
        setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
      }
    } catch (_) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Homepage Banners</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage hero slides displayed on the storefront homepage.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          <Plus size={14} /> New Banner
        </button>
      </div>

      {/* Slide-in Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-serif text-base font-bold text-foreground">{editId ? 'Edit Banner' : 'Create Banner'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Image preview */}
              {form.image_url && (
                <div className="h-32 w-full rounded-lg overflow-hidden border border-border bg-zinc-900">
                  <img src={form.image_url} alt={form.alt_text || form.title || 'Preview'} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Banner Image *</label>
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
                      <Upload size={12} /> {uploading ? 'Uploading...' : 'Upload Image File'}
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="Or enter image URL manually..."
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
                  Active (show on homepage)
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
      ) : banners.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl py-20 flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 bg-card rounded-full border border-border flex items-center justify-center text-muted-foreground">
            <Image size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No banners yet</p>
            <p className="text-xs text-muted-foreground">Click "New Banner" to create your first homepage hero slide.</p>
          </div>
          <button onClick={openCreate} className="px-5 py-2 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer">
            <Plus size={12} className="inline mr-1.5" />Create First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className={`flex items-center gap-4 bg-card border rounded-xl p-4 shadow-sm transition ${
                b.is_active ? 'border-border' : 'border-border opacity-60'
              }`}
            >
              {/* Drag handle visual */}
              <GripVertical size={16} className="text-muted-foreground shrink-0 cursor-grab" />

              {/* Thumbnail */}
              <div className="h-16 w-28 rounded-md overflow-hidden border border-border bg-zinc-900 shrink-0">
                <img src={b.image_url} alt={b.alt_text || b.title} className="h-full w-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{b.title}</p>
                  {b.is_active ? (
                    <span className="text-[9px] bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">Live</span>
                  ) : (
                    <span className="text-[9px] bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-1.5 py-0.5 rounded font-semibold uppercase">Hidden</span>
                  )}
                </div>
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
              <div className="flex items-center gap-2 shrink-0">
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
