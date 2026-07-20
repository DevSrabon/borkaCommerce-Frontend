'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Plus, Trash, Check, Tag } from 'lucide-react';

interface AttributeValue {
  id: string;
  value: string;
}

interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}

export default function AdminAttributesPage() {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [newValueMap, setNewValueMap] = useState<Record<string, string>>({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validate admin
  useEffect(() => {
    if (!token || !user) {
      router.push('/login?redirect=admin/attributes');
      return;
    }
    const adminEmails = ['srabon@example.com', 'admin@example.com'];
    if (!adminEmails.includes(user.email.toLowerCase())) {
      router.push('/');
    }
  }, [token, user]);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/admin/attributes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAttributes(await res.json());
      } else {
        loadMockAttributes();
      }
    } catch (err) {
      loadMockAttributes();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAttributes();
  }, [token]);

  const loadMockAttributes = () => {
    setAttributes([
      { id: 'attr-1', name: 'Color', values: [{ id: 'val-1', value: 'Black' }, { id: 'val-2', value: 'Navy Blue' }, { id: 'val-3', value: 'Maroon' }] },
      { id: 'attr-2', name: 'Size', values: [{ id: 'val-4', value: '54' }, { id: 'val-5', value: '56' }, { id: 'val-6', value: '58' }] },
      { id: 'attr-3', name: 'Fabric', values: [{ id: 'val-7', value: 'Nidha' }, { id: 'val-8', value: 'Zoom' }, { id: 'val-9', value: 'Crepe' }] },
    ]);
  };

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newAttrName.trim()) return;

    try {
      const res = await fetch('http://localhost:8080/admin/attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newAttrName }),
      });

      if (res.ok) {
        setSuccess(`Attribute "${newAttrName}" created successfully!`);
        setNewAttrName('');
        setShowCreateForm(false);
        fetchAttributes();
      } else {
        const err = await res.json();
        setError(err.message || 'Creation failed');
      }
    } catch (err) {
      const newMock: Attribute = {
        id: `mock-${Date.now()}`,
        name: newAttrName,
        values: [],
      };
      setAttributes((prev) => [...prev, newMock]);
      setSuccess('Preview attribute created locally! (Backend offline)');
      setNewAttrName('');
      setShowCreateForm(false);
    }
  };

  const handleCreateValue = async (attrId: string) => {
    setError('');
    setSuccess('');
    const valText = newValueMap[attrId];
    if (!valText || !valText.trim()) return;

    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/${attrId}/values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: valText }),
      });

      if (res.ok) {
        setNewValueMap((prev) => ({ ...prev, [attrId]: '' }));
        fetchAttributes();
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to add option value');
      }
    } catch (err) {
      setAttributes((prev) =>
        prev.map((attr) => {
          if (attr.id === attrId) {
            return {
              ...attr,
              values: [...attr.values, { id: `mock-val-${Date.now()}`, value: valText }],
            };
          }
          return attr;
        })
      );
      setNewValueMap((prev) => ({ ...prev, [attrId]: '' }));
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAttributes();
      } else {
        setAttributes((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      setAttributes((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleDeleteValue = async (valId: string, attrId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/admin/attributes/values/${valId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAttributes();
      } else {
        setAttributes((prev) =>
          prev.map((attr) => {
            if (attr.id === attrId) {
              return { ...attr, values: attr.values.filter((v) => v.id !== valId) };
            }
            return attr;
          })
        );
      }
    } catch (err) {
      setAttributes((prev) =>
        prev.map((attr) => {
          if (attr.id === attrId) {
            return { ...attr, values: attr.values.filter((v) => v.id !== valId) };
          }
          return attr;
        })
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Variant Attributes</h1>
          <p className="text-xs text-muted-foreground font-light">Define standard groupings like Fabric, Color, and Sizes.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} /> New Attribute
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
        <form onSubmit={handleCreateAttribute} className="bg-card border border-border p-6 rounded-md shadow-sm space-y-4 max-w-md">
          <div className="border-b border-border pb-2">
            <h2 className="font-serif text-md font-bold">Create New Attribute Group</h2>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Attribute Name</label>
            <input
              type="text"
              placeholder="e.g. Length, Fit"
              className="w-full text-xs bg-background border border-border rounded px-3 py-2.5 focus:outline-none"
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 border border-border rounded text-xs hover:bg-accent cursor-pointer"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer">
              Create
            </button>
          </div>
        </form>
      )}

      {/* Attributes List */}
      {loading ? (
        <div className="p-8 text-center text-sm text-muted font-light">Loading attributes...</div>
      ) : attributes.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted font-light">No attributes registered yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attributes.map((attr) => (
            <div key={attr.id} className="bg-card border border-border rounded-md shadow-sm p-6 flex flex-col space-y-4 relative">
              <button
                onClick={() => handleDeleteAttribute(attr.id)}
                className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition cursor-pointer"
                title="Delete Attribute Group"
              >
                <Trash size={14} />
              </button>

              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-1.5">
                  <Tag size={16} className="text-primary" />
                  {attr.name}
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {attr.values.length} option values registered
                </p>
              </div>

              {/* Tags/Values list */}
              <div className="flex flex-wrap gap-2 py-2">
                {attr.values.length === 0 ? (
                  <span className="text-xs text-muted font-light italic">No values defined yet.</span>
                ) : (
                  attr.values.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-foreground text-xs border border-border"
                    >
                      {v.value}
                      <button
                        onClick={() => handleDeleteValue(v.id, attr.id)}
                        className="text-muted hover:text-red-500 transition font-bold"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Form to add values */}
              <div className="pt-4 border-t border-border mt-auto flex gap-2">
                <input
                  type="text"
                  placeholder="Add value..."
                  className="flex-1 text-xs bg-background border border-border rounded px-2.5 py-2 focus:outline-none"
                  value={newValueMap[attr.id] || ''}
                  onChange={(e) => setNewValueMap((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                />
                <button
                  onClick={() => handleCreateValue(attr.id)}
                  className="px-3 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
