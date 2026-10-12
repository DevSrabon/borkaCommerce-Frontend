'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Image as ImageIcon, Upload, X, Search, CheckCircle } from 'lucide-react';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });
import 'jodit/es2021/jodit.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

interface MediaItem {
  url: string;
  path: string;
  name: string;
  folder: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const token = useSelector((state: RootState) => state.auth.token);

  // Media Library state
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  // Fetch media from backend
  const fetchMedia = async () => {
    if (!token) return;
    setLoadingMedia(true);
    try {
      const res = await fetch('http://localhost:8080/admin/media', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMediaList(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch media list:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (showMediaModal) {
      fetchMedia();
    }
  }, [showMediaModal]);

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', files[0]);

      const res = await fetch('http://localhost:8080/admin/media/upload?folder=product', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedMediaUrl(data.imageUrl);
        setActiveTab('library');
        fetchMedia(); // Refresh list
      }
    } catch (err) {
      console.error('Media upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleInsertImage = () => {
    if (!selectedMediaUrl) return;

    // Use Jodit API to insert HTML at cursor
    if (editorRef.current) {
      editorRef.current.selection.insertHTML(
        `<img src="${selectedMediaUrl}" style="max-width: 100%; height: auto; margin: 8px 0;" alt="Media Image" />`
      );
    } else {
      // Fallback
      onChange(value + `<img src="${selectedMediaUrl}" style="max-width: 100%; height: auto;" alt="Media Image" />`);
    }

    setShowMediaModal(false);
    setSelectedMediaUrl(null);
  };

  // Filtered media by search query
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mediaList, searchQuery]);

  // Jodit Configuration
  const config = useMemo(() => {
    return {
      readonly: false,
      placeholder,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_as_html',
      defaultActionOnPasteFromWord: 'insert_as_html',
      toolbarButtonSize: 'middle',
      buttons: [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'superscript', 'subscript', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'font', 'fontsize', 'brush', 'paragraph', '|',
        'table', 'link', '|',
        'align', 'undo', 'redo', '|',
        'hr', 'eraser', 'fullsize',
      ],
      controls: {
        paragraph: {
          list: {
            p: 'Normal',
            h1: 'Heading 1',
            h2: 'Heading 2',
            h3: 'Heading 3',
            h4: 'Heading 4',
            blockquote: 'Quote'
          }
        }
      },
      extraButtons: [
        {
          name: 'mediaLibraryBtn',
          icon: 'image',
          tooltip: 'WordPress-like Media Library',
          exec: (editorInstance: any) => {
            editorRef.current = editorInstance;
            setShowMediaModal(true);
          },
        },
      ],
    };
  }, [placeholder]);

  return (
    <div className="relative w-full space-y-2 text-foreground">
      {/* Quick Access Media Library Trigger */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowMediaModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-border bg-card hover:bg-accent hover:text-foreground transition cursor-pointer"
        >
          <ImageIcon size={14} />
          Add Media (WordPress Library)
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <JoditEditor
          ref={editorRef}
          value={value}
          config={config as any}
          onBlur={(newContent) => onChange(newContent)}
          onChange={() => {}}
        />
      </div>

      {/* WordPress-like Media Dialog Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
          <div className="relative bg-card border border-border w-full max-w-4xl h-[85vh] rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background">
              <div>
                <h3 className="font-serif text-lg font-bold">Add Media</h3>
                <p className="text-[11px] text-muted-foreground">Select an existing image or upload a new one to insert into the editor</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border bg-background/50 px-6 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                  activeTab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Upload Files
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition cursor-pointer ${
                  activeTab === 'library' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Media Library
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-background/30">
              {activeTab === 'upload' ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-card/50 p-8 space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Upload size={32} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold">Drag and drop file here</p>
                    <p className="text-xs text-muted-foreground">or click below to browse</p>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadMedia}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 btn-luxury rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      {uploading ? 'Uploading...' : 'Select File'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col space-y-4">
                  {/* Search Toolbar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search media files by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-card border border-border rounded pl-9 pr-3 py-2.5 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Media Grid */}
                  <div className="flex-1 min-h-[300px]">
                    {loadingMedia ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Loading media library files...
                      </div>
                    ) : filteredMedia.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        No media files found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {filteredMedia.map((item) => {
                          const isSelected = selectedMediaUrl === item.url;
                          return (
                            <button
                              key={item.path}
                              type="button"
                              onClick={() => setSelectedMediaUrl(item.url)}
                              className={`relative aspect-square border rounded-lg overflow-hidden bg-card hover:opacity-95 transition flex flex-col items-center justify-center ${
                                isSelected ? 'border-primary ring-2 ring-primary/40' : 'border-border'
                              }`}
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 text-primary bg-background rounded-full">
                                  <CheckCircle size={16} fill="currentColor" className="text-background fill-primary" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 bg-background flex items-center justify-between">
              <div className="text-xs text-muted-foreground truncate max-w-md">
                {selectedMediaUrl ? `Selected: ${selectedMediaUrl.split('/').pop()}` : 'No image selected'}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-4 py-2 border border-border rounded text-xs hover:bg-accent cursor-pointer text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  disabled={!selectedMediaUrl}
                  className={`px-5 py-2 rounded text-xs font-semibold uppercase tracking-wider ${
                    selectedMediaUrl
                      ? 'btn-luxury cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  Insert into Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
