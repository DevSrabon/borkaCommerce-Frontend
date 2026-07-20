'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Plus, Trash, Folder, Check, AlertCircle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  parent?: Category | null;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    is_active: true,
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate admin
  useEffect(() => {
    if (!token || !user) {
      router.push('/login?redirect=admin/categories');
      return;
    }
    const adminEmails = ['srabon@example.com', 'admin@example.com'];
    if (!adminEmails.includes(user.email.toLowerCase())) {
      router.push('/');
    }
  }, [token, user]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCategories(await res.json());
      } else {
        loadMockCategories();
      }
    } catch (err) {
      loadMockCategories();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  const loadMockCategories = () => {
    setCategories([
      { id: 'cat-1', name: 'Abaya', slug: 'abaya', description: 'Elegant Muslimah Abayas', parent_id: null, is_active: true },
      { id: 'cat-2', name: 'Casual', slug: 'abaya-casual', description: 'Casual abayas', parent_id: 'cat-1', is_active: true },
      { id: 'cat-3', name: 'Luxury', slug: 'abaya-luxury', description: 'Luxury abayas', parent_id: 'cat-1', is_active: true },
      { id: 'cat-4', name: 'Shayla', slug: 'shayla', description: 'Matching Scarves', parent_id: null, is_active: true },
    ]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.name === 'is_active' ? e.target.value === 'true' : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      parent_id: form.parent_id || null,
    };

    try {
      const res = await fetch('http://localhost:8080/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess('Category registered successfully!');
        setShowCreateForm(false);
        fetchCategories();
        setForm({ name: '', slug: '', description: '', parent_id: '', is_active: true });
      } else {
        const err = await res.json();
        setError(err.message || 'Creation failed');
      }
    } catch (err) {
      const newMock: Category = {
        id: `mock-${Date.now()}`,
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        parent_id: form.parent_id || null,
        is_active: form.is_active,
        parent: form.parent_id ? categories.find((c) => c.id === form.parent_id) : null,
      };
      setCategories((prev) => [...prev, newMock]);
      setSuccess('Preview inserted locally! (Backend offline)');
      setShowCreateForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchCategories();
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-xs text-muted-foreground font-light">Structure the catalogs recursively using groups.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="font-serif text-lg font-bold">New Category details</h2>
          </div>

          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Category Name</label>
              <input
                type="text"
                name="name"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                value={form.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">URL Slug</label>
              <input
                type="text"
                name="slug"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                value={form.slug}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Parent Category</label>
              <select
                name="parent_id"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none text-foreground"
                value={form.parent_id}
                onChange={handleInputChange}
              >
                <option value="">-- None (Root Level) --</option>
                {categories
                  .filter((c) => !c.parent_id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</label>
              <select
                name="is_active"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none text-foreground"
                value={form.is_active ? 'true' : 'false'}
                onChange={handleInputChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Description</label>
              <textarea
                name="description"
                rows={3}
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                value={form.description}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-border rounded text-xs hover:bg-accent cursor-pointer"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
              Register
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <section className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
        <div className="border-b border-border p-4 bg-background">
          <h2 className="font-serif text-lg font-bold">Categories Structure</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted font-light">Loading category structures...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted font-light">No categories registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Parent Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-light text-foreground">
                {categories.map((c) => {
                  const parentName = c.parent?.name || categories.find((parent) => parent.id === c.parent_id)?.name || 'Root Level';

                  return (
                    <tr key={c.id} className="hover:bg-accent/40">
                      <td className="p-4 font-medium flex items-center gap-2">
                        <Folder size={14} className="text-primary" />
                        {c.name}
                      </td>
                      <td className="p-4 font-mono text-muted">{c.slug}</td>
                      <td className="p-4 text-muted">{parentName}</td>
                      <td className="p-4 max-w-xs truncate">{c.description || '-'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                            c.is_active
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 border border-border rounded text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition cursor-pointer"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
