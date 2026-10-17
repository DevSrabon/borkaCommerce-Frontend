'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_BASE_URL } from '@/config/api';
import {
  X,
  Upload,
  Globe,
  ImageIcon,
  Search,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface MediaItem {
  url: string;
  name: string;
  folder?: string;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (data: {
    src: string;
    altText?: string;
    width?: string;
    alignment?: 'left' | 'center' | 'right';
  }) => void;
}

export function MediaModal({ isOpen, onClose, onInsert }: MediaModalProps) {
  const [tab, setTab] = useState<'upload' | 'url' | 'library'>('upload');
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [width, setWidth] = useState('100%');

  // Media Library state
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const token = useSelector((state: RootState) => state.auth?.token);

  useEffect(() => {
    if (isOpen && tab === 'library') {
      fetchMedia();
    }
  }, [isOpen, tab]);

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/admin/media`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMediaList(data);
      }
    } catch (err) {
      console.warn('Failed to fetch media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'blog');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/admin/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.url || (data.item && data.item.url);
        if (uploadedUrl) {
          onInsert({
            src: uploadedUrl,
            altText: altText || file.name,
            width,
            alignment,
          });
          onClose();
          return;
        }
      }
    } catch (err) {
      console.warn('Upload to server failed, falling back to base64:', err);
    } finally {
      setUploading(false);
    }

    // Fallback base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        onInsert({
          src: dataUrl,
          altText: altText || file.name,
          width,
          alignment,
        });
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInsertUrl = () => {
    if (!url.trim()) return;
    onInsert({
      src: url.trim(),
      altText,
      width,
      alignment,
    });
    setUrl('');
    setAltText('');
    onClose();
  };

  const handleInsertLibrary = () => {
    if (!selectedItem) return;
    onInsert({
      src: selectedItem.url,
      altText: altText || selectedItem.name,
      width,
      alignment,
    });
    setSelectedItem(null);
    onClose();
  };

  if (!isOpen) return null;

  const filteredMedia = mediaList.filter((m) =>
    (m.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card text-foreground border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-primary" />
            <h2 className="font-semibold text-sm">Insert Image</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border px-5 bg-muted/30 text-xs">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`py-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload size={13} />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`py-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'url'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe size={13} />
            <span>Web URL</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`py-2.5 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              tab === 'library'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon size={13} />
            <span>Media Library</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-muted/20 hover:bg-muted/40 transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                  disabled={uploading}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="font-medium">Uploading image...</span>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-muted-foreground mb-2" />
                    <span className="font-semibold text-foreground">Click to upload an image</span>
                    <span className="text-muted-foreground text-[11px] mt-1">PNG, JPG, WebP, GIF up to 10MB</span>
                  </>
                )}
              </label>
            </div>
          )}

          {/* TAB 2: WEB URL */}
          {tab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>

              {url && (
                <div className="border border-border rounded-lg p-2 bg-muted/10 max-h-48 overflow-hidden flex items-center justify-center">
                  <img
                    src={url}
                    alt="Preview"
                    className="max-h-40 object-contain rounded"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA LIBRARY */}
          {tab === 'library' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              {loadingMedia ? (
                <div className="py-12 flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Loading media library...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No images found in media library.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {filteredMedia.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedItem(item)}
                      className={`relative aspect-square border-2 rounded-lg overflow-hidden cursor-pointer group bg-muted/20 transition ${
                        selectedItem?.url === item.url
                          ? 'border-primary ring-2 ring-primary/40'
                          : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      {selectedItem?.url === item.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 size={20} className="text-primary fill-background" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Common Layout & Dimension Options */}
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-muted-foreground font-medium mb-1">Alt Text</label>
              <input
                type="text"
                placeholder="Image description"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-muted-foreground font-medium mb-1">Width</label>
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border rounded-md bg-background cursor-pointer"
              >
                <option value="100%">100% (Full Width)</option>
                <option value="75%">75% (Medium Large)</option>
                <option value="50%">50% (Half Width)</option>
                <option value="25%">25% (Small Thumbnail)</option>
              </select>
            </div>
            <div>
              <label className="block text-muted-foreground font-medium mb-1">Alignment</label>
              <select
                value={alignment}
                onChange={(e) => setAlignment(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-border rounded-md bg-background cursor-pointer"
              >
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition cursor-pointer"
          >
            Cancel
          </button>
          {tab === 'url' && (
            <button
              type="button"
              disabled={!url.trim()}
              onClick={handleInsertUrl}
              className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              Insert Image
            </button>
          )}
          {tab === 'library' && (
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleInsertLibrary}
              className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer shadow-xs"
            >
              Insert Selected
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
