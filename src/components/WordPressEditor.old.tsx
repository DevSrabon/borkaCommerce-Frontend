'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { API_BASE_URL } from '@/config/api';
import {
  Image as ImageIcon,
  Upload,
  X,
  Search,
  CheckCircle2,
  Video,
  Globe,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Maximize2,
  Minimize2,
  Strikethrough,
  Minus,
  Palette,
  RotateCcw,
  RotateCw,
  HelpCircle,
  Table as TableIcon,
  ChevronDown,
  FileCode2,
  FileText,
  Eye,
  Trash2,
  ExternalLink,
  SplitSquareVertical,
  SlidersHorizontal,
  Code,
  Highlighter,
  Sliders,
} from 'lucide-react';

export interface WordPressEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

interface MediaItem {
  url: string;
  path: string;
  name: string;
  folder: string;
}

const WP_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Slate', hex: '#1e293b' },
  { name: 'Muted Slate', hex: '#64748b' },
  { name: 'Light Gray', hex: '#cbd5e1' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Royal Gold', hex: '#b89047' },
  { name: 'Deep Amber', hex: '#926605' },
  { name: 'Bright Amber', hex: '#d97706' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Forest Green', hex: '#15803d' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Royal Navy', hex: '#1d4ed8' },
  { name: 'Violet Purple', hex: '#7c3aed' },
];

const WP_BG_COLORS = [
  { name: 'Yellow Highlight', hex: '#fef08a' },
  { name: 'Gold Highlight', hex: '#fde68a' },
  { name: 'Emerald Highlight', hex: '#a7f3d0' },
  { name: 'Sky Highlight', hex: '#bae6fd' },
  { name: 'Rose Highlight', hex: '#fecdd3' },
  { name: 'Purple Highlight', hex: '#e9d5ff' },
  { name: 'Clear Background', hex: 'transparent' },
];

const SPECIAL_CHARS = [
  '©', '®', '™', '§', '¶', '•', '–', '—', '…', '‰', '′', '″',
  '€', '£', '¥', '₹', '$', '¢', '°', '±', '×', '÷', '≠', '≈',
  '≤', '≥', '«', '»', '←', '→', '↑', '↓', '↔', '↵', '✓', '★'
];

export default function WordPressEditor({
  value,
  onChange,
  placeholder = 'Start writing your content or paste from Word / web...',
  minHeight = 360,
  className = '',
}: WordPressEditorProps) {
  const [mode, setMode] = useState<'visual' | 'text'>('visual');
  const [showKitchenSink, setShowKitchenSink] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pasteAsPlainText, setPasteAsPlainText] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Current block formatting in visual editor (Paragraph, Heading 1, etc.)
  const [currentBlockFormat, setCurrentBlockFormat] = useState('Paragraph');

  // Dropdown states
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorTab, setActiveColorTab] = useState<'text' | 'bg'>('text');
  const [showSpecialChars, setShowSpecialChars] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Link Modal State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);

  // Media Modal State
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTab, setMediaTab] = useState<'library' | 'upload' | 'url' | 'video'>('library');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [searchMedia, setSearchMedia] = useState('');
  const [uploading, setUploading] = useState(false);

  // Image insertion options in modal
  const [imgAlt, setImgAlt] = useState('');
  const [imgCaption, setImgCaption] = useState('');
  const [imgAlign, setImgAlign] = useState<'none' | 'left' | 'center' | 'right'>('center');
  const [imgWidth, setImgWidth] = useState<'100%' | '75%' | '50%' | '25%'>('100%');
  const [webImgUrl, setWebImgUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Interactive Image Resizer inside Editor Canvas
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgCurrentWidth, setImgCurrentWidth] = useState<string>('100%');
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [overlayPos, setOverlayPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [customColor, setCustomColor] = useState('#b89047');

  // Table options
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const lastSavedRangeRef = useRef<Range | null>(null);
  const isInternalChangeRef = useRef(false);

  const token = useSelector((state: RootState) => (state as any).auth?.token);

  // Sync incoming value to visualRef when not typing internally
  useEffect(() => {
    if (visualRef.current && !isInternalChangeRef.current) {
      if (visualRef.current.innerHTML !== (value || '')) {
        visualRef.current.innerHTML = value || '';
      }
    }
    isInternalChangeRef.current = false;
  }, [value]);

  // Save selection before opening modals or dropdowns
  const saveSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (visualRef.current && visualRef.current.contains(range.commonAncestorContainer)) {
        lastSavedRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  // Restore selection
  const restoreSelection = useCallback(() => {
    if (typeof window === 'undefined') return;
    const range = lastSavedRangeRef.current;
    if (range && visualRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, []);

  // Handle content change in visual editor
  const handleVisualInput = useCallback(() => {
    if (!visualRef.current) return;
    isInternalChangeRef.current = true;
    const html = visualRef.current.innerHTML;
    onChange(html);
  }, [onChange]);

  // Update overlay position for selected image
  const updateOverlayPos = useCallback(() => {
    if (!selectedImg || !visualRef.current) {
      setOverlayPos(null);
      return;
    }
    const parent = visualRef.current.parentElement;
    if (!parent) return;

    const imgRect = selectedImg.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    setOverlayPos({
      top: imgRect.top - parentRect.top,
      left: imgRect.left - parentRect.left,
      width: imgRect.width,
      height: imgRect.height,
    });
  }, [selectedImg]);

  // Keep overlay pinned to image during scroll and resize
  useEffect(() => {
    const visualEl = visualRef.current;
    if (!visualEl) return;

    const onScroll = () => updateOverlayPos();
    const onResize = () => updateOverlayPos();

    visualEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      visualEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [updateOverlayPos]);

  // Update current block format state (H1, H2, H3, Paragraph...) based on cursor
  const updateCurrentFormat = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !visualRef.current) return;

    let node: Node | null = sel.anchorNode;
    while (node && node !== visualRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (tag === 'h1') { setCurrentBlockFormat('Heading 1'); return; }
        if (tag === 'h2') { setCurrentBlockFormat('Heading 2'); return; }
        if (tag === 'h3') { setCurrentBlockFormat('Heading 3'); return; }
        if (tag === 'h4') { setCurrentBlockFormat('Heading 4'); return; }
        if (tag === 'h5') { setCurrentBlockFormat('Heading 5'); return; }
        if (tag === 'h6') { setCurrentBlockFormat('Heading 6'); return; }
        if (tag === 'pre') { setCurrentBlockFormat('Preformatted'); return; }
        if (tag === 'blockquote') { setCurrentBlockFormat('Blockquote'); return; }
        if (tag === 'p') { setCurrentBlockFormat('Paragraph'); return; }
      }
      node = node.parentNode;
    }
    setCurrentBlockFormat('Paragraph');
  }, []);

  // Execute formatting command with styleWithCSS for pure inline styles
  const execCmd = (command: string, val: string | undefined = undefined) => {
    if (mode === 'text') return;
    visualRef.current?.focus();
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, true as any);
    } catch (_) {}
    document.execCommand(command, false, val);
    saveSelection();
    handleVisualInput();
    updateCurrentFormat();
  };

  // Bulletproof Format Block (Paragraph, H1, H2, H3, etc.)
  // Pure DOM manipulation — skips broken execCommand('formatBlock') which
  // behaves inconsistently across browsers and Tailwind v4 environments.
  const applyBlockFormat = (tag: string) => {
    setShowFormatDropdown(false);

    const sel = window.getSelection();
    if (!sel || !visualRef.current) return;

    // Restore saved range (toolbar click blurs the editor)
    const savedRange = lastSavedRangeRef.current;
    if (savedRange) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    visualRef.current.focus();

    const targetTag = tag.toLowerCase();

    // Get the current range after restoring
    if (sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // Walk up from anchor to find the nearest block-level element inside the editor
    let curr: Node | null = range.commonAncestorContainer;
    if (curr.nodeType === Node.TEXT_NODE) curr = curr.parentNode;

    let targetBlock: HTMLElement | null = null;
    while (curr && curr !== visualRef.current) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const el = curr as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'div', 'li'].includes(tagName)) {
          targetBlock = el;
          break;
        }
      }
      curr = curr.parentNode;
    }

    if (targetBlock && targetBlock !== visualRef.current) {
      const currentTagName = targetBlock.tagName.toLowerCase();
      // Toggle back to paragraph if clicking the same heading type
      const finalTag = currentTagName === targetTag ? 'p' : targetTag;
      const newEl = document.createElement(finalTag);
      newEl.innerHTML = targetBlock.innerHTML;
      // Preserve any inline styles on the block
      const style = targetBlock.getAttribute('style');
      if (style) newEl.setAttribute('style', style);
      targetBlock.parentNode?.replaceChild(newEl, targetBlock);

      // Select all content in new element so user can see it is active
      const newRange = document.createRange();
      newRange.selectNodeContents(newEl);
      sel.removeAllRanges();
      sel.addRange(newRange);
      lastSavedRangeRef.current = newRange.cloneRange();
    } else {
      // Bare text node directly inside the editor container — wrap it
      const newEl = document.createElement(targetTag);
      if (range.collapsed) {
        newEl.innerHTML = '<br>';
        visualRef.current.appendChild(newEl);
      } else {
        newEl.appendChild(range.extractContents());
        range.insertNode(newEl);
      }
      const newRange = document.createRange();
      newRange.selectNodeContents(newEl);
      sel.removeAllRanges();
      sel.addRange(newRange);
      lastSavedRangeRef.current = newRange.cloneRange();
    }

    handleVisualInput();
    updateCurrentFormat();
  };

  // Apply Vibrant Text Color
  const applyTextColor = (hex: string) => {
    setShowColorPicker(false);
    visualRef.current?.focus();
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, true as any);
    } catch (_) {}
    document.execCommand('foreColor', false, hex);
    saveSelection();
    handleVisualInput();
  };

  // Apply Background Highlight Color
  const applyBgColor = (hex: string) => {
    setShowColorPicker(false);
    visualRef.current?.focus();
    restoreSelection();
    try {
      document.execCommand('styleWithCSS', false, true as any);
    } catch (_) {}

    if (hex === 'transparent') {
      document.execCommand('removeFormat', false, undefined);
    } else {
      const ok = document.execCommand('hiliteColor', false, hex);
      if (!ok) {
        document.execCommand('backColor', false, hex);
      }
    }
    saveSelection();
    handleVisualInput();
  };

  // Upload and insert an image file directly
  const uploadAndInsertImage = async (file: File) => {
    if (!file) return;
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
        const url = data.url || (data.item && data.item.url);
        if (url) {
          visualRef.current?.focus();
          restoreSelection();
          const imgHtml = `
            <figure class="my-4 text-center">
              <img src="${url}" alt="Uploaded Image" class="rounded-lg shadow-sm mx-auto" style="width: 75%; max-width: 100%; height: auto;" />
              <figcaption class="text-xs text-muted-foreground mt-2 italic text-center"></figcaption>
            </figure><p><br></p>
          `;
          document.execCommand('insertHTML', false, imgHtml);
          handleVisualInput();
          return;
        }
      }
    } catch (err) {
      console.warn('Direct upload failed, using fallback:', err);
    }

    // Fallback: Read as base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        visualRef.current?.focus();
        restoreSelection();
        const imgHtml = `
          <figure class="my-4 text-center">
            <img src="${dataUrl}" alt="Inserted Image" class="rounded-lg shadow-sm mx-auto" style="width: 75%; max-width: 100%; height: auto;" />
          </figure><p><br></p>
        `;
        document.execCommand('insertHTML', false, imgHtml);
        handleVisualInput();
      }
    };
    reader.readAsDataURL(file);
  };

  // Clean and sanitize pasted content + support direct image paste + preserve inline styles and images
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // 1. Direct image paste from clipboard (e.g. screenshot or copied photo)
    const items = e.clipboardData.items ? Array.from(e.clipboardData.items) : [];
    const imageItems = items.filter((item) => item.type.startsWith('image/'));
    const files = e.clipboardData.files ? Array.from(e.clipboardData.files) : [];
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));

    // 2. Paste as plain text (if user explicitly toggled plain text mode)
    if (pasteAsPlainText) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
      handleVisualInput();
      return;
    }

    // 3. Pure image paste (no text/HTML, only image file or screenshot)
    let rawHtml = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');

    if ((!rawHtml && !plainText?.trim()) && (imageFiles.length > 0 || imageItems.length > 0)) {
      const fileToInsert = imageFiles[0] || (imageItems[0] ? imageItems[0].getAsFile() : null);
      if (fileToInsert) {
        e.preventDefault();
        uploadAndInsertImage(fileToInsert);
        return;
      }
    }

    // 4. If rawHtml is empty, check if plainText contains HTML markup (e.g. copied HTML source code)
    if (!rawHtml && plainText) {
      const trimmed = plainText.trim();
      const hasHtmlTags = /<([a-z][a-z0-9]*)\b[^>]*>/i.test(trimmed);
      if (hasHtmlTags) {
        rawHtml = trimmed;
      }
    }

    // 5. Rich HTML Paste — 100% preserve inline CSS, images, colors, typography, tables, and media
    if (rawHtml) {
      e.preventDefault();

      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      // Remove strictly dangerous execution tags only (scripts, meta, link, head)
      const removeTagNames = ['script', 'meta', 'link', 'head', 'xml'];
      removeTagNames.forEach((tag) => {
        try {
          Array.from(doc.getElementsByTagName(tag)).forEach((el) => el.remove());
        } catch {
          // ignore
        }
      });

      // Preserve images in Word XML or namespaces (e.g. <v:imagedata src="...">)
      doc.querySelectorAll('*').forEach((el) => {
        const tagLower = el.tagName.toLowerCase();

        // If it's a Word imagedata tag, convert to real img element so it isn't deleted
        if (tagLower.endsWith('imagedata') || tagLower === 'v:imagedata') {
          const src = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('o:title') || '';
          if (src) {
            const img = doc.createElement('img');
            img.setAttribute('src', src);
            img.setAttribute('alt', 'Pasted image');
            img.setAttribute('style', 'max-width: 100%; height: auto;');
            el.parentNode?.replaceChild(img, el);
            return;
          }
        }

        // Unwrap any XML/Office namespaced tags (e.g. o:p, w:r, v:shape) so children/images are NEVER deleted
        if (el.tagName.includes(':')) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) {
              parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
          }
          return;
        }

        // Remove MSO-specific class names only, keep all other custom classes
        if (el.getAttribute('class')?.match(/^Mso/)) {
          el.removeAttribute('class');
        }
        el.removeAttribute('lang');
        el.removeAttribute('xml:lang');

        // PRESERVE INLINE STYLES: Strip only mso-* internal properties, KEEP ALL real CSS
        // (color, background, font-size, font-family, font-weight, margin, padding, border, text-align, etc.)
        const style = el.getAttribute('style');
        if (style) {
          const cleaned = style
            .split(';')
            .map((s) => s.trim())
            .filter((s) => {
              if (!s) return false;
              const prop = s.split(':')[0].trim().toLowerCase();
              if (prop.startsWith('mso-') || prop.startsWith('-mso-') || prop === 'tab-stops') return false;
              return true;
            })
            .join('; ');
          if (cleaned) {
            el.setAttribute('style', cleaned);
          } else {
            el.removeAttribute('style');
          }
        }
      });

      // Convert legacy font tags to spans while preserving inline styles and attributes
      doc.querySelectorAll('font').forEach((font) => {
        const span = doc.createElement('span');
        const color = font.getAttribute('color');
        const face = font.getAttribute('face');
        const size = font.getAttribute('size');
        const existingStyle = font.getAttribute('style') || '';
        let styleStr = existingStyle ? (existingStyle.endsWith(';') ? existingStyle : existingStyle + '; ') : '';
        if (color && !styleStr.includes('color:')) styleStr += `color:${color}; `;
        if (face && !styleStr.includes('font-family:')) styleStr += `font-family:${face}; `;
        if (size && !styleStr.includes('font-size:')) {
          const px = [10, 13, 16, 18, 24, 32, 48][parseInt(size) - 1] || 16;
          styleStr += `font-size:${px}px; `;
        }
        if (styleStr) span.setAttribute('style', styleStr.trim());
        while (font.firstChild) span.appendChild(font.firstChild);
        font.parentNode?.replaceChild(span, font);
      });

      // Preserve iframes (YouTube, Vimeo, etc.)
      doc.querySelectorAll('iframe').forEach((iframe) => {
        const src = iframe.getAttribute('src') || '';
        if (src) {
          iframe.style.maxWidth = '100%';
          if (!iframe.getAttribute('width')) iframe.setAttribute('width', '100%');
          const wrapper = doc.createElement('div');
          wrapper.style.cssText = 'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1rem 0;';
          iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;';
          iframe.parentNode?.insertBefore(wrapper, iframe);
          wrapper.appendChild(iframe);
        }
      });

      // Ensure all images are preserved with proper responsive styling
      const allImgs = Array.from(doc.querySelectorAll('img'));
      allImgs.forEach((img) => {
        const existingStyle = img.getAttribute('style') || '';
        if (!existingStyle.includes('max-width')) {
          img.setAttribute('style', `max-width:100%;height:auto;${existingStyle ? ' ' + existingStyle : ''}`);
        }
      });

      // Check for file:// or blob: or broken local image URLs from Word/desktop
      const fileImgs = allImgs.filter((img) => {
        const src = img.getAttribute('src') || '';
        return src.startsWith('file:') || src.startsWith('blob:') || !src;
      });

      const availableFiles = imageFiles.length > 0 ? imageFiles : imageItems.map((it) => it.getAsFile()).filter(Boolean) as File[];

      const insertCleanedDOM = (finalHtml: string) => {
        let range: Range | null = null;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const curRange = sel.getRangeAt(0);
          if (visualRef.current && visualRef.current.contains(curRange.commonAncestorContainer)) {
            range = curRange;
          }
        }
        if (!range && lastSavedRangeRef.current && visualRef.current) {
          range = lastSavedRangeRef.current;
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }

        if (range) {
          range.deleteContents();
          const temp = document.createElement('div');
          temp.innerHTML = finalHtml;
          const fragment = document.createDocumentFragment();
          let lastNode: Node | null = null;
          while (temp.firstChild) {
            lastNode = temp.firstChild;
            fragment.appendChild(lastNode);
          }
          range.insertNode(fragment);

          if (lastNode && sel) {
            const newRange = document.createRange();
            newRange.setStartAfter(lastNode);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            lastSavedRangeRef.current = newRange.cloneRange();
          }
        } else if (visualRef.current) {
          // If no selection range, append directly into visual container
          const temp = document.createElement('div');
          temp.innerHTML = finalHtml;
          while (temp.firstChild) {
            visualRef.current.appendChild(temp.firstChild);
          }
        } else {
          document.execCommand('insertHTML', false, finalHtml);
        }

        handleVisualInput();
      };

      if (fileImgs.length > 0 && availableFiles.length > 0) {
        // Read available file(s) and replace src with base64 data URLs
        const readers = availableFiles.slice(0, fileImgs.length).map((file, idx) => {
          return new Promise<void>((resolve) => {
            const r = new FileReader();
            r.onload = () => {
              if (typeof r.result === 'string') {
                fileImgs[idx].setAttribute('src', r.result);
              }
              resolve();
            };
            r.onerror = () => resolve();
            r.readAsDataURL(file);
          });
        });

        Promise.all(readers).then(() => {
          const body = doc.body;
          const cleanedHtml = body ? body.innerHTML : rawHtml;
          insertCleanedDOM(cleanedHtml);
        });
        return;
      }

      // No file replacement needed: insert cleaned HTML with all styles and images preserved
      const body = doc.body;
      const cleanedHtml = body ? body.innerHTML : rawHtml;
      insertCleanedDOM(cleanedHtml);
      return;
    }

    // 6. Plain-text fallback (pure text without any HTML tags)
    if (plainText) {
      e.preventDefault();
      const lines = plainText.split(/\r?\n/);
      const asHtml = lines
        .map((line) =>
          line.trim()
            ? `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
            : '<p><br></p>'
        )
        .join('');
      document.execCommand('insertHTML', false, asHtml);
      handleVisualInput();
    }
  };

  // Drag and drop image files onto editor
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        uploadAndInsertImage(file);
      }
    }
  };

  // Keyboard Shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Escape...)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (selectedImg) {
        selectedImg.classList.remove('wp-selected-img');
        setSelectedImg(null);
        setOverlayPos(null);
      }
      setShowFormatDropdown(false);
      setShowColorPicker(false);
      setShowSpecialChars(false);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        execCmd('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        execCmd('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        execCmd('underline');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        openLinkModal();
      } else if (e.altKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        applyBlockFormat(`h${e.key}`);
      } else if (e.altKey && e.key === '0') {
        e.preventDefault();
        applyBlockFormat('p');
      }
    }
  };

  // Insert Link
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    visualRef.current?.focus();
    restoreSelection();

    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const textToDisplay = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}"${targetAttr} class="text-primary hover:underline font-medium">${textToDisplay}</a>`;

    document.execCommand('insertHTML', false, linkHtml);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    handleVisualInput();
  };

  // Open Link Modal with prefilled text
  const openLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      setLinkText(sel.toString().trim());
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    setShowLinkModal(true);
  };

  // Insert Read More divider
  const insertReadMore = () => {
    visualRef.current?.focus();
    restoreSelection();
    const readMoreHtml = `
      <div class="wp-more-tag my-4 py-2 border-y-2 border-dashed border-amber-500/70 text-center text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 select-none bg-amber-500/10" contenteditable="false">
        ─────── READ MORE TAG (<!--more-->) ───────
      </div><p><br></p>
    `;
    document.execCommand('insertHTML', false, readMoreHtml);
    handleVisualInput();
  };

  // Insert Table
  const insertTable = () => {
    visualRef.current?.focus();
    restoreSelection();

    let tableHtml = '<table class="w-full my-4 border-collapse border border-border text-sm">';
    if (tableHasHeader) {
      tableHtml += '<thead class="bg-muted/70"><tr>';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += `<th class="border border-border p-2.5 font-semibold text-left">Header ${c + 1}</th>`;
      }
      tableHtml += '</tr></thead>';
    }
    tableHtml += '<tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += '<td class="border border-border p-2.5">Cell</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';

    document.execCommand('insertHTML', false, tableHtml);
    setShowTableModal(false);
    handleVisualInput();
  };

  // Fetch Media List
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
      console.error('Failed to fetch media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Open Media Modal
  const openMediaModal = () => {
    saveSelection();
    setShowMediaModal(true);
    fetchMedia();
  };

  // Upload file to backend media API
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
        await fetchMedia();
        if (data.url) {
          setSelectedMedia({
            url: data.url,
            path: data.path || data.url,
            name: file.name,
            folder: 'blog',
          });
          setMediaTab('library');
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Insert Image into Visual Content
  const insertSelectedImage = () => {
    const url = mediaTab === 'url' ? webImgUrl.trim() : selectedMedia?.url;
    if (!url) return;

    visualRef.current?.focus();
    restoreSelection();

    let alignClass = 'mx-auto block';
    let containerClass = 'my-4 text-center';
    if (imgAlign === 'left') {
      alignClass = 'float-left mr-6 mb-4';
      containerClass = 'my-3 overflow-hidden';
    } else if (imgAlign === 'right') {
      alignClass = 'float-right ml-6 mb-4';
      containerClass = 'my-3 overflow-hidden';
    }

    const captionHtml = imgCaption.trim()
      ? `<figcaption class="text-xs text-muted-foreground mt-2 italic text-center">${imgCaption.trim()}</figcaption>`
      : '';

    const imageHtml = `
      <figure class="${containerClass}">
        <img src="${url}" alt="${imgAlt.trim() || 'Image'}" class="rounded-lg shadow-sm ${alignClass}" style="width: ${imgWidth}; max-width: 100%; height: auto;" />
        ${captionHtml}
      </figure>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, imageHtml);
    setShowMediaModal(false);
    setSelectedMedia(null);
    setWebImgUrl('');
    setImgCaption('');
    setImgAlt('');
    handleVisualInput();
  };

  // Insert Video Embed
  const insertVideoEmbed = () => {
    if (!videoUrl.trim()) return;
    visualRef.current?.focus();
    restoreSelection();

    let embedUrl = videoUrl.trim();
    if (embedUrl.includes('youtube.com/watch?v=')) {
      embedUrl = embedUrl.replace('watch?v=', 'embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'www.youtube.com/embed/');
    } else if (embedUrl.includes('vimeo.com/')) {
      embedUrl = embedUrl.replace('vimeo.com/', 'player.vimeo.com/video/');
    }

    const videoHtml = `
      <div class="my-6 aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-md">
        <iframe src="${embedUrl}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <p><br></p>
    `;

    document.execCommand('insertHTML', false, videoHtml);
    setShowMediaModal(false);
    setVideoUrl('');
    handleVisualInput();
  };

  // ─── Direct Image Selection & Interactive Drag Resizing ───────────────────
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target && target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      if (selectedImg && selectedImg !== img) {
        selectedImg.classList.remove('wp-selected-img');
      }

      img.classList.add('wp-selected-img');
      setSelectedImg(img);

      const widthStyle = img.style.width || img.getAttribute('width') || '100%';
      setImgCurrentWidth(widthStyle);
      setTimeout(updateOverlayPos, 15);
    } else {
      if (selectedImg) {
        selectedImg.classList.remove('wp-selected-img');
        setSelectedImg(null);
        setOverlayPos(null);
      }
    }

    updateCurrentFormat();
  };

  // Interactive mouse dragging resize handles (NW, NE, SE, SW)
  const handleResizeStart = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'se' | 'sw') => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImg || !visualRef.current) return;

    setIsDraggingHandle(true);
    const startX = e.clientX;
    const startWidth = selectedImg.offsetWidth;
    const editorWidth = visualRef.current.clientWidth - 48;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth;

      if (handle === 'se' || handle === 'ne') {
        newWidth = startWidth + deltaX;
      } else {
        newWidth = startWidth - deltaX;
      }

      newWidth = Math.max(60, Math.min(newWidth, editorWidth));
      const percent = Math.round((newWidth / editorWidth) * 100);

      selectedImg.style.width = `${Math.round(newWidth)}px`;
      selectedImg.style.maxWidth = '100%';
      selectedImg.style.height = 'auto';

      setImgCurrentWidth(`${percent}%`);
      updateOverlayPos();
    };

    const onMouseUp = () => {
      setIsDraggingHandle(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      updateOverlayPos();
      handleVisualInput();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Resize Selected Image to a preset percentage or pixel width
  const handleResizeImage = (widthStr: string) => {
    if (!selectedImg) return;
    selectedImg.style.width = widthStr;
    selectedImg.style.maxWidth = '100%';
    selectedImg.style.height = 'auto';
    setImgCurrentWidth(widthStr);
    setTimeout(updateOverlayPos, 15);
    handleVisualInput();
  };

  // Align Selected Image
  const handleAlignImage = (align: 'left' | 'center' | 'right' | 'none') => {
    if (!selectedImg) return;

    if (align === 'left') {
      selectedImg.style.float = 'left';
      selectedImg.style.margin = '0.5rem 1.5rem 1rem 0';
      selectedImg.style.display = 'inline';
    } else if (align === 'right') {
      selectedImg.style.float = 'right';
      selectedImg.style.margin = '0.5rem 0 1rem 1.5rem';
      selectedImg.style.display = 'inline';
    } else if (align === 'center') {
      selectedImg.style.float = 'none';
      selectedImg.style.margin = '1.25rem auto';
      selectedImg.style.display = 'block';
    } else {
      selectedImg.style.float = 'none';
      selectedImg.style.margin = '0.5rem';
      selectedImg.style.display = 'inline-block';
    }
    setTimeout(updateOverlayPos, 15);
    handleVisualInput();
  };

  // Delete Selected Image
  const handleDeleteSelectedImage = () => {
    if (!selectedImg) return;
    const parent = selectedImg.parentElement;
    if (parent && parent.tagName === 'FIGURE') {
      parent.remove();
    } else {
      selectedImg.remove();
    }
    setSelectedImg(null);
    setOverlayPos(null);
    handleVisualInput();
  };

  // Calculate word and character counts
  const getCounts = () => {
    if (typeof window === 'undefined') return { words: 0, chars: 0 };
    const temp = document.createElement('div');
    temp.innerHTML = value || '';
    const text = temp.textContent || temp.innerText || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { words, chars };
  };

  const { words, chars } = getCounts();

  return (
    <div
      ref={containerRef}
      className={`border border-border rounded-lg bg-card text-foreground flex flex-col shadow-xs transition relative ${
        isFullscreen ? 'fixed inset-0 z-9999 rounded-none h-screen w-screen bg-background' : ''
      } ${className}`}
    >
      {/* ─── Top WordPress Header Bar: Add Media + Visual/Text/Preview Tabs ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/80 text-xs sticky top-0 z-40 backdrop-blur-sm">
        {/* Left: Classic WordPress "Add Media" Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openMediaModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background hover:bg-card border border-border/90 rounded-md font-semibold text-foreground hover:text-primary transition shadow-2xs cursor-pointer text-xs"
          >
            <ImageIcon size={14} className="text-primary" />
            <span>Add Media</span>
          </button>

          {/* Live Preview Toggle */}
          {mode === 'visual' && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md font-semibold transition shadow-2xs cursor-pointer text-xs ${
                showPreview
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-card border-border/90 text-foreground hover:text-primary'
              }`}
              title="Toggle live preview side-by-side"
            >
              <SplitSquareVertical size={14} />
              <span>{showPreview ? 'Hide Preview' : 'Live Preview'}</span>
            </button>
          )}
        </div>

        {/* Right: Visual / Text Mode Tabs */}
        <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
          <button
            type="button"
            onClick={() => {
              if (mode === 'text' && visualRef.current) {
                visualRef.current.innerHTML = value || '';
              }
              setMode('visual');
            }}
            className={`px-3 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              mode === 'visual'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye size={12} />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('text'); setShowPreview(false); }}
            className={`px-3 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              mode === 'text'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code size={12} />
            <span>Text</span>
          </button>
        </div>
      </div>

      {/* ─── WordPress Classic Toolbar (Visible in Visual Mode) — STICKY ──── */}
      {mode === 'visual' && (
        <div className="bg-card/98 border-b border-border divide-y divide-border/60 sticky top-0 z-30 backdrop-blur-sm shadow-xs">
          {/* Toolbar Row 1 */}
          <div className="flex flex-wrap items-center gap-1 p-1.5 text-foreground">
            {/* Dynamic Paragraph / Headings dropdown (Shows current block format!) */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                className="px-2.5 py-1 text-xs bg-background border border-border rounded hover:bg-muted/60 transition flex items-center gap-1.5 cursor-pointer font-medium min-w-[95px] justify-between"
              >
                <span className="truncate">{currentBlockFormat}</span>
                <ChevronDown size={11} className="text-muted-foreground shrink-0" />
              </button>

              {showFormatDropdown && (
                <div
                  className="absolute left-0 top-full mt-1 w-44 bg-popover border border-border rounded-md shadow-lg py-1 z-50 text-xs"
                  onMouseLeave={() => setShowFormatDropdown(false)}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('p')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-normal cursor-pointer"
                  >
                    Paragraph
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('h1')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-serif font-bold text-lg cursor-pointer"
                  >
                    Heading 1
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('h2')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-serif font-bold text-base cursor-pointer"
                  >
                    Heading 2
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('h3')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-serif font-bold text-sm cursor-pointer"
                  >
                    Heading 3
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('h4')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-semibold text-xs cursor-pointer"
                  >
                    Heading 4
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('h5')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-semibold text-xs cursor-pointer"
                  >
                    Heading 5
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('h6')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-semibold text-xs text-muted-foreground cursor-pointer"
                  >
                    Heading 6
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyBlockFormat('pre')}
                    className="w-full text-left px-3 py-1.5 hover:bg-muted font-mono text-xs cursor-pointer border-t border-border mt-1"
                  >
                    Preformatted
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Bold */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('bold')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Bold (Ctrl+B)"
            >
              <Bold size={14} />
            </button>

            {/* Italic */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('italic')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Italic (Ctrl+I)"
            >
              <Italic size={14} />
            </button>

            {/* Underline */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('underline')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Underline (Ctrl+U)"
            >
              <span style={{ textDecoration: 'underline', fontWeight: 600, fontSize: 13, lineHeight: 1 }}>U</span>
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('strikeThrough')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough size={14} />
            </button>

            {/* Bullet List */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Bulleted list"
            >
              <List size={14} />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertOrderedList')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Numbered list"
            >
              <ListOrdered size={14} />
            </button>

            {/* Blockquote */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyBlockFormat('blockquote')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Blockquote"
            >
              <Quote size={14} />
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Alignments */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('justifyLeft')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Align left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('justifyCenter')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Align center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('justifyRight')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Align right"
            >
              <AlignRight size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('justifyFull')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Justify"
            >
              <AlignJustify size={14} />
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            {/* Insert / Edit Link */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onClick={openLinkModal}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Insert/edit link (Ctrl+K)"
            >
              <LinkIcon size={14} />
            </button>

            {/* Remove Link */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('unlink')}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Remove link"
            >
              <Unlink size={14} />
            </button>

            {/* Insert Read More Tag */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertReadMore}
              className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
              title="Insert Read More tag"
            >
              <SplitSquareVertical size={14} className="text-amber-600 dark:text-amber-400" />
            </button>

            {/* Toolbar Toggle (Kitchen Sink) */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowKitchenSink(!showKitchenSink)}
              className={`p-1.5 rounded hover:bg-muted/80 transition cursor-pointer ml-auto ${
                showKitchenSink ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
              title="Toolbar Toggle (Kitchen Sink)"
            >
              <SlidersHorizontal size={14} />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Toolbar Row 2 (Kitchen Sink) */}
          {showKitchenSink && (
            <div className="flex flex-wrap items-center gap-1 p-1.5 text-foreground bg-muted/10">
              {/* Strikethrough */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('strikeThrough')}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Strikethrough"
              >
                <Strikethrough size={14} />
              </button>

              {/* Horizontal line */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('insertHorizontalRule')}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Horizontal line"
              >
                <Minus size={14} />
              </button>

              {/* Color & Highlight Picker */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveSelection();
                  }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer flex items-center gap-1"
                  title="Text color & Highlights"
                >
                  <Palette size={14} className="text-primary" />
                  <ChevronDown size={10} className="text-muted-foreground" />
                </button>

                {showColorPicker && (
                  <div
                    className="absolute left-0 top-full mt-1 p-3 bg-popover border border-border rounded-xl shadow-xl z-50 w-64 space-y-3"
                    onMouseLeave={() => setShowColorPicker(false)}
                  >
                    <div className="flex border-b border-border pb-1 gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setActiveColorTab('text')}
                        className={`pb-1 border-b-2 cursor-pointer ${
                          activeColorTab === 'text' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                        }`}
                      >
                        Text Color
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setActiveColorTab('bg')}
                        className={`pb-1 border-b-2 cursor-pointer ${
                          activeColorTab === 'bg' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                        }`}
                      >
                        Highlight
                      </button>
                    </div>

                    {activeColorTab === 'text' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-1.5">
                          {WP_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyTextColor(c.hex)}
                              className="w-7 h-7 rounded border border-border/80 hover:scale-110 transition cursor-pointer shadow-2xs"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))}
                        </div>
                        {/* Custom Color Input */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                            title="Pick custom color"
                          />
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="flex-1 px-2 py-0.5 text-xs border border-border rounded bg-background font-mono text-center"
                            placeholder="#b89047"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyTextColor(customColor)}
                            className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded hover:opacity-90 cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          {WP_BG_COLORS.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyBgColor(c.hex)}
                              className="h-7 px-1.5 rounded border border-border/80 hover:scale-105 transition cursor-pointer text-[10px] font-medium truncate"
                              style={{ backgroundColor: c.hex === 'transparent' ? '#ffffff' : c.hex }}
                              title={c.name}
                            >
                              {c.name.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                        {/* Custom Highlight Input */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-7 h-7 rounded border border-border cursor-pointer p-0 bg-transparent shrink-0"
                            title="Pick custom highlight"
                          />
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="flex-1 px-2 py-0.5 text-xs border border-border rounded bg-background font-mono text-center"
                            placeholder="#fde68a"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyBgColor(customColor)}
                            className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded hover:opacity-90 cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Paste as plain text toggle */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPasteAsPlainText(!pasteAsPlainText)}
                className={`p-1.5 rounded transition cursor-pointer text-xs font-semibold px-2 flex items-center gap-1 ${
                  pasteAsPlainText
                    ? 'bg-amber-500 text-white'
                    : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                }`}
                title="Paste as text"
              >
                <FileText size={13} />
                <span>Text Paste</span>
              </button>

              {/* Clear Formatting */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('removeFormat')}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Clear formatting"
              >
                <Trash2 size={14} />
              </button>

              {/* Special Characters */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => setShowSpecialChars(!showSpecialChars)}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer font-serif text-xs font-bold px-2"
                title="Special character"
              >
                Ω
              </button>

              {/* Table Generator */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => setShowTableModal(true)}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Insert Table"
              >
                <TableIcon size={14} />
              </button>

              <div className="h-4 w-px bg-border mx-1" />

              {/* Indent / Outdent */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('outdent')}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Decrease indent"
              >
                <AlignLeft size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('indent')}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Increase indent"
              >
                <AlignRight size={14} />
              </button>

              <div className="h-4 w-px bg-border mx-1" />

              {/* Undo / Redo */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('undo')}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('redo')}
                className="p-1.5 rounded hover:bg-muted/80 text-foreground transition cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <RotateCw size={14} />
              </button>

              {/* Help modal */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition cursor-pointer ml-auto"
                title="Keyboard Shortcuts"
              >
                <HelpCircle size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── FLOATING IMAGE RESIZE & ALIGNMENT TOOLBAR (Shows when an image is selected!) ─── */}
      {selectedImg && mode === 'visual' && (
        <div className="sticky top-2 z-40 mx-auto bg-popover/95 border border-primary/40 rounded-xl shadow-2xl p-2.5 flex flex-wrap items-center gap-3 text-xs text-foreground backdrop-blur-md animate-fade-in w-fit max-w-[95%]">
          <span className="font-semibold text-primary flex items-center gap-1.5">
            <ImageIcon size={14} />
            <span>Image Size:</span>
          </span>

          {/* Width Presets */}
          <div className="flex items-center gap-1">
            {(['25%', '50%', '75%', '100%'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleResizeImage(w)}
                className={`px-2.5 py-1 rounded font-semibold text-xs transition cursor-pointer ${
                  imgCurrentWidth === w
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Width Slider */}
          <div className="flex items-center gap-1.5 pl-1">
            <input
              type="range"
              min="15"
              max="100"
              value={parseInt(imgCurrentWidth) || 100}
              onChange={(e) => handleResizeImage(`${e.target.value}%`)}
              className="w-20 accent-primary cursor-pointer"
              title="Drag slider to scale width"
            />
            <input
              type="text"
              value={imgCurrentWidth}
              onChange={(e) => handleResizeImage(e.target.value)}
              className="w-14 px-1.5 py-0.5 text-[11px] bg-background border border-border rounded text-center font-mono"
              title="Custom width (e.g. 60% or 450px)"
            />
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAlignImage('left')}
              className="p-1.5 rounded hover:bg-muted transition cursor-pointer"
              title="Float Left"
            >
              <AlignLeft size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAlignImage('center')}
              className="p-1.5 rounded hover:bg-muted transition cursor-pointer"
              title="Align Center"
            >
              <AlignCenter size={14} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAlignImage('right')}
              className="p-1.5 rounded hover:bg-muted transition cursor-pointer"
              title="Float Right"
            >
              <AlignRight size={14} />
            </button>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Delete Image */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleDeleteSelectedImage}
            className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition cursor-pointer flex items-center gap-1"
            title="Remove Image"
          >
            <Trash2 size={14} />
            <span className="font-medium text-xs">Delete</span>
          </button>
        </div>
      )}

      {/* ─── Editor Canvas Body ────────────────────────────────────────────── */}
      <div className={`flex-1 relative min-h-0 bg-background ${showPreview ? 'flex flex-row' : 'flex flex-col'}`}>
        {/* Interactive Corner Resize Handles Overlay */}
        {selectedImg && overlayPos && mode === 'visual' && (
          <div
            style={{
              position: 'absolute',
              top: `${overlayPos.top}px`,
              left: `${overlayPos.left}px`,
              width: `${overlayPos.width}px`,
              height: `${overlayPos.height}px`,
              pointerEvents: 'none',
            }}
            className="border-2 border-primary rounded-lg transition-all z-30"
          >
            {/* 4 Corner Resize Handles */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary border-2 border-white dark:border-black rounded-full shadow-md pointer-events-auto cursor-se-resize hover:scale-125 transition-transform"
              title="Drag corner to resize image"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary border-2 border-white dark:border-black rounded-full shadow-md pointer-events-auto cursor-sw-resize hover:scale-125 transition-transform"
              title="Drag corner to resize image"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              className="absolute -top-2 -right-2 w-4 h-4 bg-primary border-2 border-white dark:border-black rounded-full shadow-md pointer-events-auto cursor-ne-resize hover:scale-125 transition-transform"
              title="Drag corner to resize image"
            />
            <div
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              className="absolute -top-2 -left-2 w-4 h-4 bg-primary border-2 border-white dark:border-black rounded-full shadow-md pointer-events-auto cursor-nw-resize hover:scale-125 transition-transform"
              title="Drag corner to resize image"
            />

            {/* Live Dimension Badge */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-popover/95 text-foreground border border-border px-2.5 py-0.5 rounded-full text-[10px] font-mono shadow-md whitespace-nowrap pointer-events-none flex items-center gap-1.5 backdrop-blur-xs">
              <span>{Math.round(overlayPos.width)} × {Math.round(overlayPos.height)} px</span>
              <span className="text-primary font-bold">({imgCurrentWidth})</span>
            </div>
          </div>
        )}

        {mode === 'visual' ? (
          <>
            {/* Editor pane */}
            <div
              ref={visualRef}
              contentEditable
              onClick={handleEditorClick}
              onInput={handleVisualInput}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onKeyDown={handleKeyDown}
              onScroll={updateOverlayPos}
              onMouseUp={() => {
                saveSelection();
                updateCurrentFormat();
              }}
              onKeyUp={() => {
                saveSelection();
                updateCurrentFormat();
              }}
              style={{ minHeight: `${minHeight}px` }}
              data-placeholder={placeholder}
              className={`wp-editor-content p-6 focus:outline-none overflow-y-auto leading-relaxed max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none select-text ${
                showPreview ? 'w-1/2 border-r border-border/60' : 'flex-1'
              }`}
            />
            {/* Live Preview Pane */}
            {showPreview && (
              <div className="w-1/2 flex flex-col">
                <div className="px-4 py-2 bg-muted/30 border-b border-border/60 flex items-center gap-2">
                  <Eye size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Live Preview</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60">Read-only — auto-updates</span>
                </div>
                <div
                  className="wp-editor-content p-6 overflow-y-auto leading-relaxed max-w-none flex-1"
                  style={{ minHeight: `${minHeight}px` }}
                  dangerouslySetInnerHTML={{ __html: value || '<p class="text-muted-foreground text-sm">Start typing in the editor to see a preview...</p>' }}
                />
              </div>
            )}
          </>
        ) : (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type or paste raw HTML here..."
            style={{ minHeight: `${minHeight}px` }}
            className="flex-1 w-full p-4 font-mono text-xs leading-relaxed bg-background text-foreground border-none focus:outline-none resize-y"
          />
        )}
      </div>

      {/* ─── Bottom Status Bar: Word & Character Count ─────────────────────── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t border-border text-[11px] text-muted-foreground">
        <span>Word count: <strong className="text-foreground">{words}</strong> | Characters: <strong className="text-foreground">{chars}</strong></span>
        <span>WordPress Classic Engine</span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: ADD MEDIA (WordPress Media Library / Upload / URL / Video)
         ══════════════════════════════════════════════════════════════════════ */}
      {showMediaModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" />
                <h3 className="font-serif font-bold text-base">Add Media to Content</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border px-6 gap-6 text-xs font-semibold bg-background">
              <button
                type="button"
                onClick={() => setMediaTab('library')}
                className={`py-3 transition cursor-pointer border-b-2 ${
                  mediaTab === 'library'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Media Library
              </button>
              <button
                type="button"
                onClick={() => setMediaTab('upload')}
                className={`py-3 transition cursor-pointer border-b-2 ${
                  mediaTab === 'upload'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Upload Files
              </button>
              <button
                type="button"
                onClick={() => setMediaTab('url')}
                className={`py-3 transition cursor-pointer border-b-2 ${
                  mediaTab === 'url'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Insert from URL
              </button>
              <button
                type="button"
                onClick={() => setMediaTab('video')}
                className={`py-3 transition cursor-pointer border-b-2 ${
                  mediaTab === 'video'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Embed Video
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-[350px]">
              {/* Tab 1: Library */}
              {mediaTab === 'library' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative max-w-sm">
                    <input
                      type="text"
                      placeholder="Search media files..."
                      value={searchMedia}
                      onChange={(e) => setSearchMedia(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>

                  {loadingMedia ? (
                    <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
                      Loading media files from storage...
                    </div>
                  ) : mediaList.length === 0 ? (
                    <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                      <ImageIcon size={32} className="mx-auto text-muted-foreground/60" />
                      <p>No images found in your media library.</p>
                      <button
                        type="button"
                        onClick={() => setMediaTab('upload')}
                        className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Upload an Image
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[320px] overflow-y-auto p-1">
                      {mediaList
                        .filter((m) => m.name.toLowerCase().includes(searchMedia.toLowerCase()))
                        .map((item) => {
                          const isSelected = selectedMedia?.url === item.url;
                          return (
                            <div
                              key={item.url}
                              onClick={() => setSelectedMedia(item)}
                              className={`group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary/40 shadow-md'
                                  : 'border-border hover:border-primary/50 bg-muted/40'
                              }`}
                            >
                              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute top-1 right-1 p-0.5 rounded-full bg-primary text-primary-foreground shadow-xs">
                                  <CheckCircle2 size={14} />
                                </div>
                              )}
                              <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] truncate px-1 py-0.5">
                                {item.name}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Attachment Details row */}
                  {selectedMedia && (
                    <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-muted-foreground mb-1 font-medium">Alt Text</label>
                        <input
                          type="text"
                          value={imgAlt}
                          onChange={(e) => setImgAlt(e.target.value)}
                          placeholder="Describe image..."
                          className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-foreground mb-1 font-medium">Caption</label>
                        <input
                          type="text"
                          value={imgCaption}
                          onChange={(e) => setImgCaption(e.target.value)}
                          placeholder="Optional caption..."
                          className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-muted-foreground mb-1 font-medium">Alignment</label>
                        <select
                          value={imgAlign}
                          onChange={(e) => setImgAlign(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs"
                        >
                          <option value="none">None</option>
                          <option value="left">Left (Float)</option>
                          <option value="center">Center</option>
                          <option value="right">Right (Float)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-muted-foreground mb-1 font-medium">Size</label>
                        <select
                          value={imgWidth}
                          onChange={(e) => setImgWidth(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs"
                        >
                          <option value="100%">Full Width (100%)</option>
                          <option value="75%">Large (75%)</option>
                          <option value="50%">Medium (50%)</option>
                          <option value="25%">Thumbnail (25%)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Upload Files */}
              {mediaTab === 'upload' && (
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center space-y-4 bg-muted/20">
                  <Upload size={36} className="mx-auto text-primary" />
                  <div>
                    <h4 className="font-semibold text-sm">Drop files to upload</h4>
                    <p className="text-xs text-muted-foreground mt-1">or click below to browse from your device</p>
                  </div>
                  <label className="inline-block px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs cursor-pointer hover:bg-primary/90 transition shadow-xs">
                    {uploading ? 'Uploading Image...' : 'Select Files'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Tab 3: URL */}
              {mediaTab === 'url' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Image URL</label>
                    <input
                      type="url"
                      value={webImgUrl}
                      onChange={(e) => setWebImgUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {webImgUrl && (
                    <div className="aspect-video max-h-48 rounded-lg overflow-hidden border border-border bg-muted/40">
                      <img src={webImgUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1">Alt Text</label>
                      <input
                        type="text"
                        value={imgAlt}
                        onChange={(e) => setImgAlt(e.target.value)}
                        placeholder="Image description"
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Width</label>
                      <select
                        value={imgWidth}
                        onChange={(e) => setImgWidth(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-xs"
                      >
                        <option value="100%">100%</option>
                        <option value="75%">75%</option>
                        <option value="50%">50%</option>
                        <option value="25%">25%</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Embed Video */}
              {mediaTab === 'video' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Video URL (YouTube or Vimeo)</label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      Paste YouTube or Vimeo URL to automatically embed a responsive video player.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/30">
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted cursor-pointer transition"
              >
                Cancel
              </button>
              {mediaTab === 'video' ? (
                <button
                  type="button"
                  disabled={!videoUrl.trim()}
                  onClick={insertVideoEmbed}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Insert Video
                </button>
              ) : (
                <button
                  type="button"
                  disabled={mediaTab === 'url' ? !webImgUrl.trim() : !selectedMedia}
                  onClick={insertSelectedImage}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Insert into Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: INSERT / EDIT LINK
         ══════════════════════════════════════════════════════════════════════ */}
      {showLinkModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-5 space-y-4 text-foreground">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="font-serif font-bold text-sm flex items-center gap-1.5">
                <LinkIcon size={15} className="text-primary" />
                <span>Insert / Edit Link</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold mb-1">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Text to display"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:ring-1 focus:ring-primary"
                />
              </div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-xs">Open link in a new tab</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3.5 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!linkUrl.trim()}
                onClick={handleInsertLink}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3: INSERT TABLE
         ══════════════════════════════════════════════════════════════════════ */}
      {showTableModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4 text-foreground">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="font-serif font-bold text-sm flex items-center gap-1.5">
                <TableIcon size={15} className="text-primary" />
                <span>Insert Table</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={tableHasHeader}
                onChange={(e) => setTableHasHeader(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span>Include Header Row</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertTable}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DROPDOWN 4: SPECIAL CHARACTERS
         ══════════════════════════════════════════════════════════════════════ */}
      {showSpecialChars && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSpecialChars(false)}>
          <div className="bg-popover border border-border rounded-xl shadow-xl p-4 w-72 space-y-2 text-foreground" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-semibold text-muted-foreground block">Select Special Character</span>
            <div className="grid grid-cols-6 gap-1">
              {SPECIAL_CHARS.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => {
                    execCmd('insertText', char);
                    setShowSpecialChars(false);
                  }}
                  className="h-8 rounded bg-muted/40 hover:bg-primary hover:text-primary-foreground transition text-sm font-semibold flex items-center justify-center cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 5: KEYBOARD SHORTCUTS
         ══════════════════════════════════════════════════════════════════════ */}
      {showHelpModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4 text-foreground">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="font-serif font-bold text-sm flex items-center gap-1.5">
                <HelpCircle size={15} className="text-primary" />
                <span>WordPress Keyboard Shortcuts</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-border">
              <div className="flex justify-between py-1"><span>Bold</span><kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl + B</kbd></div>
              <div className="flex justify-between py-1"><span>Italic</span><kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl + I</kbd></div>
              <div className="flex justify-between py-1"><span>Underline</span><kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl + U</kbd></div>
              <div className="flex justify-between py-1"><span>Undo</span><kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl + Z</kbd></div>
              <div className="flex justify-between py-1"><span>Redo</span><kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl + Y</kbd></div>
              <div className="flex justify-between py-1"><span>Select All</span><kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl + A</kbd></div>
            </div>

            <div className="text-right pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
