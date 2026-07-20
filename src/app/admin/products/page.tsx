'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
  Plus, Trash, Tag, PlusCircle, Check, Edit2, Upload,
  Eye, EyeOff, X, Pencil, Save,
} from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';

// ─── Types ─────────────────────────────────────────────────────────────────

interface ProductImage {
  id?: string;
  image_url: string;
  alt_text?: string;
  is_thumbnail: boolean;
}

interface VariantImage {
  image_url: string;
  alt_text?: string;
}

interface Attribute {
  name: string;
  value: string;
}

interface Variant {
  id?: string;
  sku: string;
  price: number;
  compare_price: number | null;
  initial_quantity: number;
  attributes: Attribute[];
  images?: VariantImage[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  children?: Category[];
}

interface APIProduct {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  variants: { price: number; inventories: { quantity: number }[] }[];
}

interface DbAttribute {
  id: string;
  name: string;
  values: { id: string; value: string }[];
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminProductsPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [products, setProducts] = useState<APIProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dbAttributes, setDbAttributes] = useState<DbAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  // Active admin tab
  const [adminTab, setAdminTab] = useState<'products' | 'attributes' | 'categories'>('products');

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const emptyForm = {
    name: '',
    slug: '',
    description: '',
    short_description: '',
    sku_prefix: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    category_ids: [] as string[],
    status: 'DRAFT',
  };

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([
    {
      sku: '', price: 250, compare_price: 300, initial_quantity: 50,
      attributes: [
        { name: 'Color', value: 'Black' },
        { name: 'Size', value: '54' },
        { name: 'Fabric', value: 'Nidha' },
      ],
      images: [],
    },
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  // Attribute management state
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValueMap, setNewAttrValueMap] = useState<Record<string, string>>({});
  const [editingAttr, setEditingAttr] = useState<{ id: string; name: string } | null>(null);
  const [editingAttrValue, setEditingAttrValue] = useState<{ id: string; value: string } | null>(null);

  // Category management state
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; slug: string; parent_id: string } | null>(null);

