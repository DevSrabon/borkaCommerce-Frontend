'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Save, Globe, Search, Image, RefreshCw, CheckCircle2, Upload } from 'lucide-react';

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
];

export default function SiteSettingsPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/ecommerce/site-settings');
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
      const res = await fetch('http://localhost:8080/admin/products/upload', {
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
      const res = await fetch('http://localhost:8080/admin/site-settings', {
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

  return (
    <div className="space-y-6 max-w-3xl text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Site Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage SEO, branding, logo and favicon from one place.</p>
        </div>
        <button
          onClick={fetchSettings}
          className="p-2 border border-border rounded-md hover:bg-accent transition cursor-pointer text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

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
                        {(key === 'logo_url' || key === 'og_image_url' || key === 'favicon_url') && (
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
                    {(key === 'logo_url' || key === 'og_image_url' || key === 'favicon_url') && settings[key] && (
                      <img
                        src={settings[key]}
                        alt={`${label} preview`}
                        className="mt-1 max-h-12 rounded border border-border object-contain bg-zinc-900 p-1"
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
