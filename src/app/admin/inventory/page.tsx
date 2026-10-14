'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { clearSession } from '../../../store/authSlice';
import { Box, HelpCircle, Archive, ClipboardList, Check } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
}

interface InventoryRecord {
  id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  warehouse: { name: string };
  variant: { sku: string; product: { name: string } };
}

interface TransactionRecord {
  id: string;
  type: string;
  quantity: number;
  reference_type: string;
  created_at: string;
  warehouse: { name: string };
  variant: { sku: string; product: { name: string } };
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock adjust form state
  const [adjustForm, setAdjustForm] = useState({
    variant_id: '',
    warehouse_id: '',
    quantity: 10,
    type: 'MANUAL_ADJUSTMENT',
    reference_type: 'STOCKTAKINGS',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Warehouses
      const whRes = await fetch(`${API_BASE_URL}/admin/warehouses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (whRes.status === 401) {
        dispatch(clearSession());
        router.push('/admin/login?reason=expired');
        return;
      }
      if (whRes.ok) {
        setWarehouses(await whRes.json());
      } else {
        setWarehouses([{ id: 'wh-1', name: 'Dubai Main Warehouse' }]);
      }

      // 2. Fetch Stock status
      const invRes = await fetch(`${API_BASE_URL}/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (invRes.status === 401) {
        dispatch(clearSession());
        router.push('/admin/login?reason=expired');
        return;
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData);
        // Pre-fill form selection
        if (invData.length > 0) {
          setAdjustForm((prev) => ({
            ...prev,
            variant_id: invData[0].variant_id || invData[0].variant?.id || '',
            warehouse_id: invData[0].warehouse_id || invData[0].warehouse?.id || '',
          }));
        }
      } else {
        setInventory([]);
      }

      // 3. Fetch Transactions log
      const txRes = await fetch(`${API_BASE_URL}/admin/inventory/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (txRes.ok) {
        setTransactions(await txRes.json());
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError('Could not connect to inventory database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInventoryData();
  }, [token]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!adjustForm.variant_id || !adjustForm.warehouse_id) {
      setError('Please select a variant and warehouse.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/inventory/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          variant_id: adjustForm.variant_id,
          warehouse_id: adjustForm.warehouse_id,
          quantity: Number(adjustForm.quantity),
          type: adjustForm.type,
          reference_type: adjustForm.reference_type,
        }),
      });

      if (res.ok) {
        setSuccess('Stock adjusted and transaction logged successfully!');
        fetchInventoryData();
      } else {
        const err = await res.json();
        setError(err.message || 'Adjustment failed');
      }
    } catch (err) {
      // Mock adjustment
      setInventory((prev) =>
        prev.map((item) => {
          const matched = item.variant.sku === 'ABA-BLK-54-NID'; // mock variant check
          if (matched) {
            const newQty = item.quantity + Number(adjustForm.quantity);
            return { ...item, quantity: newQty, available_quantity: newQty };
          }
          return item;
        })
      );

      const newMockTx: TransactionRecord = {
        id: `tx-${Date.now()}`,
        type: adjustForm.type,
        quantity: Number(adjustForm.quantity),
        reference_type: adjustForm.reference_type,
        created_at: new Date().toISOString(),
        warehouse: { name: 'Dubai Main Warehouse' },
        variant: { sku: 'ABA-BLK-54-NID', product: { name: 'Classic Black Nidha Abaya' } },
      };
      setTransactions((prev) => [newMockTx, ...prev]);
      setSuccess('Preview adjustment saved locally! (Backend offline)');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Inventory Audits</h1>
          <p className="text-xs text-muted-foreground font-light">Monitor warehouse stock levels and verify transaction audit history.</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Stock Levels */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
            <div className="border-b border-border p-4 bg-background flex items-center gap-2">
              <Archive size={18} className="text-primary" />
              <h2 className="font-serif text-base font-bold">Active Warehouse Stock levels</h2>
            </div>

            {loading ? (
              <p className="p-6 text-xs text-muted font-light">Loading inventory balances...</p>
            ) : inventory.length === 0 ? (
              <p className="p-6 text-xs text-muted font-light">No stock mappings configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                      <th className="p-4">Product / SKU</th>
                      <th className="p-4">Warehouse</th>
                      <th className="p-4">Physical Qty</th>
                      <th className="p-4">Reserved</th>
                      <th className="p-4">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-light">
                    {inventory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-accent/40">
                        <td className="p-4">
                          <div className="font-medium text-foreground">{inv.variant?.product?.name || 'Seeded Product'}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{inv.variant?.sku}</div>
                        </td>
                        <td className="p-4 text-muted">{inv.warehouse?.name}</td>
                        <td className="p-4 font-semibold text-foreground">{inv.quantity} units</td>
                        <td className="p-4 text-yellow-500">{inv.reserved_quantity} units</td>
                        <td className="p-4 font-bold text-primary">{inv.available_quantity} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Adjust Stock Form */}
        <div className="space-y-6">
          <form onSubmit={handleAdjustStock} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-5">
            <h2 className="font-serif text-base font-bold border-b border-border pb-3 flex items-center gap-2">
              <Box size={18} className="text-primary" /> Adjust Inventory Levels
            </h2>

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

            <div className="space-y-3 text-xs">
              {/* Select Variant */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Target Variant SKU</label>
                <select
                  className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={adjustForm.variant_id}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, variant_id: e.target.value }))}
                >
                  <option value="">Select SKU option</option>
                  {inventory.map((inv) => (
                    // We extract variant ID
                    <option key={inv.id} value={inv.id}>
                      {inv.variant?.sku} ({inv.variant?.product?.name.substring(0, 15)}...)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Warehouse */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Warehouse</label>
                <select
                  className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={adjustForm.warehouse_id}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, warehouse_id: e.target.value }))}
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjust Qty */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Adjust Count (Use minus for deduction)</label>
                <input
                  type="number"
                  className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                  required
                />
              </div>

              {/* Adjust Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Audit Transaction Type</label>
                <select
                  className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="PURCHASE">Purchase Arrival</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                  <option value="RETURN">Customer Return</option>
                  <option value="TRANSFER">Transfer Between Locations</option>
                </select>
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Audit Reference Tag</label>
                <input
                  type="text"
                  className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
                  value={adjustForm.reference_type}
                  onChange={(e) => setAdjustForm((prev) => ({ ...prev, reference_type: e.target.value }))}
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
              Perform Audit Entry
            </button>
          </form>
        </div>
      </div>

      {/* Audit Log / Inventory Transactions List */}
      <section className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
        <div className="border-b border-border p-4 bg-background flex items-center gap-2">
          <ClipboardList size={18} className="text-primary" />
          <h2 className="font-serif text-base font-bold">Transaction Audit Log</h2>
        </div>

        {loading ? (
          <p className="p-6 text-xs text-muted font-light">Loading audit logs...</p>
        ) : transactions.length === 0 ? (
          <p className="p-6 text-xs text-muted font-light">No logs logged.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                  <th className="p-4">Date / Time</th>
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Quantity Changed</th>
                  <th className="p-4">Audit Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-light">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-accent/40">
                    <td className="p-4 text-muted">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold">{tx.variant?.sku}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-semibold text-xs border ${tx.type === 'PURCHASE' || tx.type === 'RETURN'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} units
                    </td>
                    <td className="p-4 text-muted">{tx.reference_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
