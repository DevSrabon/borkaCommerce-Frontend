'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { clearSession } from '../../../store/authSlice';
import {
  Users,
  Trash,
  Check,
  AlertCircle,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Ban,
  Pencil,
  Eye,
  X,
  Save,
  Package,
  Star,
  ShoppingBag,
} from 'lucide-react';
import AdminPagination from '../../../components/admin/AdminPagination';

interface CustomerSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_blocked: boolean;
  email_verified: boolean;
  created_at: string;
  _count?: {
    orders: number;
    reviews: number;
  };
}

interface CustomerDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_blocked: boolean;
  email_verified: boolean;
  created_at: string;
  orders: any[];
  reviews: any[];
  addresses: any[];
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [editingCustomer, setEditingCustomer] = useState<CustomerSummary | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    role: 'CUSTOMER',
    password: '',
  });

  const [viewDetails, setViewDetails] = useState<CustomerDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'REVIEWS'>('ORDERS');

  // Pagination states (default limit: 50, skip: 0)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const skip = (page - 1) * limit;
      const res = await fetch(`${API_BASE_URL}/admin/customers?limit=${limit}&skip=${skip}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        dispatch(clearSession());
        router.push('/admin/login?reason=expired');
        return;
      }

      if (res.ok) {
        const totalHeader = res.headers.get('x-total-count');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setCustomers(items);
        if (totalHeader) {
          setTotalCustomers(parseInt(totalHeader, 10));
        } else {
          setTotalCustomers(items.length);
        }
      } else {
        setError('Failed to fetch customer accounts.');
      }
    } catch (err) {
      setError('Connection to backend service failed.');
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, dispatch, router]);

  useEffect(() => {
    if (token) fetchCustomers();
  }, [token, fetchCustomers]);

  // Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(adminForm),
      });

      if (res.ok) {
        setSuccess(`Administrator account for ${adminForm.email} created successfully!`);
        setShowCreateAdmin(false);
        setAdminForm({ first_name: '', last_name: '', email: '', phone: '', password: '' });
        fetchCustomers();
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to create admin');
      }
    } catch (_) {
      setError('Network error while creating admin.');
    }
  };

  // Toggle Block / Unblock
  const handleToggleBlock = async (cust: CustomerSummary) => {
    const action = cust.is_blocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} ${cust.first_name} ${cust.last_name}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers/${cust.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_blocked: !cust.is_blocked }),
      });

      if (res.ok) {
        setSuccess(`Customer account ${action}ed successfully.`);
        fetchCustomers();
      } else {
        const err = await res.json();
        setError(err.message || `Failed to ${action} customer.`);
      }
    } catch (_) {
      setError('Network error.');
    }
  };

  // Open Edit Modal
  const openEdit = (cust: CustomerSummary) => {
    setEditingCustomer(cust);
    setEditForm({
      first_name: cust.first_name,
      last_name: cust.last_name,
      phone: cust.phone || '',
      role: cust.role || 'CUSTOMER',
      password: '',
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const updatePayload: any = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
        role: editForm.role,
      };
      if (editForm.password.trim()) {
        updatePayload.password = editForm.password;
      }

      const res = await fetch(`${API_BASE_URL}/admin/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        setSuccess('Customer profile updated successfully.');
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to update customer.');
      }
    } catch (_) {
      setError('Network error.');
    }
  };

  // View Customer Details with Orders and Reviews
  const handleViewDetails = async (id: string) => {
    setLoadingDetails(true);
    setViewDetails(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setViewDetails(await res.json());
      }
    } catch (_) {}
    finally {
      setLoadingDetails(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer? This will also remove their orders history and active sessions.')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccess('Customer account removed.');
        fetchCustomers();
      } else {
        const data = await res.json();
        setError(data.message || 'Deletion failed');
      }
    } catch (_) {
      setError('Deletion failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">Customer Accounts & Admins</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage store customers, block suspicious profiles, review order histories, and create administrators.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2 px-3.5 py-2 btn-luxury rounded-md text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            <UserPlus size={14} /> Create Admin
          </button>
          <button
            onClick={fetchCustomers}
            className="p-2 border border-border rounded-md hover:bg-accent transition text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-xs bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-md">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-xs bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-md">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Customers Table */}
      <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-border p-4 bg-background flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="font-serif text-sm font-bold text-foreground">Registered Accounts ({customers.length})</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">Loading customer profiles...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground font-light">No customers registered in database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-center">Orders</th>
                  <th className="p-4 text-center">Reviews</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-light">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-accent/40 transition">
                    <td className="p-4 font-medium text-foreground">
                      {cust.first_name} {cust.last_name}
                    </td>
                    <td className="p-4 font-mono text-muted-foreground">{cust.email}</td>
                    <td className="p-4 text-foreground">{cust.phone || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs uppercase border ${
                          cust.role === 'ADMIN'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}
                      >
                        {cust.role || 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-xs uppercase border ${
                          cust.is_blocked
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-green-500/10 text-green-500 border-green-500/20'
                        }`}
                      >
                        {cust.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-foreground">
                      {cust._count?.orders ?? 0}
                    </td>
                    <td className="p-4 text-center font-bold text-primary">
                      {cust._count?.reviews ?? 0}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(cust.id)}
                          className="p-1.5 border border-border rounded hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                          title="View Orders & Ratings History"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => openEdit(cust)}
                          className="p-1.5 border border-border rounded hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
                          title="Edit User Info"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(cust)}
                          className={`p-1.5 border rounded transition cursor-pointer ${
                            cust.is_blocked
                              ? 'border-green-500/30 text-green-500 hover:bg-green-500/10'
                              : 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title={cust.is_blocked ? 'Unblock user' : 'Block user'}
                        >
                          <Ban size={13} />
                        </button>
                        {cust.email !== currentUser?.email && (
                          <button
                            onClick={() => handleDeleteCustomer(cust.id)}
                            className="p-1.5 border border-border rounded text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition cursor-pointer"
                            title="Delete customer permanently"
                          >
                            <Trash size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Pagination Controls ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-border bg-card/60 text-xs">
              <div className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{customers.length === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-foreground">{Math.min(page * limit, totalCustomers || customers.length)}</span> of{' '}
                <span className="font-semibold text-foreground">{totalCustomers || customers.length}</span> customers
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <AdminPagination
                  currentPage={page}
                  totalPages={Math.max(1, Math.ceil((totalCustomers || customers.length) / limit))}
                  onPageChange={setPage}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal: Create Admin */}
      {showCreateAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-serif text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" /> Create Administrator Account
              </h2>
              <button onClick={() => setShowCreateAdmin(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">First Name *</label>
                  <input
                    type="text"
                    required
                    value={adminForm.first_name}
                    onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })}
                    className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={adminForm.last_name}
                    onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })}
                    className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin.colleague@example.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Phone Number</label>
                <input
                  type="text"
                  placeholder="+971 50 000 0000"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-serif text-base font-bold text-foreground">
                Edit User: {editingCustomer.email}
              </h2>
              <button onClick={() => setEditingCustomer(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Account Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="ADMIN">ADMIN (Full Privileges)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  placeholder="New password..."
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full text-xs bg-background border border-border rounded p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: View Customer Orders & Reviews History */}
      {(viewDetails || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-foreground">
                  Customer Profile & Purchase History
                </h2>
                {viewDetails && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {viewDetails.first_name} {viewDetails.last_name} ({viewDetails.email})
                  </p>
                )}
              </div>
              <button
                onClick={() => setViewDetails(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Loading orders and ratings history...
              </div>
            ) : viewDetails && (
              <div className="space-y-6">
                {/* Profile Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-accent/30 p-4 rounded-lg border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase">Account Role</span>
                    <span className="font-bold text-foreground">{viewDetails.role || 'CUSTOMER'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase">Status</span>
                    <span className={viewDetails.is_blocked ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                      {viewDetails.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase">Total Orders</span>
                    <span className="font-bold text-foreground">{viewDetails.orders.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase">Total Reviews</span>
                    <span className="font-bold text-primary">{viewDetails.reviews.length}</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <button
                    onClick={() => setActiveTab('ORDERS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                      activeTab === 'ORDERS'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Package size={13} /> Orders Placed ({viewDetails.orders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('REVIEWS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                      activeTab === 'REVIEWS'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Star size={13} /> Reviews & Ratings ({viewDetails.reviews.length})
                  </button>
                </div>

                {/* Tab: Orders */}
                {activeTab === 'ORDERS' && (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {viewDetails.orders.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-light py-4 text-center">
                        No orders recorded for this customer yet.
                      </p>
                    ) : (
                      viewDetails.orders.map((ord: any) => (
                        <div
                          key={ord.id}
                          className="border border-border p-3.5 rounded-lg bg-background space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold text-foreground">Order #{ord.order_number}</span>
                            <span className="text-muted-foreground">
                              {new Date(ord.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                {ord.status}
                              </span>
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                {ord.payment_status}
                              </span>
                            </div>
                            <span className="font-bold text-foreground">
                              {ord.total} {ord.currency || 'AED'}
                            </span>
                          </div>
                          {ord.items && ord.items.length > 0 && (
                            <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                              {ord.items.map((it: any) => (
                                <div key={it.id} className="flex justify-between">
                                  <span>
                                    {it.quantity}x {it.product_name} ({it.variant_name})
                                  </span>
                                  <span>AED {it.subtotal}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Reviews */}
                {activeTab === 'REVIEWS' && (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {viewDetails.reviews.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-light py-4 text-center">
                        No reviews submitted by this customer.
                      </p>
                    ) : (
                      viewDetails.reviews.map((rev: any) => (
                        <div
                          key={rev.id}
                          className="border border-border p-3.5 rounded-lg bg-background space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-foreground">
                              {rev.product?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                fill={s <= rev.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1.5 font-mono">
                              ({rev.rating}/5) • {rev.status}
                            </span>
                          </div>
                          {rev.review && (
                            <p className="text-xs text-muted-foreground italic font-light">
                              "{rev.review}"
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
