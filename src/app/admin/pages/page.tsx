'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_BASE_URL } from '@/config/api';
import {
  Layout,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Mail,
  Info,
  BookOpen,
} from 'lucide-react';
import { CMSPage } from '@/types/page-builder';
import { PAGE_TEMPLATES } from '@/components/page-builder/pageTemplates';
import { useModal } from '@/components/common/LuxuryModal';

export default function AdminPagesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const token = useSelector((state: RootState) => state.auth.token);
  const { showAlert } = useModal();

  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
  }, [search]);

  const fetchPages = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/pages${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPages(await res.json());
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [token, search]);

  const handleApplyTemplate = (tpl: any) => {
    if (!tpl) {
      setSelectedTemplateId('blank');
      return;
    }
    setSelectedTemplateId(tpl.id);
    setNewTitle(tpl.suggestedTitle || tpl.name);
    setNewSlug(tpl.suggestedSlug);
  };

  const handleQuickCreateTemplate = async (tpl: any) => {
    if (!token) return;
    // Check if a page with this slug already exists
    const existing = pages.find((p) => p.slug === tpl.suggestedSlug);
    if (existing) {
      if (confirm(`A page with slug "/${tpl.suggestedSlug}" already exists. Would you like to open it in the editor?`)) {
        router.push(`/admin/pages/${existing.id}`);
      }
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: tpl.suggestedTitle || tpl.name,
          slug: tpl.suggestedSlug,
          content: JSON.stringify(tpl.blocks),
          meta_title: tpl.suggestedTitle,
          meta_description: tpl.suggestedMetaDesc,
          is_published: true,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        router.push(`/admin/pages/${created.id}`);
      } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to create page', 'Page Creation Failed', 'error');
      }
    } catch (err) {
      console.error('Error creating page from template:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !token) return;

    setCreating(true);
    try {
      const slugVal =
        newSlug.trim() ||
        newTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-');

      const chosenTpl = PAGE_TEMPLATES.find((t) => t.id === selectedTemplateId);
      const initialBlocks = chosenTpl ? chosenTpl.blocks : [];

      const res = await fetch(`${API_BASE_URL}/admin/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: slugVal,
          content: JSON.stringify(initialBlocks),
          meta_title: chosenTpl ? chosenTpl.suggestedTitle : newTitle.trim(),
          meta_description: chosenTpl ? chosenTpl.suggestedMetaDesc : '',
          is_published: true,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setShowCreateModal(false);
        router.push(`/admin/pages/${created.id}`);
      } else {
        const err = await res.json();
        showAlert(err.message || 'Failed to create page', 'Page Creation Failed', 'error');
      }
    } catch (err) {
      console.error('Error creating page:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePage = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting page:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Dynamic Pages & Builder
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              WordPress Style
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Build and manage bespoke pages like About Us, Brand Heritage, Policy, or custom landings with drag-and-drop.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 btn-luxury rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 shadow-lg cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          Create New Page
        </button>
      </div>

      {/* 1-Click Ready Templates Banner (WordPress Style) */}
      <div className="bg-card/70 border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Ready-Made Page Templates (WordPress 1-Click Install)
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Instantly generates pre-styled, bespoke pages with luxury typography & layout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PAGE_TEMPLATES.map((tpl) => {
            const existing = pages.find((p) => p.slug === tpl.suggestedSlug);
            return (
              <div
                key={tpl.id}
                className="group relative p-4 rounded-lg border border-border/70 bg-background/50 hover:bg-card hover:border-primary/50 transition flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {tpl.badge}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">/{tpl.suggestedSlug}</span>
                  </div>
                  <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition line-clamp-1">
                    {tpl.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {tpl.blocks.length} Blocks Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickCreateTemplate(tpl)}
                    disabled={creating}
                    className="px-2.5 py-1 rounded text-[11px] font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {existing ? 'Edit Page' : '1-Click Create'}
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pages by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Pages Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Loading pages...
          </div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText size={20} />
            </div>
            <p className="text-xs font-medium text-foreground">No pages found</p>
            <p className="text-xs text-muted-foreground">Create your first drag-and-drop page to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Title & Slug</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 hidden sm:table-cell">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-accent/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-foreground text-sm font-serif">
                      {p.title}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>/{p.slug}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.is_published ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 size={11} /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock size={11} /> Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs hidden sm:table-cell">
                    {new Date(p.updated_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {p.is_published && (
                      <Link
                        href={`/${p.slug}`}
                        target="_blank"
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium transition"
                        title="View Live Storefront Page"
                      >
                        <ExternalLink size={13} />
                        <span className="hidden md:inline">View Live</span>
                      </Link>
                    )}
                    <Link
                      href={`/admin/pages/${p.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#e2285c]/10 hover:bg-[#e2285c] text-[#e2285c] hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded bg-[#e2285c] text-white flex items-center justify-center text-[10px] font-bold">E</span>
                      <span>Edit with Elementor</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(p.id, p.title)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create Page */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Create New Page</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                WordPress Customizer
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a luxury starter template to pre-populate full blocks, or start with a blank canvas.
            </p>

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-2">Choose Layout / Template</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => {
                      setSelectedTemplateId('blank');
                      setNewTitle('');
                      setNewSlug('');
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                      selectedTemplateId === 'blank'
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-border hover:border-border/80 bg-background/50'
                    }`}
                  >
                    <div className="font-semibold text-foreground flex items-center justify-between">
                      <span>Blank Canvas</span>
                      {selectedTemplateId === 'blank' && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Start with empty blocks</div>
                  </div>

                  {PAGE_TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                        selectedTemplateId === tpl.id
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border hover:border-border/80 bg-background/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground line-clamp-1">{tpl.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 bg-primary/20 text-primary rounded font-bold">
                          {tpl.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        /{tpl.suggestedSlug} • {tpl.blocks.length} blocks
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Page Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. About Us, Sizing Guide, Our Philosophy"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (selectedTemplateId === 'blank') {
                      setNewSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/[\s_-]+/g, '-')
                      );
                    }
                  }}
                  className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">URL Slug</label>
                <div className="flex items-center bg-background border border-border rounded px-3 py-2">
                  <span className="text-muted-foreground font-mono">/</span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="flex-1 bg-transparent font-mono outline-none ml-1 text-xs"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Public storefront URL: <span className="font-mono text-primary">/{newSlug || 'your-slug'}</span>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 btn-luxury rounded font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Start Customizing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
