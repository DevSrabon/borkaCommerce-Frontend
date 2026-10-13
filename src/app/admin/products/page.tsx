'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
  Plus, Trash, Tag, PlusCircle, Check, Edit2, Upload,
  Eye, EyeOff, X, Pencil, Save, ExternalLink, Video, Search, Layers,
} from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';

// Helper to convert any YouTube URL into an embed link
export function getYoutubeEmbedUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}`;
  }
  return '';
}

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
  video_url?: string | null;
  images?: ProductImage[];
  variants: { id?: string; sku?: string; price: number; inventories: { quantity: number }[] }[];
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

  // Form states and refs
  const createFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const emptyForm = {
    name: '',
    slug: '',
    description: '',
    short_description: '',
    sku_prefix: '',
    video_url: '',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    tags: '',
    category_ids: [] as string[],
    related_category_ids: [] as string[],
    status: 'DRAFT',
    is_cod_allowed: true,
  };

  const [form, setForm] = useState(emptyForm);
  const [slugMode, setSlugMode] = useState<'auto' | 'manual'>('auto');
  const [skuMode, setSkuMode] = useState<'auto' | 'manual'>('auto');
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

  // Search and filter states with debounce
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategoryFilter !== 'ALL') {
        const hasCat = (p as any).product_categories?.some(
          (pc: any) => pc.category_id === selectedCategoryFilter || pc.category?.id === selectedCategoryFilter
        );
        if (!hasCat) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && p.status !== selectedStatusFilter) {
        return false;
      }

      // Search filter (name, slug, tags, variant SKUs)
      if (debouncedProductSearch) {
        const nameMatch = p.name?.toLowerCase().includes(debouncedProductSearch);
        const slugMatch = p.slug?.toLowerCase().includes(debouncedProductSearch);
        const tagMatch = (p as any).tags?.toLowerCase().includes(debouncedProductSearch);
        const skuMatch = p.variants?.some((v) =>
          v.sku?.toLowerCase().includes(debouncedProductSearch)
        );
        if (!nameMatch && !slugMatch && !tagMatch && !skuMatch) {
          return false;
        }
      }

      return true;
    });
  }, [products, debouncedProductSearch, selectedCategoryFilter, selectedStatusFilter]);

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
        fetch(`${API_BASE_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/ecommerce/categories/tree`),
        fetch(`${API_BASE_URL}/admin/attributes`, { headers: { Authorization: `Bearer ${token}` } }),
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

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const skuPrefixFromName = (name: string) => {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'PROD';
    if (parts.length === 1) return parts[0].substring(0, 3).toUpperCase();
    return parts.map((p) => p[0].toUpperCase()).join('').substring(0, 4);
  };

  const generatedSkuForIndex = (index: number) => {
    const prefix = form.sku_prefix || 'PROD';
    return `${prefix}-${(index + 1).toString().padStart(3, '0')}`;
  };

  const refreshAutoSkus = (newPrefix: string) => {
    setVariants((current) =>
      current.map((v, index) => {
        if (skuMode === 'manual') return v;
        const prefix = newPrefix || 'PROD';
        return {
          ...v,
          sku: `${prefix}-${(index + 1).toString().padStart(3, '0')}`,
        };
      })
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'name' && slugMode === 'auto') {
      setForm((prev) => ({ ...prev, slug: slugify(value) }));
    }
    if (name === 'name' && skuMode === 'auto') refreshAutoSkus(skuPrefixFromName(value));
    if (name === 'sku_prefix' && skuMode === 'manual') refreshAutoSkus(value);
  };

  const handleDescriptionChange = (html: string) => setForm(prev => ({ ...prev, description: html }));

  const handleCategoryCheckbox = (catId: string) => {
    setForm(prev => {
      const exists = prev.category_ids.includes(catId);
      return { ...prev, category_ids: exists ? prev.category_ids.filter(id => id !== catId) : [...prev.category_ids, catId] };
    });
  };

  // Derived active attribute names across all variants
  const allActiveAttributeNames = useMemo(() => {
    const names = new Set<string>();
    variants.forEach((v) => {
      v.attributes.forEach((a) => {
        if (a.name?.trim()) names.add(a.name.trim());
      });
    });
    return Array.from(names);
  }, [variants]);

  const handleAddAttributeToAllVariants = (attrName: string) => {
    let nameToAdd = attrName;
    if (attrName === '__custom__') {
      const custom = window.prompt('Enter new attribute name (e.g. Sleeve Length, Material, Pattern):');
      if (!custom || !custom.trim()) return;
      nameToAdd = custom.trim();
    }

    const dbAttr = dbAttributes.find(da => da.name.toLowerCase() === nameToAdd.toLowerCase());
    const defaultValue = dbAttr && dbAttr.values[0] ? dbAttr.values[0].value : '';

    setVariants(prev => prev.map(v => {
      const exists = v.attributes.some(a => a.name.toLowerCase() === nameToAdd.toLowerCase());
      if (exists) return v;
      return {
        ...v,
        attributes: [...v.attributes, { name: nameToAdd, value: defaultValue }]
      };
    }));
  };

  const handleRemoveAttributeFromAllVariants = (attrName: string) => {
    setVariants(prev => prev.map(v => ({
      ...v,
      attributes: v.attributes.filter(a => a.name.toLowerCase() !== attrName.toLowerCase())
    })));
  };

  const handleAddAttributeToVariant = (varIdx: number, attrName: string) => {
    let nameToAdd = attrName;
    if (attrName === '__custom__') {
      const custom = window.prompt('Enter new attribute name:');
      if (!custom || !custom.trim()) return;
      nameToAdd = custom.trim();
    }
    const dbAttr = dbAttributes.find(da => da.name.toLowerCase() === nameToAdd.toLowerCase());
    const defaultValue = dbAttr && dbAttr.values[0] ? dbAttr.values[0].value : '';

    setVariants(prev => prev.map((v, i) => {
      if (i !== varIdx) return v;
      if (v.attributes.some(a => a.name.toLowerCase() === nameToAdd.toLowerCase())) return v;
      return {
        ...v,
        attributes: [...v.attributes, { name: nameToAdd, value: defaultValue }]
      };
    }));
  };

  const handleRemoveAttributeFromVariant = (varIdx: number, attrIdx: number) => {
    setVariants(prev => prev.map((v, i) => {
      if (i !== varIdx) return v;
      return {
        ...v,
        attributes: v.attributes.filter((_, j) => j !== attrIdx)
      };
    }));
  };

  const handleAddVariant = () => {
    // Collect attributes dynamically from existing variants or active attribute schema
    const templateAttrs = variants.length > 0 && variants[0].attributes.length > 0
      ? variants[0].attributes.map(a => {
          const dbAttr = dbAttributes.find(da => da.name.toLowerCase() === a.name.toLowerCase());
          return {
            name: a.name,
            value: dbAttr?.values[0]?.value || a.value || '',
          };
        })
      : allActiveAttributeNames.map(name => {
          const dbAttr = dbAttributes.find(da => da.name.toLowerCase() === name.toLowerCase());
          return {
            name,
            value: dbAttr?.values[0]?.value || '',
          };
        });

    setVariants(prev => [
      ...prev,
      {
        sku: skuMode === 'auto' ? generatedSkuForIndex(variants.length) : `${form.sku_prefix ? `${form.sku_prefix}-` : ''}${variants.length + 1}`,
        price: 250,
        compare_price: 300,
        initial_quantity: 20,
        attributes: templateAttrs,
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
        const res = await fetch(`${API_BASE_URL}/admin/products/upload`, {
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
    } catch (err) {
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
        const res = await fetch(`${API_BASE_URL}/admin/uploads/product`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (res.ok) {
          const data = await res.json();
          uploadedImages.push({ image_url: data.imageUrl, alt_text: '' });
        }
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
      const res = await fetch(`${API_BASE_URL}/admin/products`, {
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
        let errorMsg = 'Creation failed';
        try {
          const err = await res.json();
          errorMsg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Creation failed');
        } catch {
          try {
            errorMsg = await res.text();
          } catch {}
        }
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(`Request failed: ${err.message || err}`);
    }
  };

  const handleEditClick = async (p: any) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${p.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const fullProd = await res.json();
        setEditingProduct(fullProd);
        setSlugMode('manual');
        setSkuMode('manual');
        setForm({
          name: fullProd.name,
          slug: fullProd.slug,
          description: fullProd.description || '',
          short_description: fullProd.short_description || '',
          sku_prefix: fullProd.sku_prefix || '',
          video_url: fullProd.video_url || '',
          seo_title: fullProd.seo_title || '',
          seo_description: fullProd.seo_description || '',
          seo_keywords: fullProd.seo_keywords || '',
          tags: fullProd.tags || '',
          category_ids: fullProd.product_categories?.map((pc: any) => pc.category_id) || [],
          related_category_ids: fullProd.related_categories?.map((rc: any) => rc.category_id) || [],
          status: fullProd.status,
          is_cod_allowed: fullProd.is_cod_allowed !== false,
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
        setTimeout(() => {
          editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
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

    // Prompt for email notification if status is changing
    let shouldSendEmail = false;
    if (form.status && form.status !== editingProduct.status) {
      shouldSendEmail = window.confirm(
        `Product status is changing from ${editingProduct.status} to ${form.status}.\n\nDo you want to send an email notification about this status update?`,
      );
    }

    const payload = {
      ...form,
      notify_customers: shouldSendEmail,
      images,
      variants: variants.map(v => ({
        ...v, price: Number(v.price),
        compare_price: v.compare_price ? Number(v.compare_price) : null,
        initial_quantity: Number(v.initial_quantity),
      })),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess(`Product updated successfully!${shouldSendEmail ? ' Email notification sent.' : ''}`);
        setShowEditForm(false);
        setEditingProduct(null);
        fetchCatalog();
      } else {
        let errorMsg = 'Update failed';
        try {
          const err = await res.json();
          errorMsg = Array.isArray(err.message) ? err.message.join(', ') : (err.message || 'Update failed');
        } catch {
          try {
            errorMsg = await res.text();
          } catch {}
        }
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(`Request failed: ${err.message || err}`);
    }
  };

  const handleTogglePublish = async (pId: string, currentStatus: string) => {
    setError(''); setSuccess('');
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const shouldSendEmail = window.confirm(
      `Product status will change to ${newStatus}.\n\nDo you want to send an email notification about this status update?`,
    );

    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${pId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, notify_customers: shouldSendEmail }),
      });
      if (res.ok) {
        setSuccess(`Product ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'}${shouldSendEmail ? ' and notification email sent' : ''}.`);
        fetchCatalog();
      } else {
        const err = await res.json();
        setError(err.message || 'Action failed');
      }
    } catch {
      setProducts(prev => prev.map(item => item.id === pId ? { ...item, status: newStatus } : item));
    }
  };

  const handleArchiveProduct = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCatalog();
      else setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setSlugMode('auto');
    setSkuMode('auto');
    setForm(emptyForm);
    setImages([]);
    const defaultAttrs = dbAttributes.length > 0
      ? dbAttributes.slice(0, 2).map(da => ({ name: da.name, value: da.values[0]?.value || '' }))
      : [{ name: 'Color', value: 'Black' }, { name: 'Size', value: '54' }];
    setVariants([{
      sku: '', price: 250, compare_price: 300, initial_quantity: 50,
      attributes: defaultAttrs,
      images: [],
    }]);
  };

  const flattenCategories = (items: Category[]): Category[] =>
    items.reduce<Category[]>((acc, item) => {
      acc.push(item);
      if (item.children && item.children.length > 0) {
        acc.push(...flattenCategories(item.children));
      }
      return acc;
    }, []);

  const handleRemoveImage = (img: ProductImage, index: number) => {
    if (img.id) {
      if (confirm('Are you sure you want to delete this image? This action will save immediately.')) {
        fetch(`${API_BASE_URL}/admin/products/${editingProduct.id}/images/${img.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deleted) {
              setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
            }
          });
      }
      return;
    }

    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  // ─── Attribute Management ─────────────────────────────────────────────────

  const handleCreateAttribute = async () => {
    if (!newAttrName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/attributes`, {
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
      const res = await fetch(`${API_BASE_URL}/admin/attributes/${editingAttr.id}`, {
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
      const res = await fetch(`${API_BASE_URL}/admin/attributes/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCatalog();
    } catch { setError('Backend offline'); }
  };

  const handleAddAttributeValue = async (attrId: string) => {
    const val = newAttrValueMap[attrId]?.trim();
    if (!val) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/attributes/${attrId}/values`, {
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
      const res = await fetch(`${API_BASE_URL}/admin/attributes/values/${editingAttrValue.id}`, {
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
      const res = await fetch(`${API_BASE_URL}/admin/attributes/values/${valueId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchCatalog();
    } catch { setError('Backend offline'); }
  };

  // ─── Image Panel ──────────────────────────────────────────────────────────

  const renderImagePanel = (radioName: string) => (
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
                  value={img.alt_text || ''}
                  onChange={(e) => setImages((current) => current.map((item, i) => (
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

  const renderSeoPanel = () => (
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

  const renderVariantsSection = () => (
    <div className="space-y-6 pt-6 border-t border-border">
      {/* Product Attributes Schema Selector */}
      <div className="bg-card border border-border p-4 rounded-xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Layers size={14} className="text-primary" />
              Dynamic Product Attributes
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Select which attributes apply to this product&apos;s variants (e.g. Color, Size, Fabric, Length, Sleeve).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddAttributeToAllVariants(e.target.value);
              }}
              className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            >
              <option value="">+ Add Attribute to Variants...</option>
              {dbAttributes
                .filter(da => !allActiveAttributeNames.some(n => n.toLowerCase() === da.name.toLowerCase()))
                .map(da => (
                  <option key={da.id} value={da.name}>{da.name}</option>
                ))}
              <option value="__custom__">+ Create Custom Attribute...</option>
            </select>
          </div>
        </div>

        {/* Active attribute tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">Active Attributes:</span>
          {allActiveAttributeNames.map(attrName => (
            <span
              key={attrName}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary/10 text-primary border border-primary/20 font-medium"
            >
              <span>{attrName}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttributeFromAllVariants(attrName)}
                className="hover:text-red-500 cursor-pointer font-bold ml-1 text-xs"
                title={`Remove ${attrName} from all variants`}
              >
                ×
              </button>
            </span>
          ))}
          {allActiveAttributeNames.length === 0 && (
            <span className="text-[11px] text-amber-500 italic">
              No attributes configured. Click &ldquo;+ Add Attribute to Variants&rdquo; above to add options.
            </span>
          )}
        </div>
      </div>

      {/* Header with Add Variant button */}
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Product Variants ({variants.length})
          </h3>
          <p className="text-[11px] text-muted-foreground">Each variant defines specific SKU, price, stock and attribute values.</p>
        </div>
        <button
          type="button" onClick={handleAddVariant}
          className="text-xs btn-luxury px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <PlusCircle size={14} /> Add Variant
        </button>
      </div>

      {/* List of Variants */}
      <div className="space-y-4">
        {variants.map((v, varIdx) => (
          <div key={varIdx} className="bg-background border border-border p-4 sm:p-5 rounded-xl space-y-4 relative shadow-xs">
            {/* Top row: SKU, Price, Compare Price, Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pr-8">
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase">SKU Code</label>
                <input type="text" required
                  className="w-full text-xs bg-card border border-border rounded-lg px-2.5 py-2 focus:outline-none text-foreground font-mono"
                  value={v.sku} onChange={e => handleVariantChange(varIdx, 'sku', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase">Price (AED)</label>
                <input type="number" required
                  className="w-full text-xs bg-card border border-border rounded-lg px-2.5 py-2 focus:outline-none text-foreground font-semibold"
                  value={v.price} onChange={e => handleVariantChange(varIdx, 'price', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase">Compare Price (Optional)</label>
                <input type="number"
                  placeholder="e.g. 300"
                  className="w-full text-xs bg-card border border-border rounded-lg px-2.5 py-2 focus:outline-none text-foreground"
                  value={v.compare_price || ''} onChange={e => handleVariantChange(varIdx, 'compare_price', e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-muted-foreground uppercase">Stock Qty</label>
                <input type="number" required
                  className="w-full text-xs bg-card border border-border rounded-lg px-2.5 py-2 focus:outline-none text-foreground"
                  value={v.initial_quantity} onChange={e => handleVariantChange(varIdx, 'initial_quantity', e.target.value)} />
              </div>
            </div>

            {/* Middle row: Dynamic Attributes for this Variant */}
            <div className="border-t border-border/70 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Layers size={12} className="text-primary" />
                  Variant Attributes ({v.attributes.length})
                </label>
                {/* Per-variant Add Attribute button */}
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleAddAttributeToVariant(varIdx, e.target.value);
                  }}
                  className="text-[10px] bg-card border border-border rounded px-2 py-1 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                >
                  <option value="">+ Add Attribute...</option>
                  {dbAttributes
                    .filter(da => !v.attributes.some(a => a.name.toLowerCase() === da.name.toLowerCase()))
                    .map(da => (
                      <option key={da.id} value={da.name}>{da.name}</option>
                    ))}
                  <option value="__custom__">+ Custom Attribute...</option>
                </select>
              </div>

              {v.attributes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic bg-card/40 p-2.5 rounded-lg border border-dashed border-border">
                  No attributes defined for this variant. Click &ldquo;+ Add Attribute...&rdquo; to assign Color, Size, etc.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {v.attributes.map((attr, attrIdx) => {
                    const dbAttr = dbAttributes.find(da => da.name.toLowerCase() === attr.name.toLowerCase());
                    const options = dbAttr ? dbAttr.values.map(val => val.value) : [];

                    return (
                      <div key={attrIdx} className="bg-card border border-border p-2.5 rounded-lg space-y-1.5 relative group shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider truncate">
                            {attr.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttributeFromVariant(varIdx, attrIdx)}
                            className="text-muted-foreground hover:text-red-500 font-bold text-xs p-0.5 rounded cursor-pointer transition"
                            title={`Remove ${attr.name} from this variant`}
                          >
                            ×
                          </button>
                        </div>

                        {options.length > 0 ? (
                          <select
                            className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 focus:outline-none text-foreground font-medium cursor-pointer"
                            value={attr.value}
                            onChange={e => handleVariantAttributeChange(varIdx, attrIdx, e.target.value)}
                            required
                          >
                            {!options.includes(attr.value) && attr.value && (
                              <option value={attr.value}>{attr.value}</option>
                            )}
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={`Enter ${attr.name}...`}
                            className="w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 focus:outline-none text-foreground"
                            value={attr.value}
                            onChange={e => handleVariantAttributeChange(varIdx, attrIdx, e.target.value)}
                            required
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom row: Variant images */}
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
                  {v.images.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="relative h-10 w-10 border border-border rounded overflow-hidden group">
                      <img src={imgUrl.image_url} className="h-full w-full object-cover" alt="" />
                      <button type="button"
                        onClick={() => setVariants(prev => prev.map((item, i) =>
                          i === varIdx ? { ...item, images: (item.images || []).filter((_, j) => j !== imgIdx) } : item
                        ))}
                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remove variant button */}
            {variants.length > 1 && (
              <button type="button"
                onClick={() => setVariants(variants.filter((_, idx) => idx !== varIdx))}
                className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer p-1"
                title="Remove this variant">
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
                  value={editingCategory.parent_id || ''}
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
                      const res = await fetch(`${API_BASE_URL}/admin/categories/${editingCategory.id}`, {
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

  // ─── Product Form Body (shared) ───────────────────────────────────────────

  const renderProductFormFields = (radioName: string) => (
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
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
            <Video size={13} className="text-red-500" /> YouTube Video URL (Optional)
          </label>
          <span className="text-[10px] text-muted-foreground">Supports watch, share, shorts &amp; embed links</span>
        </div>
        <input
          type="url"
          name="video_url"
          placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
          className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none text-foreground font-mono"
          value={form.video_url}
          onChange={handleInputChange}
        />
        {form.video_url && getYoutubeEmbedUrl(form.video_url) && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border bg-black/40 p-2.5 max-w-sm">
            <p className="text-[10px] text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-foreground">Live YouTube Preview:</span>
            </p>
            <div className="aspect-video w-full rounded overflow-hidden">
              <iframe
                src={getYoutubeEmbedUrl(form.video_url)}
                title="Product YouTube Preview"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Description</label>
        <RichTextEditor value={form.description} onChange={handleDescriptionChange} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase">Tags (Comma-separated for search)</label>
        <input type="text" name="tags" placeholder="e.g. modest, classic, abaya, ramadan"
          className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
          value={form.tags} onChange={handleInputChange} />
      </div>
      <div className="space-y-1 sm:col-span-2 p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-foreground block">
            Cash on Delivery (COD) Option
          </label>
          <p className="text-[11px] text-muted-foreground">
            Allow customers to pay cash on delivery for this product. If turned off, customers must pay online before placing order.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="is_cod_allowed"
            checked={(form as any).is_cod_allowed !== false}
            onChange={(e) => setForm((prev: any) => ({ ...prev, is_cod_allowed: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
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
      <div className="space-y-2 col-span-2 border-t border-border pt-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase block">Related Categories (For related product suggestions)</label>
        <div className="flex flex-wrap gap-4 pt-1">
          {categories.map(cat => (
            <label key={`related-${cat.id}`} className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.related_category_ids.includes(cat.id)}
                onChange={() => {
                  setForm(prev => {
                    const exists = prev.related_category_ids.includes(cat.id);
                    return {
                      ...prev,
                      related_category_ids: exists
                        ? prev.related_category_ids.filter(id => id !== cat.id)
                        : [...prev.related_category_ids, cat.id]
                    };
                  });
                }}
                className="rounded text-primary focus:ring-primary" />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>
      {renderImagePanel(radioName)}
      {renderSeoPanel()}
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
            type="button"
            onClick={() => {
              const nextState = !showCreateForm;
              setShowCreateForm(nextState);
              setShowEditForm(false);
              setEditingProduct(null);
              resetForm();
              if (nextState) {
                setTimeout(() => {
                  createFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 60);
              }
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
            <form ref={createFormRef} onSubmit={handleSubmitProduct} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6 animate-fade-in text-foreground">
              <div className="border-b border-border pb-3">
                <h2 className="font-serif text-lg font-bold">Register New Masterpiece</h2>
                <p className="text-xs text-zinc-400">Products are grouped templates. Pricing and stock belong to Variants.</p>
              </div>
              {renderProductFormFields('is_thumbnail_create')}
              {renderVariantsSection()}
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
            <form ref={editFormRef} onSubmit={handleEditProductSubmit} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-6 text-foreground">
              <div className="border-b border-border pb-3">
                <h2 className="font-serif text-lg font-bold">Edit Masterpiece Details</h2>
                <p className="text-xs text-zinc-400">Modifying: <span className="font-bold text-primary">{editingProduct.name}</span></p>
              </div>
              {renderProductFormFields('is_thumbnail_edit')}
              {renderVariantsSection()}
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
            <div className="border-b border-border p-4 bg-background flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-lg font-bold">Catalog Items Table</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                  {filteredProducts.length !== products.length && ` (of ${products.length})`}
                </span>
              </div>

              {/* Search & Filter Bar with Debounce */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[220px] sm:min-w-[260px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search title, SKU, slug..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full text-xs bg-card border border-border rounded-lg pl-8 pr-7 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Category filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="text-xs bg-card border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="text-xs bg-card border border-border rounded-lg px-2.5 py-2 text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-muted font-light">Loading catalog...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted font-light space-y-2">
                <p>No products match your search or filter criteria.</p>
                {(productSearch || selectedCategoryFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch('');
                      setSelectedCategoryFilter('ALL');
                      setSelectedStatusFilter('ALL');
                    }}
                    className="text-xs text-primary underline font-medium cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Starting Price</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Stock Config</th>
                      <th className="p-4">COD</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-light">
                    {filteredProducts.map(p => {
                      const startingPrice = p.variants[0]?.price || 0;
                      const totalStock = p.variants.reduce((acc, v) => acc + (v.inventories?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || (v.inventories?.[0]?.quantity || 0)), 0);
                      const rating = (p as any).rating || { average: 0, count: 0 };
                      const featuredImg = p.images?.find((img: any) => img.is_thumbnail)?.image_url || p.images?.[0]?.image_url || '';
                      const resolvedImgUrl = featuredImg
                        ? (featuredImg.startsWith('http') ? featuredImg : `${API_BASE_URL}${featuredImg.startsWith('/') ? '' : '/'}${featuredImg}`)
                        : '';
                      return (
                        <tr key={p.id} className="hover:bg-accent/40 text-foreground">
                          <td className="p-4 font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted border border-border shrink-0 shadow-xs relative flex items-center justify-center">
                                {resolvedImgUrl ? (
                                  <img
                                    src={resolvedImgUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground font-semibold bg-muted/50">
                                    No Img
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground line-clamp-1">{p.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono truncate">{p.variants?.[0]?.sku || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-muted">{p.slug}</td>
                          <td className="p-4 font-semibold">AED {startingPrice}</td>
                          <td className="p-4">
                            {rating.count > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold text-xs">★ {rating.average}</span>
                                <span className="text-[10px] text-muted-foreground">({rating.count})</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">No reviews</span>
                            )}
                          </td>
                          <td className="p-4">
                            {totalStock <= 0 ? (
                              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-red-500/10 text-red-500 border border-red-500/20">
                                Out of Stock (0)
                              </span>
                            ) : totalStock <= 5 ? (
                              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Low Stock ({totalStock})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                In Stock ({totalStock})
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {(p as any).is_cod_allowed !== false ? (
                              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Available
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Prepaid Only
                              </span>
                            )}
                          </td>
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
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 border border-border rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition cursor-pointer flex items-center justify-center"
                              title="Go to / View Product on Storefront"
                            >
                              <ExternalLink size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(p.id, p.status)}
                              className={`p-1.5 border rounded transition cursor-pointer ${
                                p.status === 'PUBLISHED'
                                  ? 'border-border text-yellow-500 hover:bg-yellow-500/10'
                                  : 'border-border text-green-500 hover:bg-green-500/10'
                              }`}
                              title={p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}>
                              {p.status === 'PUBLISHED' ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditClick(p)}
                              className="p-1.5 border border-border rounded text-primary hover:bg-primary/10 transition cursor-pointer"
                              title="Edit Product">
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleArchiveProduct(p.id)}
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
