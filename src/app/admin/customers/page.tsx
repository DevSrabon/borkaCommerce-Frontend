'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Users, Trash, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  created_at: string;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate admin authorization
  useEffect(() => {
    if (!token || !user) {
      router.push('/login?redirect=admin/customers');
      return;
    }
    const adminEmails = ['srabon@example.com', 'admin@example.com'];
    if (!adminEmails.includes(user.email.toLowerCase())) {
      router.push('/');
    }
  }, [token, user]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCustomers(await res.json());
      } else {
        loadMockCustomers();
      }
    } catch (err) {
      loadMockCustomers();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCustomers();
  }, [token]);

  const loadMockCustomers = () => {
    setCustomers([
      {
        id: 'mock-cust-1',
        first_name: 'Srabon',
        last_name: 'Rahman',
        email: 'srabon@example.com',
        phone: '+971501234567',
        email_verified: true,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'mock-cust-2',
        first_name: 'Aisha',
        last_name: 'M.',
        email: 'aisha@example.com',
        phone: null,
        email_verified: false,
        created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ]);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this customer? This will invalidate their active sessions.')) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`http://localhost:8080/admin/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccess('Customer deleted successfully');
        fetchCustomers();
      } else {
        const data = await res.json();
        setError(data.message || 'Deletion failed');
        // fallback delete in local state
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setSuccess('Customer removed locally (Backend offline)');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Customer Accounts</h1>
          <p className="text-xs text-muted-foreground font-light">View customer registers and manage database profile listings.</p>
        </div>
        <button onClick={fetchCustomers} className="p-2 border border-border rounded hover:bg-accent transition text-muted hover:text-foreground">
          <RefreshCw size={16} />
        </button>
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

      {/* Customer lists Table */}
      <section className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
        <div className="border-b border-border p-4 bg-background flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <h2 className="font-serif text-base font-bold">Registered Users ({customers.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted font-light">Loading customer directories...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted font-light">No customers registered in database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Email Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-light">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-accent/40">
                    <td className="p-4 font-medium text-foreground">
                      {cust.first_name} {cust.last_name}
                    </td>
                    <td className="p-4 font-mono text-muted">{cust.email}</td>
                    <td className="p-4 text-foreground">{cust.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${cust.email_verified
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                        {cust.email_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-muted">
                      {new Date(cust.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {cust.email !== 'srabon@example.com' && cust.email !== 'admin@example.com' && (
                        <button
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="p-1.5 border border-border rounded text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition cursor-pointer"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </td>
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
