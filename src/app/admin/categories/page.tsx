'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Plus, Trash, Folder, Check, Pencil, Save, X, Upload, Compass, Home, ToggleLeft, ToggleRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  image_alt_text: string | null;
  parent_id: string | null;
  is_active: boolean;
  show_in_navbar: boolean;
  show_on_homepage: boolean;
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
    image: '',
    image_alt_text: '',
    parent_id: '',
    is_active: true,
    show_in_navbar: true,
    show_on_homepage: false,
  });
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    image_alt_text: string;
    parent_id: string;
    is_active: boolean;
    show_in_navbar: boolean;
    show_on_homepage: boolean;
  } | null>(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);

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
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (name === 'is_active' || name === 'show_in_navbar' || name === 'show_on_homepage') {
      val = value === 'true';
    }
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleQuickToggle = async (cat: Category, field: 'show_in_navbar' | 'show_on_homepage' | 'is_active') => {
    const updatedVal = !cat[field];
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, [field]: updatedVal } : c))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: updatedVal }),
      });
      if (!res.ok) {
        // Revert on error
        fetchCategories();
      }
    } catch {
      fetchCategories();
    }
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
      const res = await fetch(`${API_BASE_URL}/admin/categories`, {
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
        setForm({
          name: '',
          slug: '',
          description: '',
          image: '',
          image_alt_text: '',
          parent_id: '',
          is_active: true,
          show_in_navbar: true,
          show_on_homepage: false,
        });
      } else {
        const err = await res.json();
        setError(err.message || 'Creation failed');
      }
    } catch (err) {
      setError('Could not connect to backend server.');
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCategoryImage(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/uploads/category`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (mode === 'create') setForm((prev) => ({ ...prev, image: data.imageUrl }));
        else setEditingCategory((prev) => prev ? { ...prev, image: data.imageUrl } : prev);
      } else {
        const err = await res.json();
        setError(err.message || 'Image upload failed');
      }
    } catch {
      setError('Image upload failed');
    } finally {
      setUploadingCategoryImage(false);
      e.target.value = '';
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      image_alt_text: category.image_alt_text || '',
      parent_id: category.parent_id || '',
      is_active: category.is_active,
      show_in_navbar: category.show_in_navbar ?? true,
      show_on_homepage: category.show_on_homepage ?? false,
    });
    setError('');
    setSuccess('');
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingCategory.name,
          slug: editingCategory.slug,
          description: editingCategory.description,
          image: editingCategory.image || null,
          image_alt_text: editingCategory.image_alt_text || null,
          parent_id: editingCategory.parent_id || null,
          is_active: editingCategory.is_active,
          show_in_navbar: editingCategory.show_in_navbar,
          show_on_homepage: editingCategory.show_on_homepage,
        }),
      });
      if (res.ok) {
        setEditingCategory(null);
        setSuccess('Category updated successfully!');
        fetchCategories();
      } else {
        const err = await res.json();
        setError(Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Update failed'));
      }
    } catch {
      setError('Could not reach the backend server.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-8 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Category Management</h1>
          <p className="text-xs text-muted-foreground font-light mt-1">
            Manage product categories, customize Navbar category buttons, and curate the Homepage &quot;Shop by Category&quot; showcase.
          </p>
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
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="font-serif text-lg font-bold">Register New Category</h2>
          </div>

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
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none font-mono"
                value={form.slug}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Parent Category</label>
              <select
                name="parent_id"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                value={form.parent_id}
                onChange={handleInputChange}
              >
                <option value="">Root Level Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Status</label>
              <select
                name="is_active"
                className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                value={form.is_active ? 'true' : 'false'}
                onChange={handleInputChange}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Display Placement Options */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-accent/20 p-4 rounded-lg border border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="show_in_navbar"
                  checked={form.show_in_navbar}
                  onChange={handleInputChange}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div>
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Compass size={14} className="text-primary" /> Show in Navbar Navigation
                  </span>
                  <p className="text-[11px] text-muted-foreground">Display this category as a direct button in the top navigation bar.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="show_on_homepage"
                  checked={form.show_on_homepage}
                  onChange={handleInputChange}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div>
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Home size={14} className="text-amber-500" /> Show in Homepage &quot;Shop by Category&quot;
                  </span>
                  <p className="text-[11px] text-muted-foreground">Highlight this category in the homepage visual category grid.</p>
                </div>
              </label>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Category Banner / Image</label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCategoryImageUpload(e, 'create')}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                  <button type="button" className="px-3 py-2 border border-border rounded text-xs hover:bg-accent flex items-center gap-1.5 cursor-pointer">
                    <Upload size={12} /> {uploadingCategoryImage ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
                <input
                  type="url"
                  name="image"
                  placeholder="Or enter direct image URL"
                  className="flex-1 text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
                  value={form.image}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Description</label>
              <textarea
                name="description"
                rows={2}
                className="w-full text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none"
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
              Register Category
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-border p-4 bg-background flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold">Categories Structure &amp; Placements</h2>
          <span className="text-xs text-muted-foreground">Click switches to toggle Navbar or Homepage visibility live</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted font-light animate-pulse">Loading category structures...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted font-light">No categories registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                  <th className="p-4">Category</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Parent</th>
                  <th className="p-4 text-center">Navbar Button</th>
                  <th className="p-4 text-center">Shop by Category (Home)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-light text-foreground">
                {categories.map((c) => {
                  const parentName = c.parent?.name || categories.find((parent) => parent.id === c.parent_id)?.name || 'Root Level';

                  return (
                    <React.Fragment key={c.id}>
                    <tr className="hover:bg-accent/40 transition">
                      <td className="p-4 font-medium flex items-center gap-3">
                        {c.image ? (
                          <img src={c.image} alt={c.name} className="w-8 h-8 rounded-md object-cover border border-border" />
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-primary">
                            <Folder size={14} />
                          </div>
                        )}
                        <div>
                          <span className="font-semibold">{c.name}</span>
                          {c.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{c.description}</p>}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-muted-foreground">{c.slug}</td>
                      <td className="p-4 text-muted-foreground">{parentName}</td>

                      {/* Navbar toggle button */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(c, 'show_in_navbar')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition ${
                            c.show_in_navbar !== false
                              ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                              : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/60'
                          }`}
                          title="Click to toggle Navbar visibility"
                        >
                          <Compass size={11} />
                          {c.show_in_navbar !== false ? 'Shown in Navbar' : 'Hidden'}
                        </button>
                      </td>

                      {/* Homepage Shop by Category toggle button */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(c, 'show_on_homepage')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition ${
                            c.show_on_homepage
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                              : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/60'
                          }`}
                          title="Click to toggle Homepage Shop by Category section"
                        >
                          <Home size={11} />
                          {c.show_on_homepage ? 'Shown on Home' : 'Hidden'}
                        </button>
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleQuickToggle(c, 'is_active')}
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] border cursor-pointer transition ${
                            c.is_active
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleEdit(c)}
                          className="mr-2 p-1.5 border border-border rounded text-primary hover:bg-primary/10 hover:border-primary/20 transition cursor-pointer"
                          title="Edit category"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 border border-border rounded text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition cursor-pointer"
                          title="Delete category"
                        >
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>

                    {/* Inline edit panel */}
                    {editingCategory?.id === c.id && (
                      <tr>
                        <td colSpan={7} className="p-5 bg-background border-t border-b border-primary/20">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">Category Name</label>
                              <input
                                type="text"
                                className="w-full text-xs bg-card border border-border rounded px-3 py-2 mt-1 focus:outline-none"
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">Slug</label>
                              <input
                                type="text"
                                className="w-full text-xs bg-card border border-border rounded px-3 py-2 mt-1 focus:outline-none font-mono"
                                value={editingCategory.slug}
                                onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">Parent Category</label>
                              <select
                                className="w-full text-xs bg-card border border-border rounded px-3 py-2 mt-1 focus:outline-none text-foreground"
                                value={editingCategory.parent_id}
                                onChange={(e) => setEditingCategory({ ...editingCategory, parent_id: e.target.value })}
                              >
                                <option value="">Root Level</option>
                                {categories
                                  .filter((parent) => parent.id !== editingCategory.id)
                                  .map((parent) => (
                                    <option key={parent.id} value={parent.id}>{parent.name}</option>
                                  ))}
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">Image URL</label>
                              <div className="flex gap-2 mt-1">
                                <input
                                  type="url"
                                  className="flex-1 text-xs bg-card border border-border rounded px-3 py-2 focus:outline-none"
                                  value={editingCategory.image}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                                />
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleCategoryImageUpload(e, 'edit')}
                                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                                  />
                                  <button type="button" className="px-3 py-2 border border-border rounded text-xs hover:bg-accent flex items-center gap-1.5 cursor-pointer">
                                    <Upload size={12} /> {uploadingCategoryImage ? 'Uploading...' : 'Upload'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">Status</label>
                              <select
                                className="w-full text-xs bg-card border border-border rounded px-3 py-2 mt-1 focus:outline-none text-foreground"
                                value={editingCategory.is_active ? 'true' : 'false'}
                                onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.value === 'true' })}
                              >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                              </select>
                            </div>

                            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-accent/20 p-3 rounded-lg border border-border">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingCategory.show_in_navbar}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, show_in_navbar: e.target.checked })}
                                  className="rounded text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="text-xs font-semibold">Show in Navbar Buttons</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingCategory.show_on_homepage}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, show_on_homepage: e.target.checked })}
                                  className="rounded text-primary focus:ring-primary h-4 w-4"
                                />
                                <span className="text-xs font-semibold">Show in Homepage &quot;Shop by Category&quot;</span>
                              </label>
                            </div>

                            <div className="md:col-span-3">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">Description</label>
                              <textarea
                                className="w-full text-xs bg-card border border-border rounded px-3 py-2 mt-1 focus:outline-none"
                                rows={2}
                                value={editingCategory.description}
                                onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                              />
                            </div>

                            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                              <button type="button" onClick={() => setEditingCategory(null)} className="px-3 py-1.5 border border-border rounded text-xs hover:bg-accent flex items-center gap-1 cursor-pointer">
                                <X size={12} /> Cancel
                              </button>
                              <button type="button" onClick={handleUpdate} className="px-4 py-1.5 btn-luxury rounded text-xs font-semibold flex items-center gap-1 cursor-pointer">
                                <Save size={12} /> Save Changes
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
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
