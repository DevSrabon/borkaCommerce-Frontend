'use client';

import { API_BASE_URL } from '@/config/api';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  Image as ImageIcon,
  Upload,
  X,
  Search,
  CheckCircle,
  Video,
  Globe,
  Clipboard,
  Heading1,
  Heading2,
  Heading3,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });
import 'jodit/es2021/jodit.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
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
  placeholder = 'Start writing your content...',
  minHeight = 350,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const token = useSelector((state: RootState) => state.auth.token);

  // Modal State
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [modalTab, setModalTab] = useState<'library' | 'upload' | 'url' | 'video'>('library');

  // Library State
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  // Debounce media search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Web Image State
  const [webImageUrl, setWebImageUrl] = useState('');
  const [webImageAlt, setWebImageAlt] = useState('');
  const [webImageWidth, setWebImageWidth] = useState<'100%' | '75%' | '50%' | '25%'>('100%');
  const [webImageAlign, setWebImageAlign] = useState<'none' | 'center' | 'left' | 'right'>('center');

  // Video Embed State
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');

  // Clipboard Notification
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<any>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const caretPositionRef = useRef<{
    blockIndex: number;
    container: Node | null;
    offset: number;
  }>({
    blockIndex: -1,
    container: null,
    offset: 0,
  });

  const createCursorMarker = () => {
    const marker = document.createElement('span');
    marker.className = 'borka-cursor-marker';
    marker.id = 'borka-cursor-marker';
    marker.setAttribute('data-cursor-marker', 'true');
    marker.style.cssText = 'display:inline-block;width:0px;height:0px;line-height:0;overflow:hidden;vertical-align:baseline;';
    marker.innerHTML = '&#xfeff;';
    return marker;
  };

  const updateCaretPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const wysiwyg = editorContainerRef.current?.querySelector('.jodit-wysiwyg') as HTMLElement | null;
    if (!wysiwyg) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // Only record if selection is STRICTLY inside .jodit-wysiwyg!
    if (!wysiwyg.contains(range.commonAncestorContainer)) return;

    try {
      savedRangeRef.current = range.cloneRange();
    } catch (_) {}

    // Identify parent block child in wysiwyg
    let block: HTMLElement | null = null;
    let curr: Node | null = range.startContainer;
    while (curr && curr !== wysiwyg) {
      if (curr.nodeType === Node.ELEMENT_NODE && curr.parentElement === wysiwyg) {
        block = curr as HTMLElement;
        break;
      }
      curr = curr.parentNode;
    }

    const children = Array.from(wysiwyg.children);
    const blockIndex = block ? children.indexOf(block) : -1;

    caretPositionRef.current = {
      blockIndex,
      container: range.startContainer,
      offset: range.startOffset,
    };
  }, []);

  // Continuously track mouse/keyboard cursor position inside editor
  useEffect(() => {
    const handleSelectionChange = () => {
      updateCaretPosition();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateCaretPosition]);

  // Safe method to read current HTML content without crashing on destroyed Jodit instance
  const getEditorContent = useCallback((): string => {
    const editor = editorRef.current;
    if (editor && !editor.isDestructed) {
      try {
        if (typeof editor.getEditorValue === 'function') {
          return editor.getEditorValue();
        }
        if (editor.value !== undefined) {
          return editor.value;
        }
      } catch (_) {}
    }
    if (editorContainerRef.current) {
      const wysiwyg = editorContainerRef.current.querySelector('.jodit-wysiwyg') as HTMLElement | null;
      if (wysiwyg) {
        return wysiwyg.innerHTML;
      }
    }
    return value || '';
  }, [value]);

  // Fetch Media Library
  const fetchMedia = useCallback(async () => {
    if (!token) return;
    setLoadingMedia(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/media`, {
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
  }, [token]);

  const handleMediaButtonMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    updateCaretPosition();
    if (editorRef.current && !editorRef.current.isDestructed) {
      try {
        editorRef.current.s.save();
      } catch (_) {}
    }
  };

  const handleCloseModal = () => {
    if (editorContainerRef.current) {
      const wysiwyg = editorContainerRef.current.querySelector('.jodit-wysiwyg');
      if (wysiwyg) {
        wysiwyg.querySelectorAll('.borka-cursor-marker, #borka-cursor-marker, [data-cursor-marker="true"]').forEach((el) => el.remove());
        onChangeRef.current(getEditorContent());
      }
    }
    setShowMediaModal(false);
    setSelectedMediaUrl(null);
  };

  const openMediaModal = (tab: 'library' | 'upload' | 'url' | 'video' = 'library') => {
    updateCaretPosition();

    // 1. Tell Jodit to save selection markers in the DOM
    if (editorRef.current && !editorRef.current.isDestructed) {
      try {
        editorRef.current.s.save();
      } catch (_) {}
    }

    const wysiwyg = editorContainerRef.current?.querySelector('.jodit-wysiwyg') as HTMLElement | null;

    if (wysiwyg) {
      // 2. Remove previous custom markers
      wysiwyg.querySelectorAll('.borka-cursor-marker, #borka-cursor-marker, [data-cursor-marker="true"]').forEach((el) => el.remove());

      let markerInserted = false;

      // 3. Check active window selection
      if (typeof window !== 'undefined') {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (wysiwyg.contains(range.commonAncestorContainer)) {
            try {
              const marker = createCursorMarker();
              range.insertNode(marker);
              savedRangeRef.current = range.cloneRange();
              markerInserted = true;
            } catch (_) {}
          }
        }
      }

      // 4. If not inserted, check savedRangeRef
      if (!markerInserted && savedRangeRef.current) {
        try {
          if (wysiwyg.contains(savedRangeRef.current.commonAncestorContainer) && savedRangeRef.current.commonAncestorContainer.isConnected) {
            const marker = createCursorMarker();
            savedRangeRef.current.insertNode(marker);
            markerInserted = true;
          }
        } catch (_) {}
      }

      // 5. If not inserted, check blockIndex
      if (!markerInserted && caretPositionRef.current && caretPositionRef.current.blockIndex >= 0) {
        const blocks = Array.from(wysiwyg.children);
        const targetBlock = blocks[caretPositionRef.current.blockIndex];
        if (targetBlock) {
          const marker = createCursorMarker();
          targetBlock.appendChild(marker);
          markerInserted = true;
        }
      }

      // 6. Only if marker was NEVER inserted (fresh editor with no focus history)
      if (!markerInserted) {
        const marker = createCursorMarker();
        if (wysiwyg.lastElementChild) {
          wysiwyg.lastElementChild.appendChild(marker);
        } else {
          wysiwyg.appendChild(marker);
        }
      }
    }

    setModalTab(tab);
    setShowMediaModal(true);
  };

  useEffect(() => {
    if (showMediaModal && modalTab === 'library') {
      fetchMedia();
    }
  }, [showMediaModal, modalTab, fetchMedia]);

  // Upload handler
  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', files[0]);

      const res = await fetch(`${API_BASE_URL}/admin/media/upload?folder=product`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedMediaUrl(data.imageUrl);
        setModalTab('library');
        fetchMedia();
      }
    } catch (err) {
      console.error('Media upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Helper to insert HTML at exact cursor position
  const insertHtmlAtCursor = (htmlSnippet: string) => {
    const wysiwyg = editorContainerRef.current?.querySelector('.jodit-wysiwyg') as HTMLElement | null;
    let inserted = false;

    // 1. First priority: Jodit native selection restore & insertHTML
    const editor = editorRef.current;
    if (editor && !editor.isDestructed) {
      try {
        if (editor.s?.hasMarkers) {
          editor.s.restore();
          editor.s.insertHTML(htmlSnippet);
          inserted = true;
        }
      } catch (err) {
        console.warn('Jodit native selection restore failed, falling back to DOM marker', err);
      }
    }

    // 2. Second priority: Exact DOM cursor marker placed when modal opened
    if (!inserted && wysiwyg) {
      const marker = wysiwyg.querySelector('#borka-cursor-marker, .borka-cursor-marker, [data-cursor-marker="true"]');
      if (marker && marker.parentNode) {
        const parentBlock = marker.closest('p, h1, h2, h3, h4, h5, h6, blockquote, li');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlSnippet;
        const frag = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          frag.appendChild(tempDiv.firstChild);
        }

        if (parentBlock && parentBlock.parentNode && parentBlock.contains(marker)) {
          const rawText = parentBlock.textContent?.replace(/\uFEFF/g, '').trim();
          const isPracticallyEmpty = !rawText && parentBlock.children.length <= 1;

          if (isPracticallyEmpty) {
            // Replace the empty block with the new content
            parentBlock.parentNode.replaceChild(frag, parentBlock);
          } else {
            // Split the block cleanly at the marker position
            const range = document.createRange();
            range.setStart(parentBlock, 0);
            range.setEndBefore(marker);
            const beforeContent = range.cloneContents();

            range.setStartAfter(marker);
            range.setEndAfter(parentBlock.lastChild || marker);
            const afterContent = range.cloneContents();

            const newBefore = document.createElement(parentBlock.tagName);
            Array.from(parentBlock.attributes).forEach((a) => newBefore.setAttribute(a.name, a.value));
            newBefore.appendChild(beforeContent);

            const newAfter = document.createElement(parentBlock.tagName);
            Array.from(parentBlock.attributes).forEach((a) => newAfter.setAttribute(a.name, a.value));
            newAfter.appendChild(afterContent);

            const container = parentBlock.parentNode;
            container.insertBefore(newBefore, parentBlock);
            container.insertBefore(frag, parentBlock);
            container.insertBefore(newAfter, parentBlock);
            parentBlock.remove();
          }
        } else {
          marker.parentNode.insertBefore(frag, marker);
          marker.remove();
        }
        inserted = true;
      }
    }

    // 3. Third priority: Target block index
    if (!inserted && wysiwyg && caretPositionRef.current && caretPositionRef.current.blockIndex >= 0) {
      const blocks = Array.from(wysiwyg.children);
      const targetBlock = blocks[caretPositionRef.current.blockIndex];
      if (targetBlock && targetBlock.parentNode) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlSnippet;
        const frag = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          frag.appendChild(tempDiv.firstChild);
        }
        targetBlock.parentNode.insertBefore(frag, targetBlock.nextSibling);
        inserted = true;
      }
    }

    // 4. Fourth priority: Browser native range snapshot
    if (!inserted && savedRangeRef.current && wysiwyg) {
      try {
        const range = savedRangeRef.current;
        if (wysiwyg.contains(range.commonAncestorContainer) && range.commonAncestorContainer.isConnected) {
          range.deleteContents();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlSnippet;
          const frag = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            frag.appendChild(tempDiv.firstChild);
          }
          range.insertNode(frag);
          inserted = true;
        }
      } catch (err) {
        console.warn('Native DOM range insertion fallback failed', err);
      }
    }

    // 5. Fallback: Append to the END (bottom) of the document if empty
    if (!inserted) {
      if (wysiwyg) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlSnippet;
        while (tempDiv.firstChild) {
          wysiwyg.appendChild(tempDiv.firstChild);
        }
        inserted = true;
      } else {
        onChangeRef.current((value || '') + htmlSnippet);
        return;
      }
    }

    // Remove any remaining cursor markers
    if (wysiwyg) {
      wysiwyg.querySelectorAll('.borka-cursor-marker, #borka-cursor-marker, [data-cursor-marker="true"]').forEach((el) => el.remove());
    }

    // Retrieve fresh HTML and sync
    const updatedHtml = wysiwyg ? wysiwyg.innerHTML : getEditorContent();
    onChangeRef.current(updatedHtml);

    if (editorRef.current && !editorRef.current.isDestructed) {
      try {
        if (typeof editorRef.current.setEditorValue === 'function') {
          editorRef.current.setEditorValue(updatedHtml);
        } else {
          editorRef.current.value = updatedHtml;
        }
      } catch (_) {}
    }
  };

  // Insert Library Image
  const handleInsertLibraryImage = () => {
    if (!selectedMediaUrl) return;
    const imgHtml = `<p style="text-align:center;"><img src="${selectedMediaUrl}" style="max-width:100%;height:auto;border-radius:8px;margin:12px auto;display:inline-block;" alt="Media Image" /></p><p></p>`;
    insertHtmlAtCursor(imgHtml);
    setShowMediaModal(false);
    setSelectedMediaUrl(null);
  };

  // Insert Web Image from URL
  const handleInsertWebImage = () => {
    if (!webImageUrl.trim()) return;

    let alignStyle = 'display:inline-block;';
    let wrapperStyle = '';
    if (webImageAlign === 'center') {
      wrapperStyle = 'text-align:center;';
      alignStyle = 'margin:12px auto;display:inline-block;';
    } else if (webImageAlign === 'left') {
      alignStyle = 'float:left;margin:0 16px 12px 0;';
    } else if (webImageAlign === 'right') {
      alignStyle = 'float:right;margin:0 0 12px 16px;';
    }

    const imgHtml = `<p style="${wrapperStyle}"><img src="${webImageUrl.trim()}" style="max-width:${webImageWidth};height:auto;border-radius:8px;${alignStyle}" alt="${webImageAlt.trim() || 'Image'}" /></p><p></p>`;
    insertHtmlAtCursor(imgHtml);
    setShowMediaModal(false);
    setWebImageUrl('');
    setWebImageAlt('');
  };

  // Insert Video Embed
  const handleInsertVideo = () => {
    if (!videoUrl.trim()) return;

    const url = videoUrl.trim();
    let embedHtml = '';

    // YouTube Match
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    // Vimeo Match
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)/);

    if (ytMatch) {
      embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin:16px 0;box-shadow:0 4px 12px rgba(0,0,0,0.15);"><iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&color=white" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p></p>`;
    } else if (vimeoMatch) {
      embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin:16px 0;box-shadow:0 4px 12px rgba(0,0,0,0.15);"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div><p></p>`;
    } else if (url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
      embedHtml = `<p style="text-align:center;"><video src="${url}" controls style="max-width:100%;border-radius:10px;margin:16px auto;display:block;"></video></p><p></p>`;
    } else {
      // General responsive iframe fallback
      embedHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:10px;margin:16px 0;"><iframe src="${url}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div><p></p>`;
    }

    if (videoCaption.trim()) {
      embedHtml += `<p style="text-align:center;font-size:12px;color:#888;margin-top:-8px;font-style:italic;">${videoCaption.trim()}</p><p></p>`;
    }

    insertHtmlAtCursor(embedHtml);
    setShowMediaModal(false);
    setVideoUrl('');
    setVideoCaption('');
  };

  // Clipboard Paste Helper
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setPasteNotice('Clipboard is empty');
        setTimeout(() => setPasteNotice(null), 2500);
        return;
      }

      // Convert line breaks to paragraphs/br
      const formatted = text.includes('\n')
        ? text.split('\n').map((line) => line.trim() ? `<p>${line}</p>` : '<br/>').join('')
        : text;

      insertHtmlAtCursor(formatted);
      setPasteNotice('Successfully pasted from clipboard!');
      setTimeout(() => setPasteNotice(null), 2500);
    } catch (err) {
      setPasteNotice('Please press Ctrl+V to paste directly into editor');
      setTimeout(() => setPasteNotice(null), 3500);
    }
  };

  // Quick Format Helpers
  const applyFormatBlock = (tag: 'p' | 'h1' | 'h2' | 'h3' | 'h4') => {
    if (editorRef.current && !editorRef.current.isDestructed) {
      try {
        editorRef.current.focus();
        editorRef.current.execCommand('formatBlock', false, tag);
        onChangeRef.current(getEditorContent());
      } catch (_) {}
    }
  };

  // Filtered media by debounced search query
  const filteredMedia = useMemo(() => {
    if (!debouncedSearchQuery) return mediaList;
    return mediaList.filter((item) =>
      item.name.toLowerCase().includes(debouncedSearchQuery)
    );
  }, [mediaList, debouncedSearchQuery]);

  // Jodit Configuration (Always Light Mode)
  const config = useMemo(() => {
    return {
      readonly: false,
      theme: 'default',
      placeholder,
      minHeight,
      toolbarAdaptive: false,
      toolbarSticky: false,
      // Comprehensive image properties dialog settings
      image: {
        openOnDblClick: true,
        editSrc: true,
        editTitle: true,
        editAlt: true,
        editLink: true,
        editSize: true,
        editMargins: true,
        editBorderRadius: true,
        editStyle: true,
        editAlign: true,
        showPreview: true,
        selectImageAfterClose: true,
      },
      // Robust copy-paste configuration
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_as_html',
      defaultActionOnPasteFromWord: 'insert_as_html',
      processPasteHTML: true,
      processPasteFromWord: true,
      cleanHTML: {
        fillEmptyParagraph: false,
        replaceOldTags: false,
      },
      toolbarButtonSize: 'middle',
      // Buttons array with typography, headings, font sizes, media, and copy-paste
      buttons: [
        'source', '|',
        'paragraph', 'font', 'fontsize', 'brush', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'superscript', 'subscript', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', 'align', '|',
        'cut', 'copy', 'paste', 'selectall', '|',
        'table', 'link', 'image', 'video', '|',
        'hr', 'eraser', 'undo', 'redo', 'fullsize',
      ],
      controls: {
        paragraph: {
          list: {
            p: 'Paragraph (Normal Text)',
            h1: 'Heading 1 (Hero / 36px)',
            h2: 'Heading 2 (Section / 28px)',
            h3: 'Heading 3 (Subsection / 22px)',
            h4: 'Heading 4 (Minor / 18px)',
            h5: 'Heading 5 (16px)',
            h6: 'Heading 6 (14px)',
            blockquote: 'Blockquote / Quote',
            pre: 'Code Block (Pre)',
          },
        },
        fontsize: {
          list: [
            '10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '42', '48', '64',
          ],
        },
        font: {
          list: {
            'Playfair Display, serif': 'Playfair Luxury Serif',
            'Cinzel, serif': 'Cinzel Royal',
            'Inter, sans-serif': 'Inter Modern',
            'system-ui, sans-serif': 'System UI',
            'Georgia, serif': 'Georgia',
            'Arial, sans-serif': 'Arial',
            'Courier New, monospace': 'Monospace',
          },
        },
        image: {
          icon: 'image',
          tooltip: 'Insert Media (Library / Upload / URL)',
          exec: (editorInstance: any) => {
            editorRef.current = editorInstance;
            updateCaretPosition();
            try {
              editorInstance.s?.save();
            } catch (_) {}
            openMediaModal('library');
          },
        },
        video: {
          icon: 'video',
          tooltip: 'Embed Video (YouTube / Vimeo / MP4)',
          exec: (editorInstance: any) => {
            editorRef.current = editorInstance;
            updateCaretPosition();
            try {
              editorInstance.s?.save();
            } catch (_) {}
            openMediaModal('video');
          },
        },
      },
      extraButtons: [
        {
          name: 'mediaLibraryBtn',
          icon: 'image',
          tooltip: 'Insert Media (Library / Upload / URL)',
          exec: (editorInstance: any) => {
            editorRef.current = editorInstance;
            updateCaretPosition();
            try {
              editorInstance.s?.save();
            } catch (_) {}
            openMediaModal('library');
          },
        },
        {
          name: 'embedVideoBtn',
          icon: 'video',
          tooltip: 'Embed Video (YouTube / Vimeo / MP4)',
          exec: (editorInstance: any) => {
            editorRef.current = editorInstance;
            updateCaretPosition();
            try {
              editorInstance.s?.save();
            } catch (_) {}
            openMediaModal('video');
          },
        },
      ],
      events: {
        afterPaste: () => {
          onChangeRef.current(getEditorContent());
        },
        changeSelection: () => {
          updateCaretPosition();
        },
        click: () => {
          updateCaretPosition();
        },
        keyup: () => {
          updateCaretPosition();
        },
        focus: () => {
          updateCaretPosition();
        },
      },
    };
  }, [placeholder, minHeight, getEditorContent, updateCaretPosition]);

  return (
    <div className="relative w-full space-y-2 text-foreground">
      {/* Top Helper Toolbar: Media, Video, Headings, Paste */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-card border border-border rounded-lg text-xs shadow-xs">
        {/* Left: Media Options & Paste */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onMouseDown={handleMediaButtonMouseDown}
            onClick={() => openMediaModal('library')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold rounded-md border border-border bg-background hover:bg-accent text-foreground hover:text-primary transition cursor-pointer"
            title="Browse Media Library"
          >
            <ImageIcon size={14} className="text-primary" />
            <span>Media Library</span>
          </button>

          <button
            type="button"
            onMouseDown={handleMediaButtonMouseDown}
            onClick={() => openMediaModal('video')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold rounded-md border border-border bg-background hover:bg-accent text-foreground hover:text-primary transition cursor-pointer"
            title="Embed YouTube, Vimeo or MP4 Video"
          >
            <Video size={14} className="text-amber-500" />
            <span>Embed Video</span>
          </button>

          <button
            type="button"
            onMouseDown={handleMediaButtonMouseDown}
            onClick={() => openMediaModal('url')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold rounded-md border border-border bg-background hover:bg-accent text-foreground hover:text-primary transition cursor-pointer"
            title="Insert Image from Web URL"
          >
            <Globe size={14} className="text-blue-500" />
            <span>Image URL</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePasteClipboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold rounded-md border border-border bg-background hover:bg-accent text-foreground hover:text-primary transition cursor-pointer"
            title="Paste text directly from clipboard"
          >
            <Clipboard size={14} className="text-emerald-500" />
            <span>Paste Clipboard</span>
          </button>

          {pasteNotice && (
            <span className="text-xs font-semibold text-primary animate-in fade-in px-2 py-0.5 rounded bg-primary/10">
              {pasteNotice}
            </span>
          )}
        </div>

        {/* Right: Quick Heading Selector Pills */}
        <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-md border border-border">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormatBlock('h1')}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-accent text-foreground transition cursor-pointer font-serif"
            title="Format selection as Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormatBlock('h2')}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-accent text-foreground transition cursor-pointer font-serif"
            title="Format selection as Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormatBlock('h3')}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-accent text-foreground transition cursor-pointer font-serif"
            title="Format selection as Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormatBlock('p')}
            className="px-2 py-1 rounded text-xs font-medium hover:bg-accent text-foreground transition cursor-pointer"
            title="Format selection as Paragraph"
          >
            P
          </button>
        </div>
      </div>

      {/* Editor Container - Always Light Mode */}
      <div ref={editorContainerRef} className="border border-border rounded-lg overflow-hidden bg-white text-zinc-900 shadow-sm jodit-always-light">
        <JoditEditor
          ref={editorRef}
          value={value}
          config={config as any}
          onBlur={(newContent) => onChangeRef.current(newContent)}
          onChange={(newContent) => {
            if (newContent !== value) {
              onChangeRef.current(newContent);
            }
          }}
          editorRef={(instance: any) => {
            editorRef.current = instance;
          }}
        />
      </div>

      {/* WordPress-like Media Dialog Modal (With Tabs: Library, Upload, URL, Video) */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="relative bg-card border border-border w-full max-w-4xl h-[88vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Media &amp; Embed Manager
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select server media, upload images, enter web links, or embed responsive videos
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border bg-background/60 px-6 gap-6 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('library')}
                className={`py-3 flex items-center gap-1.5 border-b-2 uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  modalTab === 'library'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <ImageIcon size={14} />
                <span>Media Library</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('upload')}
                className={`py-3 flex items-center gap-1.5 border-b-2 uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  modalTab === 'upload'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload size={14} />
                <span>Upload Files</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('url')}
                className={`py-3 flex items-center gap-1.5 border-b-2 uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  modalTab === 'url'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe size={14} />
                <span>Image by URL</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('video')}
                className={`py-3 flex items-center gap-1.5 border-b-2 uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  modalTab === 'video'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Video size={14} />
                <span>Embed Video</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-background/30 text-xs">
              {/* TAB 1: MEDIA LIBRARY */}
              {modalTab === 'library' && (
                <div className="h-full flex flex-col space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search media files by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-[320px]">
                    {loadingMedia ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Loading media library files...
                      </div>
                    ) : filteredMedia.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground space-y-2">
                        <p>No media files found.</p>
                        <button
                          type="button"
                          onClick={() => setModalTab('upload')}
                          className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded font-semibold cursor-pointer"
                        >
                          Upload an Image Now
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
                        {filteredMedia.map((item) => {
                          const isSelected = selectedMediaUrl === item.url;
                          return (
                            <button
                              key={item.path}
                              type="button"
                              onClick={() => setSelectedMediaUrl(item.url)}
                              className={`relative aspect-square border rounded-lg overflow-hidden bg-card hover:opacity-95 transition flex flex-col items-center justify-center cursor-pointer ${
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
                                  <CheckCircle size={18} fill="currentColor" className="text-background fill-primary" />
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

              {/* TAB 2: UPLOAD FILES */}
              {modalTab === 'upload' && (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-card/50 p-8 space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full text-primary">
                    <Upload size={32} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-foreground">Drag and drop file here</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF up to 10MB</p>
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
                      className="px-5 py-2.5 btn-luxury rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-md"
                    >
                      {uploading ? 'Uploading to Server...' : 'Select File from Device'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: IMAGE BY URL */}
              {modalTab === 'url' && (
                <div className="max-w-xl mx-auto space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="block font-semibold">Image Web URL (HTTPS) *</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={webImageUrl}
                      onChange={(e) => setWebImageUrl(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold">Image Title / Alt Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Silk Chiffon Fabric Texture"
                      value={webImageAlt}
                      onChange={(e) => setWebImageAlt(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block font-semibold">Display Width</label>
                      <select
                        value={webImageWidth}
                        onChange={(e) => setWebImageWidth(e.target.value as any)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                      >
                        <option value="100%">100% (Full Width)</option>
                        <option value="75%">75% (Large)</option>
                        <option value="50%">50% (Medium)</option>
                        <option value="25%">25% (Small Thumbnail)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-semibold">Alignment</label>
                      <select
                        value={webImageAlign}
                        onChange={(e) => setWebImageAlign(e.target.value as any)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                      >
                        <option value="center">Centered Block</option>
                        <option value="left">Float Left (Wrap Text)</option>
                        <option value="right">Float Right (Wrap Text)</option>
                        <option value="none">Inline</option>
                      </select>
                    </div>
                  </div>

                  {webImageUrl.trim() && (
                    <div className="pt-2">
                      <label className="block font-semibold mb-1 text-muted-foreground">Preview:</label>
                      <div className="p-3 border border-border rounded-lg bg-card/60 flex justify-center">
                        <img
                          src={webImageUrl.trim()}
                          alt="Web preview"
                          className="max-h-48 rounded object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EMBED VIDEO */}
              {modalTab === 'video' && (
                <div className="max-w-xl mx-auto space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="block font-semibold">Video Link (YouTube, Vimeo, or MP4) *</label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                    />
                    <span className="text-xs text-muted-foreground block">
                      Direct YouTube &amp; Vimeo links are automatically transformed into responsive 16:9 players.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-semibold">Video Caption (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Behind the scenes at our Dubai atelier"
                      value={videoCaption}
                      onChange={(e) => setVideoCaption(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  </div>

                  {videoUrl.trim() && (
                    <div className="pt-2">
                      <label className="block font-semibold mb-1 text-muted-foreground">Video Preview:</label>
                      <div className="p-3 border border-border rounded-lg bg-card/60">
                        {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                          <div className="aspect-video w-full rounded overflow-hidden">
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1] || ''}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&color=white`}
                              className="w-full h-full border-0"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4 font-mono text-xs truncate">
                            Target Video URL: {videoUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 bg-background flex items-center justify-between">
              <div className="text-xs text-muted-foreground truncate max-w-md">
                {modalTab === 'library' && (selectedMediaUrl ? `Selected: ${selectedMediaUrl.split('/').pop()}` : 'No image selected')}
                {modalTab === 'url' && (webImageUrl ? 'Ready to insert web image' : 'Enter image URL above')}
                {modalTab === 'video' && (videoUrl ? 'Ready to embed video' : 'Enter video URL above')}
                {modalTab === 'upload' && 'Upload files to insert'}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-border rounded-lg text-xs hover:bg-accent cursor-pointer text-foreground"
                >
                  Cancel
                </button>

                {modalTab === 'library' && (
                  <button
                    type="button"
                    onClick={handleInsertLibraryImage}
                    disabled={!selectedMediaUrl}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                      selectedMediaUrl
                        ? 'btn-luxury cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    Insert Selected Image
                  </button>
                )}

                {modalTab === 'url' && (
                  <button
                    type="button"
                    onClick={handleInsertWebImage}
                    disabled={!webImageUrl.trim()}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                      webImageUrl.trim()
                        ? 'btn-luxury cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    Insert Web Image
                  </button>
                )}

                {modalTab === 'video' && (
                  <button
                    type="button"
                    onClick={handleInsertVideo}
                    disabled={!videoUrl.trim()}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                      videoUrl.trim()
                        ? 'btn-luxury cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    }`}
                  >
                    Embed Video Player
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
