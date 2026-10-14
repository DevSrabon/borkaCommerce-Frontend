'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Link from 'next/link';
import {
  BookOpen,
  MessageSquare,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Calendar,
  Upload,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface BlogAdminItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  views: number;
  is_published: boolean;
  published_at: string;
  created_at: string;
  featured_image?: string;
  main_image?: string;
  total_comments?: number;
}

interface CategoryAdminItem {
  name: string;
  count: number;
}

interface CommentAdminItem {
  id: string;
  blog_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  blog?: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function AdminBlogsPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [activeTab, setActiveTab] = useState<'blogs' | 'categories' | 'comments'>('blogs');

  // Categories state
  const [categoryItems, setCategoryItems] = useState<CategoryAdminItem[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [updatingCategory, setUpdatingCategory] = useState(false);

  // Blogs state
  const [blogs, setBlogs] = useState<BlogAdminItem[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [blogSearch, setBlogSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Comments state
  const [comments, setComments] = useState<CommentAdminItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentFilter, setCommentFilter] = useState<string>('ALL');

  // Modals & form state
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Abaya',
    excerpt: '',
    content: '',
    featured_image: '',
    main_image: '',
    is_published: true,
  });
  const [savingBlog, setSavingBlog] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'featured_image' | 'main_image') => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (field === 'featured_image') setUploadingFeatured(true);
    else setUploadingMain(true);

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/admin/media/upload?folder=blog`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, [field]: data.imageUrl }));
        showNotification('success', `${field === 'featured_image' ? 'Featured image' : 'Main image'} uploaded successfully!`);
      } else {
        showNotification('error', 'Failed to upload image');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      showNotification('error', 'Error uploading image');
    } finally {
      if (field === 'featured_image') setUploadingFeatured(false);
      else setUploadingMain(false);
    }
  };

  // Fetch dynamic categories with stats
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (data.length > 0 && typeof data[0] === 'string') {
            setCategoryItems(data.map((c: string) => ({ name: c, count: 0 })));
            setCategories(data);
          } else {
            setCategoryItems(data);
            setCategories(data.map((d: any) => d.name));
          }
        }
      } else {
        const pubRes = await fetch(`${API_BASE_URL}/blogs/categories`);
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          if (Array.isArray(pubData)) {
            setCategoryItems(pubData.map((c: string) => ({ name: c, count: 0 })));
            setCategories(pubData);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showNotification('error', 'Please enter a category name');
      return;
    }
    setAddingCategory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to add category');
      }
      showNotification('success', `Category "${trimmed}" added successfully!`);
      setNewCategoryName('');
      await fetchCategories();
      await fetchBlogs();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (oldName: string, newName: string) => {
    if (!token) return;
    const trimmedNew = newName.trim();
    if (!trimmedNew) {
      showNotification('error', 'Category name cannot be empty');
      return;
    }
    if (oldName.toLowerCase() === trimmedNew.toLowerCase()) {
      setEditingCategory(null);
      return;
    }
    setUpdatingCategory(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/categories`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldName, newName: trimmedNew }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update category');
      }
      showNotification('success', `Category renamed to "${trimmedNew}". All matching articles updated!`);
      setEditingCategory(null);
      await fetchCategories();
      await fetchBlogs();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update category');
    } finally {
      setUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async (name: string, count: number) => {
    if (!token) return;
    const confirmMsg =
      count > 0
        ? `Category "${name}" currently has ${count} articles assigned. Are you sure you want to delete this category?`
        : `Are you sure you want to delete category "${name}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete category');
      }
      showNotification('success', `Category "${name}" deleted successfully!`);
      await fetchCategories();
      await fetchBlogs();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete category');
    }
  };

  // Fetch blogs
  const fetchBlogs = async () => {
    if (!token) return;
    setLoadingBlogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setBlogs(await res.json());
      }
    } catch (err) {
      console.error('Failed to load blogs:', err);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Fetch comments
  const fetchComments = async (status?: string) => {
    if (!token) return;
    setLoadingComments(true);
    try {
      const query = status && status !== 'ALL' ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/blogs/comments/all${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchComments();
    fetchCategories();
  }, [token]);

  // Comment Moderation Actions
  const handleUpdateCommentStatus = async (commentId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/comments/${commentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      showNotification('success', `Comment marked as ${newStatus}`);
      fetchComments(commentFilter);
    } catch (err: any) {
      showNotification('error', err.message || 'Action failed');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token || !confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      showNotification('success', 'Comment deleted successfully');
      fetchComments(commentFilter);
    } catch (err: any) {
      showNotification('error', err.message || 'Action failed');
    }
  };

  // Blog Management Actions
  const handleOpenCreateModal = () => {
    setEditingBlogId(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setFormData({
      title: '',
      slug: '',
      category: categories[0] || 'Abaya',
      excerpt: '',
      content: '',
      featured_image: '',
      main_image: '',
      is_published: true,
    });
    setShowBlogModal(true);
  };

  const handleOpenEditModal = async (blog: BlogAdminItem) => {
    setEditingBlogId(blog.id);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/${blog.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const cat = data.category || 'Abaya';
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          category: cat,
          excerpt: data.excerpt || '',
          content: data.content || '',
          featured_image: data.featured_image || '',
          main_image: data.main_image || '',
          is_published: data.is_published ?? true,
        });
        if (!categories.includes(cat)) {
          setCategories((prev) => [...prev, cat]);
        }
        setShowBlogModal(true);
      }
    } catch {
      showNotification('error', 'Failed to load blog details');
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingBlog(true);

    const resolvedCategory = isCustomCategory && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : (formData.category || 'Abaya');

    const payload = {
      ...formData,
      category: resolvedCategory,
    };

    try {
      const url = editingBlogId
        ? `${API_BASE_URL}/admin/blogs/${editingBlogId}`
        : `${API_BASE_URL}/admin/blogs`;

      const method = editingBlogId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save blog');
      }

      // If a new custom category was used, persist it
      if (isCustomCategory && customCategoryInput.trim()) {
        fetch(`${API_BASE_URL}/admin/blogs/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: customCategoryInput.trim() }),
        }).then(() => fetchCategories()).catch(() => {});
      }

      showNotification('success', editingBlogId ? 'Blog post updated' : 'Blog post published');
      setShowBlogModal(false);
      fetchBlogs();
      fetchCategories();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save blog');
    } finally {
      setSavingBlog(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this article?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete blog');
      showNotification('success', 'Article deleted');
      fetchBlogs();
    } catch (err: any) {
      showNotification('error', err.message || 'Action failed');
    }
  };

  const pendingCommentsCount = comments.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <BookOpen className="text-primary" size={24} /> Blog &amp; Comment Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publish modest fashion articles and moderate visitor comments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-lg transition cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'border-border bg-card hover:bg-accent text-foreground'
            }`}
          >
            <Tag size={14} /> Manage Categories
          </button>
          <Link
            href="/blogs"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg bg-card hover:bg-accent text-foreground transition"
          >
            <ExternalLink size={14} /> View Blog Storefront
          </Link>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs shadow-sm transition cursor-pointer"
          >
            <Plus size={15} /> Write New Article
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-border text-xs font-semibold gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('blogs')}
          className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'blogs'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen size={15} />
          <span>Articles ({blogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`pb-3 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag size={15} />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`pb-3 transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'comments'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare size={15} />
          <span>Comment Moderation</span>
          {pendingCommentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 text-xs font-bold">
              {pendingCommentsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: BLOG ARTICLES LIST                          */}
      {/* ==================================================== */}
      {activeTab === 'blogs' && (
        <div className="space-y-4">
          {/* Search bar and category filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles by title or slug..."
                value={blogSearch}
                onChange={(e) => setBlogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Categories ({blogs.length})</option>
              {categories.map((c) => {
                const count = blogs.filter((b) => b.category?.toLowerCase() === c.toLowerCase()).length;
                return (
                  <option key={c} value={c}>
                    {c} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>

            <button
              onClick={() => {
                fetchBlogs();
                fetchCategories();
              }}
              className="p-2 border border-border rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Blogs Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Article</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Views</th>
                    <th className="py-3 px-4">Comments</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Published Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingBlogs ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading articles...
                      </td>
                    </tr>
                  ) : blogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No articles found. Click &quot;Write New Article&quot; to publish one.
                      </td>
                    </tr>
                  ) : (
                    blogs
                      .filter((b) => {
                        const q = blogSearch.toLowerCase();
                        const matchesSearch = b.title.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q);
                        const matchesCat = categoryFilter === 'ALL' || b.category.toLowerCase() === categoryFilter.toLowerCase();
                        return matchesSearch && matchesCat;
                      })
                      .map((blog) => (
                        <tr key={blog.id} className="hover:bg-muted/20 transition">
                          <td className="py-3.5 px-4 font-medium text-foreground max-w-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-muted border border-border shrink-0">
                                {blog.featured_image || blog.main_image ? (
                                  <img
                                    src={blog.featured_image || blog.main_image}
                                    alt={blog.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-semibold">
                                    Blog
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="line-clamp-1 font-semibold">{blog.title}</div>
                                <div className="text-xs text-muted-foreground font-mono truncate">/{blog.slug}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {blog.featured_image && (
                                    <span className="text-xs text-primary font-medium">★ Featured Img</span>
                                  )}
                                  {blog.main_image && (
                                    <span className="text-xs text-blue-500 font-medium">🖼 Main Img</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold rounded-full text-xs border border-amber-500/20 inline-block shadow-2xs">
                              {blog.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground flex items-center gap-1 pt-4">
                            <Eye size={12} /> {blog.views}
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {blog.total_comments || 0}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                blog.is_published
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                              }`}
                            >
                              {blog.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground text-xs">
                            {new Date(blog.published_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <Link
                              href={`/blogs/${blog.slug}`}
                              target="_blank"
                              className="p-1.5 text-muted-foreground hover:text-primary transition inline-block"
                              title="View Post"
                            >
                              <ExternalLink size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(blog)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlog(blog.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: BLOG CATEGORIES MANAGEMENT                   */}
      {/* ==================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Add Category Card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
              <Plus className="text-primary" size={16} /> Add New Blog Category
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Add a new dynamic category for your blogs. It will instantly be selectable when writing articles and displayed on the storefront category tabs.
            </p>
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter category name (e.g. Modest Hijab Styles, Bridal Couture)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={addingCategory || !newCategoryName.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {addingCategory ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Add Category
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Categories List Card */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tag className="text-primary" size={16} /> Dynamic Blog Categories ({categoryItems.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update/rename existing category names. Renaming a category automatically updates all associated articles!
                </p>
              </div>

              {/* Filter Categories Search */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Category Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Category Name</th>
                    <th className="py-3 px-4 text-center">Linked Articles</th>
                    <th className="py-3 px-4 text-right sm:pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categoryItems
                    .filter((cat) =>
                      cat.name.toLowerCase().includes(categorySearch.toLowerCase().trim()),
                    )
                    .map((cat) => {
                      const isEditing = editingCategory?.oldName === cat.name;
                      return (
                        <tr key={cat.name} className="hover:bg-muted/10 transition">
                          <td className="py-3.5 px-4 sm:px-6 font-medium text-foreground">
                            {isEditing ? (
                              <div className="flex items-center gap-2 max-w-sm">
                                <input
                                  type="text"
                                  value={editingCategory.newName}
                                  onChange={(e) =>
                                    setEditingCategory({ ...editingCategory, newName: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs bg-background border border-primary rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleUpdateCategory(editingCategory.oldName, editingCategory.newName);
                                    } else if (e.key === 'Escape') {
                                      setEditingCategory(null);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                                  <Tag size={13} />
                                </span>
                                <span className="font-semibold text-sm">{cat.name}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter(cat.name);
                                setActiveTab('blogs');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground transition cursor-pointer"
                              title="Click to view articles in this category"
                            >
                              <span>
                                {cat.count} {cat.count === 1 ? 'Article' : 'Articles'}
                              </span>
                              <ExternalLink size={10} />
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right sm:pr-6">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={updatingCategory}
                                  onClick={() =>
                                    handleUpdateCategory(editingCategory.oldName, editingCategory.newName)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                  {updatingCategory ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategory(null)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-card border border-border hover:bg-muted text-muted-foreground rounded text-xs transition cursor-pointer"
                                >
                                  <X size={12} />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingCategory({ oldName: cat.name, newName: cat.name })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-foreground hover:text-primary hover:bg-primary/10 rounded text-xs font-medium transition cursor-pointer"
                                  title="Edit category name"
                                >
                                  <Edit size={13} />
                                  <span>Edit Name</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat.name, cat.count)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded text-xs font-medium transition cursor-pointer"
                                  title="Delete category"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: COMMENT MODERATION                          */}
      {/* ==================================================== */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setCommentFilter(st);
                  fetchComments(st);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  commentFilter === st
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Comments List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs divide-y divide-border">
            {loadingComments ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <MessageSquare className="mx-auto text-muted-foreground/50" size={28} />
                <p>No comments found in &quot;{commentFilter}&quot;.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-muted/10 transition">
                  {/* Left: Comment details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{comment.author_name}</span>
                      <span className="text-xs text-muted-foreground font-mono">({comment.author_email})</span>
                      <span className="text-xs text-muted-foreground">• {new Date(comment.created_at).toLocaleString()}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ml-1 ${
                          comment.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : comment.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}
                      >
                        {comment.status}
                      </span>
                    </div>

                    {comment.blog && (
                      <div className="text-xs text-primary font-semibold flex items-center gap-1">
                        <span>On Article:</span>
                        <Link href={`/blogs/${comment.blog.slug}`} target="_blank" className="hover:underline flex items-center gap-0.5">
                          {comment.blog.title} <ExternalLink size={10} />
                        </Link>
                      </div>
                    )}

                    <p className="text-xs text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border/60 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>

                  {/* Right: Moderation Actions (Approve, Reject, Delete) */}
                  <div className="flex sm:flex-col items-center gap-1.5 shrink-0">
                    {comment.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCommentStatus(comment.id, 'APPROVED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition cursor-pointer shadow-xs"
                        title="Approve Comment"
                      >
                        <Check size={13} />
                        <span>Approve</span>
                      </button>
                    )}

                    {comment.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateCommentStatus(comment.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-600 border border-amber-500/30 rounded text-xs font-semibold transition cursor-pointer"
                        title="Reject Comment"
                      >
                        <X size={13} />
                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded text-xs transition cursor-pointer"
                      title="Delete Comment"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* WRITE / EDIT ARTICLE MODAL                          */}
      {/* ==================================================== */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-foreground">
                {editingBlogId ? 'Edit Article' : 'Write New Article'}
              </h2>
              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveBlog} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Title */}
              <div>
                <label className="block font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Best Abaya Shop in Dubai: 7 Magnificent Reasons"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Slug & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Slug (URL path)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-generate"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold">Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isCustomCategory;
                        setIsCustomCategory(next);
                        if (!next && categories.length > 0) {
                          setFormData({ ...formData, category: categories[0] });
                        }
                      }}
                      className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                      {isCustomCategory ? 'Choose Existing' : '+ Add New'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <input
                      type="text"
                      placeholder="Type new category name..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCustomCategory(true);
                          setCustomCategoryInput('');
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      {!categories.includes(formData.category) && formData.category && (
                        <option value={formData.category}>{formData.category}</option>
                      )}
                      <option value="__NEW__">+ Add New Category...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Image Uploads: Featured Image & Main Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/10 p-3.5 rounded-xl border border-border">
                {/* 1. Featured Image */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-foreground">
                      ★ Featured Image
                    </label>
                    <span className="text-xs text-muted-foreground">Grid Card (800×600)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Thumbnail for blog cards, category lists, and social shares.
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Image URL or upload..."
                      value={formData.featured_image}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg border border-border cursor-pointer transition text-xs font-medium whitespace-nowrap shadow-xs">
                      <Upload size={13} />
                      <span>{uploadingFeatured ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'featured_image')}
                        disabled={uploadingFeatured}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.featured_image && (
                    <div className="flex items-center gap-2 p-1.5 bg-background border border-border rounded-lg mt-1.5">
                      <img
                        src={formData.featured_image}
                        alt="Featured Preview"
                        className="h-12 w-16 object-cover rounded border border-border"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, featured_image: '' })}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Main Image */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-foreground">
                      🖼 Main Article Image
                    </label>
                    <span className="text-xs text-muted-foreground">Header Banner (1200×600)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Large hero cover banner at the top of the full article view.
                  </p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Image URL or upload..."
                      value={formData.main_image}
                      onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                    <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg border border-border cursor-pointer transition text-xs font-medium whitespace-nowrap shadow-xs">
                      <Upload size={13} />
                      <span>{uploadingMain ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'main_image')}
                        disabled={uploadingMain}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.main_image && (
                    <div className="flex items-center gap-2 p-1.5 bg-background border border-border rounded-lg mt-1.5">
                      <img
                        src={formData.main_image}
                        alt="Main Preview"
                        className="h-12 w-20 object-cover rounded border border-border"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, main_image: '' })}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block font-semibold mb-1">Short Excerpt (Introductory Summary)</label>
                <textarea
                  rows={2}
                  placeholder="A concise summary of the article..."
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Article Content with RichTextEditor */}
              <div>
                <label className="block font-semibold mb-1">Article Content *</label>
                <div className="border border-border rounded-xl overflow-hidden">
                  <RichTextEditor
                    value={formData.content}
                    onChange={(val) => setFormData((prev) => ({ ...prev, content: val }))}
                    placeholder="Write the full body of the article here. Use bold, headings, images, lists..."
                    minHeight={320}
                  />
                </div>
              </div>

              {/* Publish Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="is_published" className="font-medium text-foreground cursor-pointer">
                  Publish this article immediately on the storefront
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBlog}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {savingBlog ? 'Saving...' : editingBlogId ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
