'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { CMSPage } from '@/types/page-builder';

export default function AdminPagesListPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

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

      const res = await fetch(`${API_BASE_URL}/admin/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: slugVal,
          content: JSON.stringify([]),
          is_published: false,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setShowCreateModal(false);
        router.push(`/admin/pages/${created.id}`);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create page');
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
                      className="px-3 py-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs inline-flex items-center gap-1 transition"
                    >
                      <Edit size={12} />
                      Open Builder
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
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold">Create New Page</h3>
            <p className="text-xs text-muted-foreground">
              Enter the page title. A clean URL slug will be automatically created.
            </p>
            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Page Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. About Us, Sizing Guide, Our Philosophy"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    setNewSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/[\s_-]+/g, '-')
                    );
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
                  className="px-5 py-2 btn-luxury rounded font-semibold uppercase tracking-wider cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Start Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
