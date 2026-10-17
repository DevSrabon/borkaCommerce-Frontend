'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { clearSession } from '../../../store/authSlice';
import {
  Box,
  Archive,
  ClipboardList,
  Check,
  Search,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Layers,
  ChevronDown,
  RefreshCw,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface VariantAttribute {
  name?: string;
  value?: string;
  attribute_value?: {
    value: string;
    attribute?: { name: string };
  };
}

interface ProductVariant {
  id: string;
  sku: string;
  price?: number;
  attributes?: VariantAttribute[];
  inventories?: Array<{
    id: string;
    quantity: number;
    available_quantity: number;
    reserved_quantity: number;
  }>;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  thumbnail_url?: string;
  variants?: ProductVariant[];
}

interface InventoryRecord {
  id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  warehouse?: { name: string };
  variant: {
    id: string;
    sku: string;
    product?: {
      id?: string;
      name: string;
      thumbnail_url?: string;
      sku?: string;
    };
    attributes?: VariantAttribute[];
  };
}

interface TransactionRecord {
  id: string;
  type: string;
  quantity: number;
  reference_type: string;
  created_at: string;
  variant?: {
    sku: string;
    product?: { name: string };
  };
}

interface StagedItem {
  variant_id: string;
  product_name: string;
  product_image?: string;
  sku: string;
  variant_label: string;
  current_available: number;
  quantity: number;
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  // Data states
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter for Active Stock list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Stock In / Stock Out Management states
  const [mode, setMode] = useState<'IN' | 'OUT'>('IN');
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [bulkQuantity, setBulkQuantity] = useState<number>(10);
  const [note, setNote] = useState('');

  // Product & Variant Picker state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [defaultVariantQty, setDefaultVariantQty] = useState<number>(10);

  // Delete modal state
  const [recordToDelete, setRecordToDelete] = useState<InventoryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close product dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validate admin
  useEffect(() => {
    if (!token || !user) {
      router.push('/admin/login?redirect=admin/inventory');
      return;
    }
    const adminEmails = ['srabon@example.com', 'admin@example.com'];
    const isAdmin = user.role === 'ADMIN' || adminEmails.includes(user.email.toLowerCase());
    if (!isAdmin) {
      router.push('/');
    }
  }, [token, user, router]);

  // Fetch all inventory, products and audit logs
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Inventory Records
      const invPromise = fetch(`${API_BASE_URL}/admin/inventory`, { headers });
      // 2. Fetch Products with Variants
      const prodPromise = fetch(`${API_BASE_URL}/admin/products?limit=150`, { headers });
      // 3. Fetch Transactions
      const txPromise = fetch(`${API_BASE_URL}/admin/inventory/transactions?limit=60`, { headers });

      const [invRes, prodRes, txRes] = await Promise.all([invPromise, prodPromise, txPromise]);

      if (invRes.status === 401 || prodRes.status === 401) {
        dispatch(clearSession());
        router.push('/admin/login?reason=expired');
        return;
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData || []);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData.items || []);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData : txData.items || []);
      }
    } catch (err) {
      setError('Could not connect to inventory database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAllData();
  }, [token]);

  // Helper to get formatted variant label (e.g. Size: 54 / Black)
  const getVariantLabel = (v: ProductVariant | any) => {
    if (v.attributes && v.attributes.length > 0) {
      return v.attributes
        .map((a: any) => a.attribute_value?.value || a.value || '')
        .filter(Boolean)
        .join(' / ');
    }
    return v.sku || 'Default Variant';
  };

  // Helper to find available stock for a variant
  const getVariantAvailableStock = (variantId: string) => {
    const inv = inventory.find((i) => i.variant?.id === variantId);
    if (inv) return inv.available_quantity;
    return 0;
  };

  // Selected Product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Filtered products for dropdown search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 50);
    const q = productSearch.toLowerCase().trim();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  // Toggle selection of a variant
  const handleToggleVariant = (variantId: string) => {
    setSelectedVariantIds((prev) =>
      prev.includes(variantId) ? prev.filter((id) => id !== variantId) : [...prev, variantId]
    );
  };

  // Select all variants of the currently selected product
  const handleSelectAllVariants = () => {
    if (!selectedProduct || !selectedProduct.variants) return;
    const allIds = selectedProduct.variants.map((v) => v.id);
    setSelectedVariantIds(allIds);
  };

  // Clear variant selection
  const handleClearVariantSelection = () => {
    setSelectedVariantIds([]);
  };

  // Add selected variants to Staging Tray
  const handleAddSelectedToStaged = () => {
    if (!selectedProduct || selectedVariantIds.length === 0) return;

    const newItems: StagedItem[] = [];

    selectedProduct.variants?.forEach((v) => {
      if (selectedVariantIds.includes(v.id)) {
        // If already in stagedItems, don't duplicate; just update
        const exists = stagedItems.find((s) => s.variant_id === v.id);
        if (!exists) {
          const availableStock = getVariantAvailableStock(v.id);
          newItems.push({
            variant_id: v.id,
            product_name: selectedProduct.name,
            product_image: selectedProduct.thumbnail_url,
            sku: v.sku,
            variant_label: getVariantLabel(v),
            current_available: availableStock,
            quantity: defaultVariantQty > 0 ? defaultVariantQty : 1,
          });
        }
      }
    });

    setStagedItems((prev) => [...prev, ...newItems]);
    setSelectedVariantIds([]);
  };

  // Remove single item from staged tray
  const handleRemoveStagedItem = (variantId: string) => {
    setStagedItems((prev) => prev.filter((item) => item.variant_id !== variantId));
  };

  // Update quantity of a single staged item
  const handleUpdateStagedQty = (variantId: string, qty: number) => {
    setStagedItems((prev) =>
      prev.map((item) =>
        item.variant_id === variantId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  // Apply bulk quantity to all staged items
  const handleApplyBulkQty = () => {
    if (bulkQuantity <= 0) return;
    setStagedItems((prev) =>
      prev.map((item) => ({ ...item, quantity: bulkQuantity }))
    );
  };

  // Quick adjust an item directly from the table
  const handleQuickAdjustFromTable = (inv: InventoryRecord) => {
    const v = inv.variant;
    const exists = stagedItems.find((s) => s.variant_id === v.id);
    if (!exists) {
      setStagedItems((prev) => [
        ...prev,
        {
          variant_id: v.id,
          product_name: v.product?.name || 'Selected Product',
          product_image: v.product?.thumbnail_url,
          sku: v.sku,
          variant_label: getVariantLabel(v),
          current_available: inv.available_quantity,
          quantity: 10,
        },
      ]);
    }
    // Scroll smoothly to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Batch Stock In / Stock Out
  const handleSubmitBatchAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (stagedItems.length === 0) {
      setError('Please select at least one product variant to adjust stock.');
      return;
    }

    // If Stock Out, ensure none exceeds available stock
    if (mode === 'OUT') {
      const invalid = stagedItems.find((item) => item.quantity > item.current_available);
      if (invalid) {
        setError(
          `Cannot stock out ${invalid.quantity} units for SKU "${invalid.sku}". Only ${invalid.current_available} units available.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        items: stagedItems.map((item) => ({
          variant_id: item.variant_id,
          // If mode is OUT, pass negative quantity
          quantity: mode === 'IN' ? Math.abs(item.quantity) : -Math.abs(item.quantity),
        })),
        note: note.trim() || undefined,
        reference_type: note.trim() || (mode === 'IN' ? 'STOCK_IN' : 'STOCK_OUT'),
      };

      const res = await fetch(`${API_BASE_URL}/admin/inventory/batch-adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        setError(resData.message || 'Stock adjustment failed.');
        setSubmitting(false);
        return;
      }

      setSuccess(
        `Successfully processed ${mode === 'IN' ? 'Stock In' : 'Stock Out'} for ${stagedItems.length} variant(s)!`
      );
      setStagedItems([]);
      setNote('');
      fetchAllData();
    } catch (err) {
      setError('Network connectivity error. Failed to save stock adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete of an inventory record
  const handleDeleteInventoryRecord = async () => {
    if (!recordToDelete) return;
    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/inventory/${recordToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await res.json();
      if (!res.ok) {
        setError(resData.message || 'Failed to delete inventory record.');
        setDeleting(false);
        return;
      }

      setSuccess(resData.message || 'Inventory record deleted successfully.');
      setRecordToDelete(null);
      fetchAllData();
    } catch (err) {
      setError('Network error while deleting inventory record.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered inventory for table
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      // Status filter
      if (statusFilter === 'IN_STOCK' && item.available_quantity <= 5) return false;
      if (statusFilter === 'LOW_STOCK' && (item.available_quantity <= 0 || item.available_quantity > 5)) return false;
      if (statusFilter === 'OUT_OF_STOCK' && item.available_quantity > 0) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const pName = item.variant?.product?.name?.toLowerCase() || '';
      const sku = item.variant?.sku?.toLowerCase() || '';
      const vLabel = getVariantLabel(item.variant).toLowerCase();

      return pName.includes(q) || sku.includes(q) || vLabel.includes(q);
    });
  }, [inventory, searchQuery, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 w-full space-y-8 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Box className="text-primary h-8 w-8" />
            Inventory Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Easy Stock In & Stock Out, multi-product batch adjustment, instant search, and audit history.
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-muted hover:bg-accent border border-border text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Global Notifications */}
      {success && (
        <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between text-xs bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. STOCK IN / STOCK OUT BATCH MANAGER                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-7 space-y-6">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-serif text-foreground flex items-center gap-2">
              <Layers size={20} className="text-primary" />
              Quick Stock Adjustment (Batch)
            </h2>
            <p className="text-xs text-muted-foreground">
              Select product, choose variants, adjust quantities, and commit with an optional note.
            </p>
          </div>

          {/* Mode Tabs: Stock In vs Stock Out */}
          <div className="inline-flex p-1 bg-muted rounded-xl border border-border/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMode('IN')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'IN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownToLine size={15} />
              <span>STOCK IN (+)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('OUT')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'OUT'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpFromLine size={15} />
              <span>STOCK OUT (-)</span>
            </button>
          </div>
        </div>

        {/* Step 1 & 2: Product & Variant Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Step 1: Select Product (Searchable Dropdown) */}
          <div className="lg:col-span-5 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>1. Select Product *</span>
              {selectedProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId('');
                    setSelectedVariantIds([]);
                  }}
                  className="text-[11px] text-primary hover:underline font-normal cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </label>

            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-primary/60 transition-colors shadow-2xs"
              >
                {selectedProduct ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={selectedProduct.thumbnail_url || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=120'}
                      alt=""
                      className="h-9 w-9 object-cover rounded-lg border border-border shrink-0"
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-foreground truncate">{selectedProduct.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{selectedProduct.sku}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <Search size={14} /> Click to search & select product...
                  </span>
                )}
                <ChevronDown size={16} className="text-muted-foreground shrink-0 ml-2" />
              </div>

              {/* Dropdown Menu */}
              {isProductDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-2 space-y-2 max-h-80 overflow-hidden flex flex-col">
                  {/* Search box inside dropdown */}
                  <div className="relative px-1 pt-1">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Type to search product name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full text-xs bg-background border border-border rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  </div>

                  {/* Product list */}
                  <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-center py-6 text-muted-foreground font-light">
                        No matching products found.
                      </p>
                    ) : (
                      filteredProducts.map((p) => {
                        const isSelected = p.id === selectedProductId;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setSelectedVariantIds([]);
                              setIsProductDropdownOpen(false);
                            }}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary/10 border border-primary/30 text-primary'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <img
                              src={p.thumbnail_url || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=120'}
                              alt=""
                              className="h-8 w-8 object-cover rounded-md border border-border shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                <span>{p.sku}</span>
                                <span>• {p.variants?.length || 0} variant(s)</span>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-primary shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Variant(s) of this Product */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Select Variant(s) *
              </label>

              {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllVariants}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-muted-foreground">•</span>
                  <button
                    type="button"
                    onClick={handleClearVariantSelection}
                    className="text-muted-foreground hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {!selectedProduct ? (
              <div className="h-32 border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-4 text-center text-muted-foreground text-xs space-y-1">
                <Box size={24} className="text-muted-foreground/60 mb-1" />
                <p className="font-medium text-foreground">No product selected</p>
                <p className="text-[11px] text-muted-foreground">Please select a product from step 1 to view and pick variants.</p>
              </div>
            ) : !selectedProduct.variants || selectedProduct.variants.length === 0 ? (
              <div className="h-32 border border-border bg-muted/30 rounded-xl flex items-center justify-center p-4 text-xs text-muted-foreground">
                This product does not have any variants configured.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Variant Chips / Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {selectedProduct.variants.map((v) => {
                    const isChecked = selectedVariantIds.includes(v.id);
                    const stock = getVariantAvailableStock(v.id);
                    const label = getVariantLabel(v);

                    return (
                      <div
                        key={v.id}
                        onClick={() => handleToggleVariant(v.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between space-y-1.5 ${
                          isChecked
                            ? 'bg-primary/10 border-primary shadow-xs'
                            : 'bg-background border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-foreground text-xs leading-tight line-clamp-1">
                            {label}
                          </span>
                          <div
                            className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/40'
                            }`}
                          >
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-muted-foreground truncate">{v.sku}</span>
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded ${
                              stock > 5
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : stock > 0
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {stock} in stock
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add to Batch Tray Button */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Initial Qty:</span>
                    <input
                      type="number"
                      min={1}
                      value={defaultVariantQty}
                      onChange={(e) => setDefaultVariantQty(Math.max(1, Number(e.target.value)))}
                      className="w-20 text-xs bg-background border border-border rounded-lg px-2.5 py-2 font-semibold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={selectedVariantIds.length === 0}
                    onClick={handleAddSelectedToStaged}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedVariantIds.length === 0
                        ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                        : 'bg-primary text-primary-foreground hover:opacity-95 shadow-xs'
                    }`}
                  >
                    <Plus size={15} />
                    <span>Add {selectedVariantIds.length} Variant(s) to Batch Tray</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Step 3: Staged Items / Batch Tray Table                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Archive size={16} className="text-primary" />
                Staged Adjustment Tray ({stagedItems.length} items ready)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                You can add variants from multiple products before saving. Review and edit quantities below.
              </p>
            </div>

            {stagedItems.length > 0 && (
              <div className="flex items-center gap-3">
                {/* Bulk Set Quantity Helper */}
                <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground px-2">Set all to:</span>
                  <input
                    type="number"
                    min={1}
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-16 text-xs bg-background border border-border rounded px-2 py-1 text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkQty}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-card border border-border hover:bg-accent rounded text-foreground cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setStagedItems([])}
                  className="text-xs text-rose-500 hover:text-rose-400 font-medium hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {stagedItems.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground space-y-2 bg-muted/15">
              <ClipboardList size={28} className="mx-auto text-muted-foreground/50" />
              <p className="font-medium text-foreground">No items in the adjustment tray</p>
              <p className="text-[11px]">
                Select a product and variant(s) above and click <strong>"Add to Batch Tray"</strong> to stage items for {mode === 'IN' ? 'Stock In' : 'Stock Out'}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/70 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border">
                    <th className="p-3.5">Product & Variant</th>
                    <th className="p-3.5">SKU Code</th>
                    <th className="p-3.5 text-center">Current Stock</th>
                    <th className="p-3.5 text-center">
                      {mode === 'IN' ? 'Add Qty (+)' : 'Deduct Qty (-)'}
                    </th>
                    <th className="p-3.5 text-center">Resulting Stock</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-light">
                  {stagedItems.map((item) => {
                    const resultingStock =
                      mode === 'IN'
                        ? item.current_available + item.quantity
                        : item.current_available - item.quantity;
                    const isExceeded = mode === 'OUT' && item.quantity > item.current_available;

                    return (
                      <tr key={item.variant_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product_image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=120'}
                              alt=""
                              className="h-9 w-9 object-cover rounded-lg border border-border shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-xs line-clamp-1">
                                {item.product_name}
                              </p>
                              <p className="text-[11px] text-primary font-medium">{item.variant_label}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-muted-foreground text-xs">{item.sku}</td>

                        <td className="p-3.5 text-center font-semibold text-foreground">
                          {item.current_available} units
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <span
                              className={`text-xs font-bold ${
                                mode === 'IN' ? 'text-emerald-500' : 'text-rose-500'
                              }`}
                            >
                              {mode === 'IN' ? '+' : '-'}
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateStagedQty(item.variant_id, Number(e.target.value))
                              }
                              className={`w-20 text-center font-bold text-xs py-1.5 rounded-lg border focus:outline-none focus:ring-1 ${
                                isExceeded
                                  ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                                  : 'border-border bg-background text-foreground'
                              }`}
                            />
                          </div>
                          {isExceeded && (
                            <p className="text-[10px] text-rose-500 font-semibold mt-1">Exceeds available stock!</p>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`font-bold text-xs ${
                              resultingStock < 0
                                ? 'text-rose-500'
                                : resultingStock <= 5
                                ? 'text-amber-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            {resultingStock} units
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedItem(item.variant_id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove from batch"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Note & Submit Form */}
          {stagedItems.length > 0 && (
            <form onSubmit={handleSubmitBatchAdjustment} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <FileText size={13} className="text-primary" />
                  Transaction Note / Audit Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder='e.g. "Restocked from Dubai factory", "Supplier Invoice #2041", "Damaged shipment", "Showroom audit"'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Ready to process <strong className="text-foreground">{stagedItems.length}</strong> items via{' '}
                  <span className={mode === 'IN' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                    {mode === 'IN' ? 'Stock In (+)' : 'Stock Out (-)'}
                  </span>
                  .
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm text-white ${
                    mode === 'IN'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : mode === 'IN' ? (
                    <ArrowDownToLine size={16} />
                  ) : (
                    <ArrowUpFromLine size={16} />
                  )}
                  <span>
                    {submitting
                      ? 'Saving Stock Changes...'
                      : mode === 'IN'
                      ? `Confirm Stock In (${stagedItems.length} items)`
                      : `Confirm Stock Out (${stagedItems.length} items)`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. ACTIVE STOCK LEVELS (WITH SEARCH, STATUS FILTER & DELETE)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden space-y-0">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-serif text-foreground flex items-center gap-2">
                <Archive size={18} className="text-primary" />
                Current Product Stock Levels
              </h2>
              <p className="text-xs text-muted-foreground">
                All registered product variants with physical quantity, reservation status, and live available stock.
              </p>
            </div>

            <div className="text-xs font-semibold px-3 py-1 bg-muted rounded-full text-foreground border border-border self-start">
              Total Mappings: {inventory.length}
            </div>
          </div>

          {/* Search bar & Filter Pills */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            {/* Real-time search */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by product name, SKU, or size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-xl pl-10 pr-9 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="inline-flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({inventory.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('IN_STOCK')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'IN_STOCK'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                In Stock
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('LOW_STOCK')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'LOW_STOCK'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Low Stock (≤5)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('OUT_OF_STOCK')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'OUT_OF_STOCK'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Out of Stock (0)
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
            <p>Loading real-time inventory balances...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Box size={32} className="mx-auto text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No matching inventory records found.</p>
            {searchQuery && (
              <p className="text-[11px]">Try clearing your search query "{searchQuery}".</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-bold text-[10px] border-b border-border">
                  <th className="p-4">Product / Variant Details</th>
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Physical Stock</th>
                  <th className="p-4">Reserved</th>
                  <th className="p-4">Available Sellable</th>
                  <th className="p-4 text-center">Stock Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-light">
                {filteredInventory.map((inv) => {
                  const product = inv.variant?.product;
                  const variant = inv.variant;
                  const label = getVariantLabel(variant);
                  const isLow = inv.available_quantity > 0 && inv.available_quantity <= 5;
                  const isOut = inv.available_quantity <= 0;

                  return (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product?.thumbnail_url || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=120'}
                            alt=""
                            className="h-10 w-10 object-cover rounded-lg border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-foreground line-clamp-1">
                              {product?.name || 'Seeded Product'}
                            </div>
                            <div className="text-[11px] font-medium text-primary mt-0.5">
                              {label}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-muted-foreground text-xs">{variant?.sku}</td>

                      <td className="p-4 font-semibold text-foreground">{inv.quantity} units</td>

                      <td className="p-4 text-amber-500 font-medium">
                        {inv.reserved_quantity > 0 ? `${inv.reserved_quantity} locked` : '0 units'}
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-bold text-sm ${
                            isOut
                              ? 'text-rose-500'
                              : isLow
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {inv.available_quantity} units
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {isOut ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Low Stock (≤5)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustFromTable(inv)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-accent border border-border text-foreground transition-colors cursor-pointer"
                            title="Quick Adjust Stock"
                          >
                            Adjust
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(inv)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Stock Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. TRANSACTION AUDIT LOG                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-border p-5 bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-primary" />
            <h2 className="font-serif text-base font-bold text-foreground">Transaction Audit Log</h2>
          </div>
          <span className="text-xs text-muted-foreground">Recent changes with notes & timestamps</span>
        </div>

        {loading ? (
          <p className="p-6 text-xs text-muted-foreground font-light text-center">Loading audit history...</p>
        ) : transactions.length === 0 ? (
          <p className="p-6 text-xs text-muted-foreground font-light text-center">No transaction records logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/70 text-muted-foreground uppercase tracking-wider font-bold text-[10px] border-b border-border">
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">Product & SKU</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Quantity Changed</th>
                  <th className="p-4">Note / Audit Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-light">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{tx.variant?.product?.name || 'Product'}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{tx.variant?.sku}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          tx.quantity > 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      <span className={tx.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} units
                      </span>
                    </td>
                    <td className="p-4 text-foreground font-medium">
                      {tx.reference_type || <span className="text-muted-foreground font-normal italic">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION MODAL                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-foreground">Delete Stock Record?</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-xl border border-border text-xs space-y-1">
              <p className="font-bold text-foreground">{recordToDelete.variant?.product?.name}</p>
              <p className="font-mono text-muted-foreground">SKU: {recordToDelete.variant?.sku}</p>
              <p className="text-muted-foreground">Current physical quantity: {recordToDelete.quantity} units</p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete this inventory mapping record?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-muted hover:bg-accent border border-border text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInventoryRecord}
                disabled={deleting}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-2"
              >
                {deleting && <RefreshCw size={13} className="animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
