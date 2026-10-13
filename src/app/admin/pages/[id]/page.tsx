'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_BASE_URL } from '@/config/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Globe,
  Settings2,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import { PageBlock, CMSPage } from '@/types/page-builder';
import PageBuilderCanvas from '@/components/page-builder/PageBuilderCanvas';
import AddBlockModal from '@/components/page-builder/AddBlockModal';
import BlockSettingsModal from '@/components/page-builder/BlockSettingsModal';

export default function PageBuilderEditorPage() {
  const params = useParams();
  const pageId = params?.id as string;
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const [page, setPage] = useState<CMSPage | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>(undefined);
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
  const [showSeoModal, setShowSeoModal] = useState(false);

  // Fetch page data
  useEffect(() => {
    if (!pageId || !token) return;
    const fetchPage = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/pages/${pageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: CMSPage = await res.json();
          setPage(data);
          setTitle(data.title);
          setSlug(data.slug);
          setIsPublished(data.is_published);
          setMetaTitle(data.meta_title || '');
          setMetaDescription(data.meta_description || '');

          try {
            const parsed = JSON.parse(data.content || '[]');
            setBlocks(Array.isArray(parsed) ? parsed : []);
          } catch {
            setBlocks([]);
          }
        } else {
          alert('Could not find page');
          router.push('/admin/pages');
        }
      } catch (err) {
        console.error('Error fetching page:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [pageId, token, router]);

  const handleSavePage = async (publishOverride?: boolean) => {
    if (!token || !pageId) return;

    setSaving(true);
    setSaveSuccess(false);

    const publishState = publishOverride !== undefined ? publishOverride : isPublished;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          content: JSON.stringify(blocks),
          meta_title: metaTitle.trim() || title.trim(),
          meta_description: metaDescription.trim() || undefined,
          is_published: publishState,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPage(updated);
        setIsPublished(updated.is_published);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save page');
      }
    } catch (err) {
      console.error('Error saving page:', err);
      alert('Network error saving page');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = (newBlock: PageBlock) => {
    if (insertIndex !== undefined && insertIndex >= 0) {
      const next = [...blocks];
      next.splice(insertIndex, 0, newBlock);
      setBlocks(next);
    } else {
      setBlocks((prev) => [...prev, newBlock]);
    }
  };

  const handleLoadTemplate = (templateBlocks: PageBlock[]) => {
    if (blocks.length > 0) {
      if (!confirm('This will replace current blocks with the template. Continue?')) return;
    }
    setBlocks(templateBlocks);
  };

  const handleUpdateBlock = (updated: PageBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xs text-muted-foreground">
        Loading Page Builder Workspace...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Builder Control Header */}
      <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pages"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Back to Pages List"
          >
            <ArrowLeft size={16} />
          </Link>

          {/* Page Title & Slug */}
          <div className="flex flex-col">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page Title"
              className="bg-transparent font-serif font-bold text-base sm:text-lg focus:outline-none focus:border-b border-primary"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Slug: /{slug}</span>
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                title={isSlugLocked ? 'Click to edit slug' : 'Lock slug'}
              >
                {isSlugLocked ? <Lock size={10} /> : <Unlock size={10} className="text-primary" />}
              </button>
              {!isSlugLocked && (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-background border border-border rounded px-1 text-[11px] font-mono"
                />
              )}
            </div>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SEO Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowSeoModal(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border hover:bg-accent text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Configure SEO Meta Tags"
          >
            <Settings2 size={14} />
            <span className="hidden sm:inline">SEO Settings</span>
          </button>

          {/* Add Block Quick Button */}
          <button
            type="button"
            onClick={() => {
              setInsertIndex(blocks.length);
              setShowAddModal(true);
            }}
            className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Block</span>
          </button>

          {/* Publish Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const next = !isPublished;
              setIsPublished(next);
              handleSavePage(next);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
              isPublished
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
            }`}
          >
            <Globe size={13} />
            <span>{isPublished ? 'Published' : 'Draft'}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={() => handleSavePage()}
            disabled={saving}
            className="px-5 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* View Live */}
          {isPublished && (
            <Link
              href={`/${slug}`}
              target="_blank"
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Preview Live Page in New Tab"
            >
              <ExternalLink size={16} />
            </Link>
          )}

          {saveSuccess && (
            <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <CheckCircle2 size={16} />
              Page saved successfully!
            </div>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        <PageBuilderCanvas
          blocks={blocks}
          onChangeBlocks={setBlocks}
          onEditBlock={(block) => setEditingBlock(block)}
          onOpenAddModal={(idx) => {
            setInsertIndex(idx);
            setShowAddModal(true);
          }}
        />
      </div>

      {/* Modal: Add Block / Template */}
      <AddBlockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddBlock={handleAddBlock}
        onLoadTemplate={handleLoadTemplate}
      />

      {/* Modal: Block Settings Inspector */}
      <BlockSettingsModal
        block={editingBlock}
        isOpen={Boolean(editingBlock)}
        onClose={() => setEditingBlock(null)}
        onSave={handleUpdateBlock}
      />

      {/* Modal: SEO Settings */}
      {showSeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              SEO & Social Metadata
            </h3>
            <p className="text-xs text-muted-foreground">
              Optimize how this page appears on Google search results and social shares.
            </p>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title}
                  className="w-full bg-background border border-border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="A concise summary of this page for search engines..."
                  className="w-full bg-background border border-border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowSeoModal(false)}
                className="px-4 py-2 border border-border rounded hover:bg-accent cursor-pointer text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