  // ─── Auth Guard ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token || !user) {
      router.push('/login?redirect=admin/products');
      return;
    }
    const adminEmails = ['srabon@example.com', 'admin@example.com'];
    if (!adminEmails.includes((user as any).email?.toLowerCase())) {
      router.push('/');
    }
  }, [token, user]);

  // ─── Fetch Catalog ────────────────────────────────────────────────────────

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, attrRes] = await Promise.all([
        fetch('http://localhost:8080/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/ecommerce/categories/tree'),
        fetch('http://localhost:8080/admin/attributes', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (prodRes.ok) setProducts(await prodRes.json()); else loadMockCatalog();
      if (catRes.ok) setCategories(flattenCategories(await catRes.json()));
      else setCategories([{ id: 'cat-1', name: 'Abaya', slug: 'abaya' }, { id: 'cat-2', name: 'Shayla', slug: 'shayla' }]);
      if (attrRes.ok) setDbAttributes(await attrRes.json());
      else setDbAttributes([
        { id: 'a1', name: 'Color', values: [{ id: 'v1', value: 'Black' }, { id: 'v2', value: 'Navy Blue' }] },
        { id: 'a2', name: 'Size', values: [{ id: 'v3', value: '54' }, { id: 'v4', value: '56' }] },
        { id: 'a3', name: 'Fabric', values: [{ id: 'v5', value: 'Nidha' }, { id: 'v6', value: 'Crepe' }] },
      ]);
    } catch {
      loadMockCatalog();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchCatalog(); }, [token, fetchCatalog]);

  const loadMockCatalog = () => {
    setProducts([{
      id: 'mock-1', name: 'Classic Black Abaya', slug: 'classic-black-abaya',
      status: 'PUBLISHED', created_at: new Date().toISOString(),
      variants: [{ price: 250, inventories: [{ quantity: 85 }] }],
    }]);
  };

  // ─── Form Handlers ────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDescriptionChange = (html: string) => setForm(prev => ({ ...prev, description: html }));

  const handleCategoryCheckbox = (catId: string) => {
    setForm(prev => {
      const exists = prev.category_ids.includes(catId);
      return { ...prev, category_ids: exists ? prev.category_ids.filter(id => id !== catId) : [...prev.category_ids, catId] };
    });
  };

  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev,
      {
        sku: `${form.sku_prefix ? `${form.sku_prefix}-` : ''}${variants.length + 1}`,
        price: 250, compare_price: 300, initial_quantity: 20,
        attributes: [{ name: 'Color', value: 'Black' }, { name: 'Size', value: '56' }, { name: 'Fabric', value: 'Nidha' }],
        images: [],
      },
    ]);
  };

  const handleVariantChange = (idx: number, field: keyof Variant, val: any) => {
    setVariants(prev => prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v)));
  };

  const handleVariantAttributeChange = (varIdx: number, attrIdx: number, val: string) => {
    setVariants(prev =>
      prev.map((v, i) => {
        if (i !== varIdx) return v;
        return { ...v, attributes: v.attributes.map((a, j) => (j === attrIdx ? { ...a, value: val } : a)) };
      })
    );
  };

  // ─── Image Upload ─────────────────────────────────────────────────────────

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    const uploadedImages: ProductImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        const res = await fetch('http://localhost:8080/admin/products/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedImages.push({ image_url: data.imageUrl, alt_text: '', is_thumbnail: false });
        }
      }
      if (uploadedImages.length > 0) {
        setImages(prev => {
          const hasThumbnail = prev.some(img => img.is_thumbnail);
          return [
            ...prev,
            ...uploadedImages.map((img, idx) => ({ ...img, is_thumbnail: !hasThumbnail && idx === 0 })),
          ];
        });
        setSuccess(`Uploaded ${uploadedImages.length} image(s)`);
      } else {
        setError('No files uploaded — backend may be offline');
      }
    } catch {
      setError('Image upload failed — backend may be offline');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVariantImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>, varIdx: number) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploadedImages: VariantImage[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('image', files[i]);
        const res = await fetch('http://localhost:8080/admin/uploads/product', {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (res.ok) { const data = await res.json(); uploadedImages.push({ image_url: data.imageUrl, alt_text: '' }); }
      }
      if (uploadedImages.length > 0) {
        setVariants(prev => prev.map((v, i) => i === varIdx ? { ...v, images: [...(v.images || []), ...uploadedImages] } : v));
      }
    } catch {
      setError('Variant image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ─── Product Submit ───────────────────────────────────────────────────────

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.category_ids.length === 0) { setError('Please select at least one category.'); return; }
    if (images.length === 0) { setError('At least one product image is required.'); return; }

    const payload = {
      ...form,
      images,
      variants: variants.map(v => ({
        ...v,
        price: Number(v.price),
        compare_price: v.compare_price ? Number(v.compare_price) : null,
        initial_quantity: Number(v.initial_quantity),
      })),
    };

    try {
      const res = await fetch('http://localhost:8080/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess('Product created successfully!');
        setShowCreateForm(false);
        resetForm();
        fetchCatalog();
      } else {
        const err = await res.json();
        setError(Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Creation failed'));
      }
    } catch {
      setError('Could not reach the backend server.');
    }
  };

  const handleEditClick = async (p: any) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`http://localhost:8080/admin/products/${p.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const fullProd = await res.json();
        setEditingProduct(fullProd);
        setForm({
          name: fullProd.name,
          slug: fullProd.slug,
          description: fullProd.description || '',
          short_description: fullProd.short_description || '',
          sku_prefix: fullProd.sku_prefix || '',
          seo_title: fullProd.seo_title || '',
          seo_description: fullProd.seo_description || '',
          seo_keywords: fullProd.seo_keywords || '',
          category_ids: fullProd.product_categories?.map((pc: any) => pc.category_id) || [],
          status: fullProd.status,
        });
        setImages(fullProd.images?.map((img: any) => ({ id: img.id, image_url: img.image_url, alt_text: img.alt_text || '', is_thumbnail: img.is_thumbnail })) || []);
        setVariants(fullProd.variants?.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          compare_price: v.compare_price ? Number(v.compare_price) : null,
          initial_quantity: v.inventories?.reduce((acc: number, inv: any) => acc + (inv.quantity || 0), 0) || 0,
          attributes: v.attributes?.map((a: any) => ({
            name: a.attribute_value?.attribute?.name || a.name || '',
            value: a.attribute_value?.value || a.value || '',
          })) || [],
          images: v.images?.map((img: any) => ({ image_url: img.image, alt_text: img.alt_text || '' })) || [],
        })) || []);
        setShowEditForm(true);
        setShowCreateForm(false);
      } else {
        const body = await res.json().catch(() => null);
        const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
        setError(message || `Could not load product details (HTTP ${res.status}).`);
      }
    } catch {
      setError('Could not load product details');
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!editingProduct) return;
    if (images.length === 0) { setError('At least one product image is required.'); return; }

    const payload = {
      ...form,
      images,
      variants: variants.map(v => ({
        ...v, price: Number(v.price),
        compare_price: v.compare_price ? Number(v.compare_price) : null,
        initial_quantity: Number(v.initial_quantity),
      })),
    };

    try {
      const res = await fetch(`http://localhost:8080/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess('Product updated successfully!');
        setShowEditForm(false);
        setEditingProduct(null);
        fetchCatalog();
      } else {
        const err = await res.json();
        setError(Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Update failed'));
      }
    } catch {
      setError('Could not reach the backend server.');
    }
  };

  const handleTogglePublish = async (pId: string, currentStatus: string) => {
    setError(''); setSuccess('');
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await fetch(`http://localhost:8080/admin/products/${pId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { setSuccess(`Product ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}.`); fetchCatalog(); }
      else { const err = await res.json(); setError(err.message || 'Action failed'); }
    } catch {
      setProducts(prev => prev.map(item => item.id === pId ? { ...item, status: newStatus } : item));
    }
  };

  const handleArchiveProduct = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/products/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCatalog();
      else setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImages([]);
    setVariants([{
      sku: '', price: 250, compare_price: 300, initial_quantity: 50,
      attributes: [{ name: 'Color', value: 'Black' }, { name: 'Size', value: '54' }, { name: 'Fabric', value: 'Nidha' }],
      images: [],
    }]);
  };

  const flattenCategories = (items: Category[]): Category[] =>
    items.flatMap((category) => [
      category,
      ...flattenCategories(category.children || []),
    ]);

  const handleRemoveImage = async (image: ProductImage, index: number) => {
    if (images.length <= 1) {
      setError('At least one product image is required.');
      return;
    }

    // Persisted images are removed immediately so the database and filesystem
    // stay in sync. Newly uploaded images are handled by the next form submit.
    if (editingProduct && image.id) {
      try {
        const response = await fetch(
          `http://localhost:8080/admin/products/${editingProduct.id}/images/${image.id}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) {
          const body = await response.json();
          setError(body.message || 'Unable to remove image');
          return;
        }
      } catch {
        setError('Could not remove image from the server');
        return;
      }
    }

    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  // ─── Attribute Management ─────────────────────────────────────────────────

  const handleCreateAttribute = async () => {
    if (!newAttrName.trim()) return;
    try {
      const res = await fetch('http://localhost:8080/admin/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newAttrName.trim() }),
      });
      if (res.ok) { setNewAttrName(''); fetchCatalog(); }
      else { const err = await res.json(); setError(err.message || 'Failed to create attribute'); }
    } catch { setError('Backend offline'); }
  };

  const handleUpdateAttribute = async () => {
    if (!editingAttr) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/${editingAttr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editingAttr.name }),
      });
      if (res.ok) { setEditingAttr(null); fetchCatalog(); }
      else { const err = await res.json(); setError(err.message || 'Update failed'); }
    } catch { setError('Backend offline'); }
  };

  const handleDeleteAttribute = async (id: string) => {
    if (!confirm('Delete this attribute and all its values?')) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCatalog();
    } catch { setError('Backend offline'); }
  };

  const handleAddAttributeValue = async (attrId: string) => {
    const val = newAttrValueMap[attrId]?.trim();
    if (!val) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/${attrId}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: val }),
      });
      if (res.ok) { setNewAttrValueMap(prev => ({ ...prev, [attrId]: '' })); fetchCatalog(); }
      else { const err = await res.json(); setError(err.message || 'Failed'); }
    } catch { setError('Backend offline'); }
  };

  const handleUpdateAttributeValue = async () => {
    if (!editingAttrValue) return;
    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/values/${editingAttrValue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: editingAttrValue.value }),
      });
      if (res.ok) { setEditingAttrValue(null); fetchCatalog(); }
      else { const err = await res.json(); setError(err.message || 'Update failed'); }
    } catch { setError('Backend offline'); }
  };

  const handleDeleteAttributeValue = async (valueId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/values/${valueId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCatalog();
    } catch { setError('Backend offline'); }
  };

  // ─── Image Panel ──────────────────────────────────────────────────────────

  const ImagePanel = ({ radioName }: { radioName: string }) => (
    <div className="space-y-2 col-span-2">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">
          Product Images <span className="text-red-500">*</span>
        </label>
        {images.length === 0 && (
          <span className="text-[10px] text-red-400 font-medium">At least one image required</span>
        )}
      </div>
      <div className="flex flex-col gap-4 border border-dashed border-border p-5 rounded-md bg-zinc-50/5">
        <div className="relative">
          <input
            type="file" accept="image/*" multiple
            onChange={handleMultipleImagesUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button
            type="button"
            className="px-4 py-2 border border-border rounded text-xs hover:bg-accent flex items-center gap-1.5 text-foreground cursor-pointer"
          >
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Choose Images'}
          </button>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative group border border-border rounded overflow-hidden bg-card p-1.5 flex flex-col items-center">
                <img src={img.image_url} className="h-16 w-full object-cover rounded" alt="" />
                <input
                  type="text"
                  placeholder="Alt text"
                  className="mt-2 w-full text-[10px] bg-background border border-border rounded px-2 py-1 focus:outline-none"
                  value={img.alt_text || ''}
                  onChange={(e) => setImages(prev => prev.map((item, i) => (
                    i === idx ? { ...item, alt_text: e.target.value } : item
                  )))}
                />
                <div className="flex items-center justify-between w-full mt-2 text-[9px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio" name={radioName} checked={img.is_thumbnail}
                      onChange={() => setImages(prev => prev.map((item, i) => ({ ...item, is_thumbnail: i === idx })))}
                    />
                    <span>Cover</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img, idx)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── SEO Fields Panel ─────────────────────────────────────────────────────

  const SeoPanel = () => (
    <div className="col-span-2 border border-border rounded-md p-4 space-y-4 bg-background">
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Tag size={12} /> SEO / Search Engine Optimization
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">SEO Title</label>
          <input
            type="text" name="seo_title" maxLength={70}
            placeholder="Recommended: 50–70 characters"
            className="w-full text-xs bg-card border border-border rounded px-3 py-2.5 focus:outline-none"
            value={form.seo_title} onChange={handleInputChange}
          />
          <span className="text-[9px] text-muted-foreground">{form.seo_title.length}/70</span>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">SEO Description</label>
          <textarea
            name="seo_description" rows={2} maxLength={160}
            placeholder="Recommended: 120–160 characters"
            className="w-full text-xs bg-card border border-border rounded px-3 py-2.5 focus:outline-none resize-none"
            value={form.seo_description} onChange={handleInputChange}
          />
          <span className="text-[9px] text-muted-foreground">{form.seo_description.length}/160</span>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase">SEO Keywords</label>
          <input
            type="text" name="seo_keywords"
            placeholder="Comma-separated: abaya, modest wear, dubai fashion"
            className="w-full text-xs bg-card border border-border rounded px-3 py-2.5 focus:outline-none"
            value={form.seo_keywords} onChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );

  // ─── Variants Section ─────────────────────────────────────────────────────

  const VariantsSection = () => (
    <div className="space-y-4 pt-6 border-t border-border">
      <div className="flex justify-between items-center border-b border-border pb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Product Variants ({variants.length})</h3>
        <button
          type="button" onClick={handleAddVariant}
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer"
        >
          <PlusCircle size={14} /> Add Variant
        </button>
      </div>
      <div className="space-y-4">
        {variants.map((v, varIdx) => (
          <div key={varIdx} className="bg-background border border-border p-4 rounded-md grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase">SKU</label>
              <input type="text" required
                className="w-full text-xs bg-card border border-border rounded px-2.5 py-2 focus:outline-none"
                value={v.sku} onChange={e => handleVariantChange(varIdx, 'sku', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase">Price (AED)</label>
              <input type="number" required
                className="w-full text-xs bg-card border border-border rounded px-2.5 py-2 focus:outline-none"
                value={v.price} onChange={e => handleVariantChange(varIdx, 'price', e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-muted-foreground uppercase">Initial Qty</label>
              <input type="number" required
                className="w-full text-xs bg-card border border-border rounded px-2.5 py-2 focus:outline-none"
                value={v.initial_quantity} onChange={e => handleVariantChange(varIdx, 'initial_quantity', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {v.attributes.map((attr, attrIdx) => {
                const dbAttr = dbAttributes.find(da => da.name.toLowerCase() === attr.name.toLowerCase());
                const options = dbAttr ? dbAttr.values.map(val => val.value) : [];
                return (
                  <div key={attrIdx} className="space-y-1">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase">{attr.name}</label>
                    {options.length > 0 ? (
                      <select
                        className="w-full text-xs bg-card border border-border rounded px-2 py-2 focus:outline-none text-foreground"
                        value={attr.value}
                        onChange={e => handleVariantAttributeChange(varIdx, attrIdx, e.target.value)}
                        required
                      >
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type="text"
                        className="w-full text-xs bg-card border border-border rounded px-2 py-2 focus:outline-none"
                        value={attr.value}
                        onChange={e => handleVariantAttributeChange(varIdx, attrIdx, e.target.value)}
                        required />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Variant images */}
            <div className="sm:col-span-4 border-t border-border pt-3 mt-1 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Variant Images</label>
                <div className="relative">
                  <input type="file" accept="image/*" multiple
                    onChange={e => handleVariantImagesUpload(e, varIdx)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button type="button" className="px-2.5 py-1 border border-border rounded text-[10px] hover:bg-accent flex items-center gap-1 text-foreground cursor-pointer">
                    <Upload size={10} /> Upload
                  </button>
                </div>
              </div>
              {v.images && v.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {v.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="relative w-24 border border-border rounded overflow-hidden group bg-card p-1">
                      <img src={img.image_url} className="h-10 w-full object-cover rounded" alt="" />
                      <button type="button"
                        onClick={() => setVariants(prev => prev.map((item, i) =>
                          i === varIdx ? { ...item, images: (item.images || []).filter((_, j) => j !== imgIdx) } : item
                        ))}
                        className="absolute inset-x-1 top-1 h-10 bg-red-500/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition rounded">
                        ×
                      </button>
                      <input
                        type="text"
                        placeholder="Alt text"
                        className="mt-1.5 w-full text-[10px] bg-background border border-border rounded px-2 py-1 focus:outline-none"
                        value={img.alt_text || ''}
                        onChange={(e) => setVariants(prev => prev.map((item, i) => {
                          if (i !== varIdx) return item;
                          return {
                            ...item,
                            images: (item.images || []).map((variantImage, currentIndex) => (
                              currentIndex === imgIdx ? { ...variantImage, alt_text: e.target.value } : variantImage
                            )),
                          };
                        }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {variants.length > 1 && (
              <button type="button"
                onClick={() => setVariants(variants.filter((_, idx) => idx !== varIdx))}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold">
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Attribute Manager Tab ────────────────────────────────────────────────

  const AttributeManager = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <h2 className="font-serif text-lg font-bold">Attributes &amp; Values</h2>
        <span className="text-xs text-muted-foreground">Manage product variant attributes</span>
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="New attribute name (e.g. Color)"
          value={newAttrName} onChange={e => setNewAttrName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateAttribute(); } }}
          className="flex-1 text-xs bg-background border border-border rounded px-3 py-2 focus:outline-none" />
        <button type="button" onClick={handleCreateAttribute}
          className="px-4 py-2 btn-luxury rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
          <Plus size={14} /> Add Attribute
        </button>
      </div>
      <div className="space-y-3">
        {dbAttributes.map(attr => (
          <div key={attr.id} className="border border-border rounded-md p-4 bg-card">
            <div className="flex items-center gap-2 mb-3">
              {editingAttr?.id === attr.id ? (
                <>
                  <input type="text" value={editingAttr.name}
                    onChange={e => setEditingAttr({ ...editingAttr, name: e.target.value })}
                    className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none font-semibold"
                    autoFocus />
                  <button type="button" onClick={handleUpdateAttribute}
                    className="p-1.5 rounded text-green-500 hover:bg-green-500/10 border border-green-500/20 cursor-pointer"><Save size={12} /></button>
                  <button type="button" onClick={() => setEditingAttr(null)}
                    className="p-1.5 rounded text-muted-foreground hover:bg-accent border border-border cursor-pointer"><X size={12} /></button>
                </>
              ) : (
                <>
                  <span className="font-semibold text-sm flex-1">{attr.name}</span>
                  <button type="button" onClick={() => setEditingAttr({ id: attr.id, name: attr.name })}
                    className="p-1.5 rounded text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 cursor-pointer"><Pencil size={12} /></button>
                  <button type="button" onClick={() => handleDeleteAttribute(attr.id)}
                    className="p-1.5 rounded text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 cursor-pointer"><Trash size={12} /></button>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {attr.values.map(val => (
                <div key={val.id} className="flex items-center gap-1 bg-background border border-border rounded-full px-2 py-0.5">
                  {editingAttrValue?.id === val.id ? (
                    <>
                      <input type="text" value={editingAttrValue.value}
                        onChange={e => setEditingAttrValue({ ...editingAttrValue, value: e.target.value })}
                        className="text-[11px] bg-transparent focus:outline-none w-16" autoFocus />
                      <button type="button" onClick={handleUpdateAttributeValue}
                        className="text-green-500 hover:text-green-600 cursor-pointer"><Save size={10} /></button>
                      <button type="button" onClick={() => setEditingAttrValue(null)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"><X size={10} /></button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px]">{val.value}</span>
                      <button type="button" onClick={() => setEditingAttrValue({ id: val.id, value: val.value })}
                        className="text-primary hover:text-primary/80 cursor-pointer"><Pencil size={9} /></button>
                      <button type="button" onClick={() => handleDeleteAttributeValue(val.id)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"><X size={9} /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add value (e.g. Black)"
                value={newAttrValueMap[attr.id] || ''}
                onChange={e => setNewAttrValueMap(prev => ({ ...prev, [attr.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAttributeValue(attr.id); } }}
                className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 focus:outline-none" />
              <button type="button" onClick={() => handleAddAttributeValue(attr.id)}
                className="px-3 py-1.5 border border-border rounded text-xs hover:bg-accent flex items-center gap-1 cursor-pointer">
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Category Manager Tab ─────────────────────────────────────────────────

  const CategoryManager = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <h2 className="font-serif text-lg font-bold">Categories</h2>
        <span className="text-xs text-muted-foreground">Edit existing categories</span>
      </div>
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="border border-border rounded px-4 py-3 bg-card flex items-center gap-3">
            {editingCategory?.id === cat.id ? (
              <>
                <input type="text" value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none" autoFocus />
                <input type="text" value={editingCategory.slug}
                  onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-40 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none font-mono"
                  placeholder="slug" />
                <select
                  value={editingCategory.parent_id}
                  onChange={e => setEditingCategory({ ...editingCategory, parent_id: e.target.value })}
                  className="w-44 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none text-foreground"
                >
                  <option value="">Root Level</option>
                  {categories
                    .filter((parent) => parent.id !== editingCategory.id)
                    .map((parent) => (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                </select>
                <button type="button"
                  onClick={async () => {
                    if (!editingCategory) return;
                    try {
                      const res = await fetch(`http://localhost:8080/admin/categories/${editingCategory.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          name: editingCategory.name,
                          slug: editingCategory.slug,
                          parent_id: editingCategory.parent_id || null,
                        }),
                      });
                      if (res.ok) { setEditingCategory(null); fetchCatalog(); }
                      else { const err = await res.json(); setError(err.message || 'Update failed'); }
                    } catch { setError('Backend offline'); }
                  }}
                  className="p-1.5 rounded text-green-500 hover:bg-green-500/10 border border-green-500/20 cursor-pointer">
                  <Save size={12} />
                </button>
                <button type="button" onClick={() => setEditingCategory(null)}
                  className="p-1.5 rounded text-muted-foreground hover:bg-accent border border-border cursor-pointer">
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                <span className="text-xs font-mono text-muted-foreground">{cat.slug}</span>
                <button type="button" onClick={() => setEditingCategory({ id: cat.id, name: cat.name, slug: cat.slug, parent_id: cat.parent_id || '' })}
                  className="p-1.5 rounded text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 cursor-pointer">
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Product Form Body (shared) ───────────────────────────────────────────

  const ProductFormFields = ({ radioName }: { radioName: string }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Product Name</label>
        <input type="text" name="name" required
          className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
          value={form.name} onChange={handleInputChange} />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">URL Slug</label>
        <input type="text" name="slug" required
          className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
          value={form.slug} onChange={handleInputChange} />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Publishing Status</label>
        <select name="status"
          className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 text-foreground focus:outline-none"
          value={form.status} onChange={handleInputChange}>
          <option value="DRAFT">Draft (Hidden)</option>
          <option value="PUBLISHED">Published (Visible)</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">SKU Code Prefix</label>
        <input type="text" name="sku_prefix" placeholder="e.g. ABA-NID"
          className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
          value={form.sku_prefix} onChange={handleInputChange} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Description</label>
        <RichTextEditor value={form.description} onChange={handleDescriptionChange} />
      </div>
      <div className="space-y-2 col-span-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase block">Categories</label>
        <div className="flex flex-wrap gap-4 pt-1">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.category_ids.includes(cat.id)}
                onChange={() => handleCategoryCheckbox(cat.id)}
                className="rounded text-primary focus:ring-primary" />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>
      <ImagePanel radioName={radioName} />
      <SeoPanel />
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">eCommerce Catalog</h1>
          <p className="text-xs text-muted-foreground font-light">Add, edit, or archive products, variants, attributes and categories.</p>
        </div>
        {adminTab === 'products' && (
          <button
            id="btn-new-product"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowEditForm(false);
              setEditingProduct(null);
              resetForm();
            }}
            className="px-4 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-border">
        {(['products', 'attributes', 'categories'] as const).map(tab => (
          <button key={tab} type="button"
            onClick={() => { setAdminTab(tab); setShowCreateForm(false); setShowEditForm(false); }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              adminTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
          <Check size={14} /> <span>{success}</span>
        </div>
      )}
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

      {/* ── Products Tab ─────────────────────────────────────────── */}
      {adminTab === 'products' && (
        <>
          {/* Create Form */}
          {showCreateForm && (
            <form onSubmit={handleSubmitProduct} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6 animate-fade-in text-foreground">
              <div className="border-b border-border pb-3">
                <h2 className="font-serif text-lg font-bold">Register New Masterpiece</h2>
                <p className="text-xs text-zinc-400">Products are grouped templates. Pricing and stock belong to Variants.</p>
              </div>
              <ProductFormFields radioName="is_thumbnail_create" />
              <VariantsSection />
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-border rounded text-xs hover:bg-accent cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
                  Publish Product
                </button>
              </div>
            </form>
          )}

          {/* Edit Form */}
          {showEditForm && editingProduct && (
            <form onSubmit={handleEditProductSubmit} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6 text-foreground">
              <div className="border-b border-border pb-3">
                <h2 className="font-serif text-lg font-bold">Edit Masterpiece Details</h2>
                <p className="text-xs text-zinc-400">Modifying: <span className="font-bold text-primary">{editingProduct.name}</span></p>
              </div>
              <ProductFormFields radioName="is_thumbnail_edit" />
              <VariantsSection />
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={() => { setShowEditForm(false); setEditingProduct(null); }}
                  className="px-4 py-2 border border-border rounded text-xs hover:bg-accent cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
                  Save Modifications
                </button>
              </div>
            </form>
          )}

          {/* Products Table */}
          <section className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
            <div className="border-b border-border p-4 bg-background">
              <h2 className="font-serif text-lg font-bold">Catalog Items Table</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted font-light">Loading catalog...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted font-light">No products registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Starting Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-light">
                    {products.map(p => {
                      const startingPrice = p.variants[0]?.price || 0;
                      const totalStock = p.variants.reduce((acc, v) => acc + (v.inventories[0]?.quantity || 0), 0);
                      return (
                        <tr key={p.id} className="hover:bg-accent/40 text-foreground">
                          <td className="p-4 font-medium">{p.name}</td>
                          <td className="p-4 font-mono text-muted">{p.slug}</td>
                          <td className="p-4 font-semibold">AED {startingPrice}</td>
                          <td className="p-4">{totalStock} units</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                              p.status === 'PUBLISHED'
                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2">
                            <button onClick={() => handleTogglePublish(p.id, p.status)}
                              className={`p-1.5 border rounded transition cursor-pointer ${
                                p.status === 'PUBLISHED'
                                  ? 'border-border text-yellow-500 hover:bg-yellow-500/10'
                                  : 'border-border text-green-500 hover:bg-green-500/10'
                              }`}
                              title={p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}>
                              {p.status === 'PUBLISHED' ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => handleEditClick(p)}
                              className="p-1.5 border border-border rounded text-primary hover:bg-primary/10 transition cursor-pointer"
                              title="Edit Product">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleArchiveProduct(p.id)}
                              className="p-1.5 border border-border rounded text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              title="Archive Product">
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
        </>
      )}

      {/* ── Attributes Tab ────────────────────────────────────────── */}
      {adminTab === 'attributes' && <AttributeManager />}

      {/* ── Categories Tab ────────────────────────────────────────── */}
      {adminTab === 'categories' && <CategoryManager />}
    </div>
  );
}

