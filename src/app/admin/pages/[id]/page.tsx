'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  PanelLeftClose,
  PanelLeft,
  Layers,
  Layout,
  Columns,
  Grid,
  BarChart3,
  MessageSquare,
  HelpCircle,
  Megaphone,
  FileText,
  Minus,
  MapPin,
  Sparkles,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Search,
  Monitor,
  Tablet,
  Smartphone,
  ChevronRight,
  Shield,
  Phone,
  FileCheck,
  Type,
  Image as ImageIcon,
  Video,
  MousePointer,
  RotateCcw,
  RotateCw,
  FolderOpen,
  X,
  Sliders,
  Palette,
  EyeOff,
  MoveUp,
  MoveDown,
  Maximize2,
  Check,
  ShoppingBag,
  Star,
  Compass,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { PageBlock, BlockType, CMSPage, ElementorTypography, ElementorBoxModel } from '@/types/page-builder';
import BlockRenderer from '@/components/page-builder/BlockRenderer';
import WordPressEditor from '@/components/WordPressEditor';
import { PAGE_TEMPLATES, PageTemplateInfo } from '@/components/page-builder/pageTemplates';

// ─── Available Elementor Widgets ─────────────────────────────────────────────
interface ElementorWidgetDef {
  type: BlockType;
  title: string;
  category: 'Layout' | 'Basic' | 'eCommerce';
  icon: React.ElementType;
  description: string;
  defaultData: Record<string, any>;
  defaultStyle?: Record<string, any>;
}

const ELEMENTOR_WIDGETS: ElementorWidgetDef[] = [
  // Layout
  {
    type: 'CONTAINER',
    title: 'Container',
    category: 'Layout',
    icon: Layout,
    description: 'Flexbox & CSS Grid container for wrapping and structuring widgets',
    defaultData: {
      columns: 1,
      direction: 'column',
      gap: 'normal',
      align_items: 'start',
    },
  },
  {
    type: 'GRID',
    title: 'Grid / Columns',
    category: 'Layout',
    icon: Columns,
    description: 'Multi-column layout (2, 3, 4 columns or 1/3-2/3)',
    defaultData: {
      columns: 2,
      gap: 'normal',
    },
  },

  // Basic
  {
    type: 'HEADING',
    title: 'Heading',
    category: 'Basic',
    icon: Type,
    description: 'Title or subtitle with custom typography and Google fonts',
    defaultData: {
      title: 'This is a Heading',
      tag: 'h2',
      alignment: 'left',
      link_url: '',
    },
    defaultStyle: {
      alignment: 'left',
    },
  },
  {
    type: 'TEXT_EDITOR',
    title: 'Text Editor',
    category: 'Basic',
    icon: FileText,
    description: 'WordPress Classic Editor for formatted articles and paragraphs',
    defaultData: {
      content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.</p>',
    },
  },
  {
    type: 'RICH_TEXT',
    title: 'Rich Text',
    category: 'Basic',
    icon: FileText,
    description: 'Formatted article with heading, custom typography, and media',
    defaultData: {
      title: 'Section Title',
      html_content: '<p>Start writing your content or paste from Word / web...</p>',
      max_width: 'normal',
    },
  },
  {
    type: 'IMAGE',
    title: 'Image',
    category: 'Basic',
    icon: ImageIcon,
    description: 'Showcase an atelier photo, lookbook banner, or graphic',
    defaultData: {
      image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
      alt_text: 'Saba Al Wadi Luxury Modest Couture',
      caption: '',
      link_url: '',
      aspect_ratio: '16/9',
      max_width: 'boxed',
    },
  },
  {
    type: 'BUTTON',
    title: 'Button',
    category: 'Basic',
    icon: MousePointer,
    description: 'Call to action button with custom luxury styling & link',
    defaultData: {
      label: 'Explore Collection',
      url: '/catalog',
      variant: 'luxury',
      size: 'md',
      icon: 'ArrowRight',
      icon_position: 'right',
    },
  },
  {
    type: 'VIDEO',
    title: 'Video',
    category: 'Basic',
    icon: Video,
    description: 'Embed YouTube, Vimeo, or self-hosted fashion video',
    defaultData: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
  },
  {
    type: 'DIVIDER',
    title: 'Divider',
    category: 'Basic',
    icon: Minus,
    description: 'Divider line with solid, dashed, or text/icon separator',
    defaultData: {
      style: 'solid',
      width: 100,
      text: '',
    },
  },
  {
    type: 'SPACER',
    title: 'Spacer',
    category: 'Basic',
    icon: Sliders,
    description: 'Add vertical spacing between elements',
    defaultData: {
      height: 48,
    },
  },
  {
    type: 'MAP',
    title: 'Google Maps',
    category: 'Basic',
    icon: MapPin,
    description: 'Interactive map and boutique address for visitors',
    defaultData: {
      title: 'Flagship Dubai Showroom',
      map_url: 'https://maps.google.com/maps?q=Downtown+Dubai&t=&z=14&ie=UTF8&iwloc=&output=embed',
      address: 'Suit No: M-49, 2nd Floor, Al Habtoor Building, Abu Hail, Deira-Dubai, UAE',
      phone: '+971 55 642 4758',
      hours: 'Sat - Thu: 09:00 AM - 11:00 PM',
      map_height: 400,
    },
  },
  {
    type: 'ICON',
    title: 'Icon',
    category: 'Basic',
    icon: Sparkles,
    description: 'Decorative icon from Lucide library',
    defaultData: {
      icon: 'Sparkles',
      size: 36,
    },
  },

  // eCommerce & Modest Luxury
  {
    type: 'PRODUCTS_GRID',
    title: 'Products Grid',
    category: 'eCommerce',
    icon: ShoppingBag,
    description: 'Curated products grid with prices and direct buy buttons',
    defaultData: {
      title: 'Curated Modest Creations',
      subtitle: 'Hand-tailored in Dubai with pure UAE Nida and imported silks',
      columns: 4,
    },
  },
  {
    type: 'HERO',
    title: 'Hero Banner',
    category: 'eCommerce',
    icon: Layout,
    description: 'High-impact hero showcase with badge, title, subtitle & CTAs',
    defaultData: {
      badge: 'Atelier Dubai 2026',
      title: 'Timeless Modest Elegance',
      subtitle: 'Redefining modesty with architectural silhouettes and premium textiles.',
      alignment: 'center',
      background_type: 'gradient',
      primary_button: { label: 'Explore Collection', url: '/catalog' },
      secondary_button: { label: 'Our Story', url: '#story' },
    },
  },
  {
    type: 'TWO_COLUMN',
    title: 'Two Column (Story + Image)',
    category: 'eCommerce',
    icon: Columns,
    description: 'Split story section for heritage, craftsmanship, or styling',
    defaultData: {
      heading: 'Our Craftsmanship & Heritage',
      subheading: 'ARTISANAL PERFECTION',
      content: 'Every garment is crafted with meticulous attention to detail, using imported breathable silk and Japanese crepes.',
      image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
      image_position: 'left',
      highlights: [
        'Pure imported textiles & breathable linens',
        'Hand-finished embroidery and bespoke embellishments',
      ],
      cta_button: { label: 'Discover The Craft', url: '/catalog' },
    },
  },
  {
    type: 'FEATURES_GRID',
    title: 'Features & Values',
    category: 'eCommerce',
    icon: Shield,
    description: 'Brand pillars: Master Tailoring, Imported Textiles, Shipping',
    defaultData: {
      heading: 'Why Connoisseurs Choose Saba Al Wadi',
      subtitle: 'Crafted with reverence for both faith and high fashion',
      columns: 4,
      items: [
        { icon: 'Sparkles', title: 'Master Tailoring', description: 'Flowing drapery designed for modesty.' },
        { icon: 'Shield', title: 'Imported Textiles', description: 'Premium Nida and Japanese crepe fabrics.' },
        { icon: 'Truck', title: 'Express Delivery', description: 'Complimentary shipping across UAE & worldwide.' },
        { icon: 'Award', title: 'Quality Guarantee', description: 'Hand-inspected before luxurious packaging.' },
      ],
    },
  },
  {
    type: 'TESTIMONIALS',
    title: 'Testimonials',
    category: 'eCommerce',
    icon: MessageSquare,
    description: 'Client reviews, star ratings, and locations',
    defaultData: {
      title: 'Words from Our Patrons',
      subtitle: 'Read genuine reviews from women around the globe',
      items: [
        { quote: 'The fabric quality of Saba Al Wadi abayas is unmatched.', author: 'Fatima Al Mansoori', role: 'Dubai, UAE', rating: 5 },
        { quote: 'Fast international delivery to London and divine tailoring.', author: 'Amina Rahman', role: 'London, UK', rating: 5 },
      ],
    },
  },
  {
    type: 'FAQ_ACCORDION',
    title: 'FAQ Accordion',
    category: 'eCommerce',
    icon: HelpCircle,
    description: 'Collapsible accordion for sizing, care, shipping, or returns',
    defaultData: {
      title: 'Frequently Asked Questions',
      subtitle: 'Answers to common inquiries regarding our pieces',
      items: [
        { question: 'What sizes are available?', answer: 'We offer standard length sizing from 50 to 60 inches.' },
        { question: 'What are the care instructions?', answer: 'Dry clean recommended for embroidered garments.' },
      ],
    },
  },
  {
    type: 'STATS_COUNTER',
    title: 'Stats Counter',
    category: 'eCommerce',
    icon: BarChart3,
    description: 'Highlight milestones, client count, and global reach',
    defaultData: {
      title: 'Our Journey in Numbers',
      stats: [
        { number: '25,000+', label: 'Delighted Clients' },
        { number: '100%', label: 'Pure Imported Fabrics' },
        { number: '3', label: 'Dubai Showroom Suites' },
        { number: '4.9/5', label: 'Satisfaction Rating' },
      ],
    },
  },
  {
    type: 'CTA_BANNER',
    title: 'Call to Action',
    category: 'eCommerce',
    icon: Megaphone,
    description: 'High-converting banner driving visitors to catalog or contact',
    defaultData: {
      title: 'Experience The Luxury Collection',
      subtitle: 'Hand-embroidered abayas crafted to inspire grace and reverence.',
      button_text: 'Shop New Arrivals',
      button_link: '/catalog',
    },
  },
];

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Outfit',
  'Playfair Display',
  'Cinzel',
  'Montserrat',
  'Cormorant Garamond',
  'Rock Salt',
  'Rock 3D',
  'Lora',
  'Cinzel Decorative',
];

const WP_COLOR_PALETTE = [
  '#000000', '#2c3338', '#646970', '#dcdcde', '#ffffff',
  '#d63638', '#cf4944', '#dba617', '#008a20', '#2271b1',
  '#826eb4', '#b89047', '#926605', '#10b981', '#6366f1'
];

interface ImageControlGroupProps {
  label: string;
  imageUrl?: string;
  onImageChange: (url: string) => void;
  onRemove?: () => void;
  widthPercent?: number;
  onWidthChange?: (width: number) => void;
  alignment?: 'left' | 'center' | 'right';
  onAlignmentChange?: (align: 'left' | 'center' | 'right') => void;
  aspectRatio?: string;
  onAspectRatioChange?: (ratio: string) => void;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
}

function ImageControlGroup({
  label,
  imageUrl,
  onImageChange,
  onRemove,
  widthPercent = 100,
  onWidthChange,
  alignment = 'center',
  onAlignmentChange,
  aspectRatio = '16/9',
  onAspectRatioChange,
  altText = '',
  onAltTextChange,
  caption = '',
  onCaptionChange,
}: ImageControlGroupProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <ImageIcon size={14} className="text-[#e2285c]" />
          <span>{label}</span>
        </label>
        {imageUrl && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition cursor-pointer"
          >
            <Trash2 size={12} />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Image Preview & Upload Button */}
      {imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
          <img src={imageUrl} alt={altText || 'Preview'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 bg-white text-slate-800 font-semibold rounded text-[11px] shadow hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
            >
              <Upload size={12} />
              Change
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1 bg-red-600 text-white rounded text-[11px] shadow hover:bg-red-700 cursor-pointer"
                title="Delete Image"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 px-3 border-2 border-dashed border-slate-300 hover:border-[#e2285c] rounded-lg bg-slate-50 hover:bg-rose-50/40 text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Upload size={18} className="text-slate-400 group-hover:text-[#e2285c]" />
          <span className="text-xs font-bold text-slate-700">Upload Image from PC</span>
          <span className="text-[10px] text-slate-400">JPG, PNG, WEBP or SVG</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {/* Image URL input */}
      <div>
        <label className="block text-[11px] text-slate-600 font-semibold mb-1">Or Paste Image URL</label>
        <input
          type="text"
          placeholder="https://..."
          value={imageUrl || ''}
          onChange={(e) => onImageChange(e.target.value)}
          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:border-[#e2285c] focus:ring-1 focus:ring-[#e2285c]"
        />
      </div>

      {/* Width / Resize Controls */}
      {onWidthChange && (
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
            <span>Image Width</span>
            <span className="text-[#e2285c] font-bold">{widthPercent}%</span>
          </div>
          {/* Quick preset buttons: 25%, 50%, 75%, 100% */}
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onWidthChange(pct)}
                className={`py-1 text-center rounded text-[10px] font-bold transition cursor-pointer border ${
                  widthPercent === pct
                    ? 'bg-[#e2285c] text-white border-[#e2285c]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={widthPercent}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            className="w-full accent-[#e2285c] mt-1"
          />
        </div>
      )}

      {/* Alignment */}
      {onAlignmentChange && (
        <div>
          <label className="block text-[11px] text-slate-600 font-semibold mb-1">Alignment</label>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => onAlignmentChange(a)}
                className={`flex-1 py-1 text-center rounded text-xs capitalize transition cursor-pointer ${
                  alignment === a
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aspect Ratio */}
      {onAspectRatioChange && (
        <div>
          <label className="block text-[11px] text-slate-600 font-semibold mb-1">Aspect Ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
          >
            <option value="16/9">Landscape 16:9</option>
            <option value="4/3">Standard 4:3</option>
            <option value="1/1">Square 1:1</option>
            <option value="21/9">Cinematic 21:9</option>
            <option value="auto">Original Auto</option>
          </select>
        </div>
      )}

      {/* Alt Text */}
      {onAltTextChange && (
        <div>
          <label className="block text-[11px] text-slate-600 font-semibold mb-1">Alt Text (SEO)</label>
          <input
            type="text"
            placeholder="Describe the image..."
            value={altText}
            onChange={(e) => onAltTextChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
          />
        </div>
      )}

      {/* Caption */}
      {onCaptionChange && (
        <div>
          <label className="block text-[11px] text-slate-600 font-semibold mb-1">Caption</label>
          <input
            type="text"
            placeholder="Image caption..."
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
          />
        </div>
      )}
    </div>
  );
}

export default function ElementorPageBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params?.id as string;
  const token = useSelector((state: RootState) => (state as any).auth?.token);

  // Core CMS page state
  const [page, setPage] = useState<CMSPage | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Elementor Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeElementTab, setActiveElementTab] = useState<'content' | 'style' | 'advanced'>('content');
  const [widgetSearchQuery, setWidgetSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Layout' | 'Basic' | 'eCommerce'>('All');

  // Device Preview State
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Modals & Panels
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);
  const [showTemplateLibraryModal, setShowTemplateLibraryModal] = useState(false);
  const [showNavigatorDrawer, setShowNavigatorDrawer] = useState(false);
  const [structureInsertIndex, setStructureInsertIndex] = useState<number | null>(null);

  // Page Settings fields
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<PageBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/admin/pages/${pageId}`, { headers });
        if (res.ok) {
          const data: CMSPage = await res.json();
          setPage(data);
          setPageTitle(data.title || '');
          setPageSlug(data.slug || '');
          setMetaTitle(data.meta_title || '');
          setMetaDescription(data.meta_description || '');
          setIsPublished(Boolean(data.is_published));

          let parsedBlocks: PageBlock[] = [];
          try {
            parsedBlocks = JSON.parse(data.content || '[]');
          } catch {
            parsedBlocks = [];
          }
          setBlocks(parsedBlocks);
          setHistory([parsedBlocks]);
          setHistoryIndex(0);
        } else {
          setErrorMessage('Failed to load page content.');
        }
      } catch (err) {
        console.error('Failed to fetch page:', err);
        setErrorMessage('Network error while loading page.');
      } finally {
        setLoading(false);
      }
    };

    if (pageId) fetchPage();
  }, [pageId, token]);

  // Update blocks with history tracking
  const updateBlocksWithHistory = useCallback((nextBlocks: PageBlock[]) => {
    setBlocks(nextBlocks);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, nextBlocks];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setBlocks(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setBlocks(history[nextIdx]);
    }
  };

  // Find currently selected block
  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  // Update a specific field in selected block
  const updateSelectedBlock = (mutator: (block: PageBlock) => PageBlock) => {
    if (!selectedBlockId) return;
    const nextBlocks = blocks.map((b) => {
      if (b.id === selectedBlockId) {
        return mutator(JSON.parse(JSON.stringify(b)));
      }
      return b;
    });
    setBlocks(nextBlocks);
  };

  // Inline edit handler: update block data directly when edited on canvas
  const handleInlineBlockDataChange = useCallback((blockId: string, newData: Record<string, any>) => {
    const nextBlocks = blocks.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          data: newData,
        };
      }
      return b;
    });
    updateBlocksWithHistory(nextBlocks);
  }, [blocks, updateBlocksWithHistory]);

  // Add a widget to the canvas
  const handleAddWidget = (def: ElementorWidgetDef, insertIndex?: number) => {
    const newBlock: PageBlock = {
      id: `elem-${def.type.toLowerCase()}-${Date.now()}`,
      type: def.type,
      data: JSON.parse(JSON.stringify(def.defaultData)),
      style: def.defaultStyle ? JSON.parse(JSON.stringify(def.defaultStyle)) : {},
      advanced: {},
    };

    const next = [...blocks];
    if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= blocks.length) {
      next.splice(insertIndex, 0, newBlock);
    } else {
      next.push(newBlock);
    }
    updateBlocksWithHistory(next);
    setSelectedBlockId(newBlock.id);
    setActiveElementTab('content');
    setStructureInsertIndex(null);
  };

  // Add column structure (e.g. 1 col, 2 cols 50/50, 3 cols)
  const handleAddContainerStructure = (cols: number | string, insertIndex?: number) => {
    const newContainer: PageBlock = {
      id: `elem-container-${Date.now()}`,
      type: 'CONTAINER',
      data: {
        columns: cols,
        gap: 'normal',
      },
      style: {},
      advanced: {},
    };

    const next = [...blocks];
    if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= blocks.length) {
      next.splice(insertIndex, 0, newContainer);
    } else {
      next.push(newContainer);
    }
    updateBlocksWithHistory(next);
    setSelectedBlockId(newContainer.id);
    setActiveElementTab('content');
    setStructureInsertIndex(null);
  };

  // Delete a block
  const handleDeleteBlock = (id: string) => {
    if (confirm('Are you sure you want to delete this element?')) {
      const next = blocks.filter((b) => b.id !== id);
      updateBlocksWithHistory(next);
      if (selectedBlockId === id) setSelectedBlockId(null);
    }
  };

  // Duplicate a block
  const handleDuplicateBlock = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const original = blocks[idx];
    const clone: PageBlock = {
      id: `elem-${original.type.toLowerCase()}-${Date.now()}`,
      type: original.type,
      data: JSON.parse(JSON.stringify(original.data)),
      style: original.style ? JSON.parse(JSON.stringify(original.style)) : {},
      advanced: original.advanced ? JSON.parse(JSON.stringify(original.advanced)) : {},
    };
    const next = [...blocks];
    next.splice(idx + 1, 0, clone);
    updateBlocksWithHistory(next);
    setSelectedBlockId(clone.id);
  };

  // Move a block up or down
  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    updateBlocksWithHistory(next);
  };

  // Save changes to backend
  const handleSavePage = async (publishStatus?: boolean) => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    const isPub = publishStatus !== undefined ? publishStatus : isPublished;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/admin/pages/${pageId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: pageTitle.trim(),
          slug: pageSlug.trim(),
          content: JSON.stringify(blocks),
          meta_title: metaTitle.trim(),
          meta_description: metaDescription.trim(),
          is_published: isPub,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPage(updated);
        setIsPublished(Boolean(updated.is_published));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData.message || 'Failed to save page changes.');
      }
    } catch (err) {
      console.error('Failed to save page:', err);
      setErrorMessage('Network error while saving page.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered widgets based on search & category
  const filteredWidgets = useMemo(() => {
    return ELEMENTOR_WIDGETS.filter((w) => {
      const matchesCat = activeCategory === 'All' || w.category === activeCategory;
      const matchesSearch =
        !widgetSearchQuery.trim() ||
        w.title.toLowerCase().includes(widgetSearchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(widgetSearchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, widgetSearchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#e2285c] to-rose-400 text-white font-bold flex items-center justify-center text-xl shadow-lg animate-pulse">
          E
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Elementor Builder...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#edf0f5] text-slate-800 font-sans select-none">
      {/* ══════════════════════════════════════════════════════════════════════
          TOP ELEMENTOR APP BAR (Light Theme)
         ══════════════════════════════════════════════════════════════════════ */}
      <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shrink-0 shadow-2xs text-slate-800">
        {/* Left: Branding & Page Name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/pages')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Exit to Pages Dashboard"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#e2285c] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              E
            </div>
            <span className="font-semibold text-xs tracking-wider uppercase text-slate-600">
              Elementor
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[300px]">
              {pageTitle || `Page #${pageId}`}
            </span>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isPublished
                ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
            }`}
          >
            {isPublished ? 'Live' : 'Draft'}
          </span>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setDeviceView('desktop')}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              deviceView === 'desktop' ? 'bg-[#e2285c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Desktop (100%)"
          >
            <Monitor size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('tablet')}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              deviceView === 'tablet' ? 'bg-[#e2285c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Tablet (768px)"
          >
            <Tablet size={15} />
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('mobile')}
            className={`p-1.5 rounded-md transition cursor-pointer ${
              deviceView === 'mobile' ? 'bg-[#e2285c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Mobile (375px)"
          >
            <Smartphone size={15} />
          </button>
        </div>

        {/* Right: History, Preview, Page Settings & Save */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center text-slate-500 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 transition cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 transition cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw size={14} />
            </button>
          </div>

          {/* Navigator toggle */}
          <button
            type="button"
            onClick={() => setShowNavigatorDrawer(!showNavigatorDrawer)}
            className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              showNavigatorDrawer ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="DOM Structure Navigator"
          >
            <Layers size={15} />
          </button>

          {/* Page Settings */}
          <button
            type="button"
            onClick={() => setShowPageSettingsModal(true)}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Page SEO & Settings"
          >
            <Settings2 size={15} />
          </button>

          {/* View Published Page */}
          <Link
            href={`/${pageSlug}`}
            target="_blank"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Preview Live Page in New Tab"
          >
            <Eye size={15} />
          </Link>

          {/* Iconic Elementor Green UPDATE / PUBLISH Button */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSavePage()}
            className="px-4 py-1.5 bg-[#008a20] hover:bg-[#00a32a] text-white text-xs font-bold uppercase tracking-wider rounded-md transition shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check size={14} />
                <span>Saved</span>
              </>
            ) : (
              <span>Update</span>
            )}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN WORKSPACE: LEFT ELEMENTOR PANEL + RIGHT LIVE CANVAS
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ─── DOCKED LEFT ELEMENTOR PANEL (Light Theme) ───────────────────── */}
        <aside
          className={`bg-slate-50 border-r border-slate-200 text-slate-800 flex flex-col shrink-0 transition-all duration-300 z-20 shadow-sm ${
            sidebarOpen ? 'w-[340px] sm:w-[380px]' : 'w-0 overflow-hidden'
          }`}
        >
          {/* Panel Top Navigation */}
          <div className="h-11 bg-white border-b border-slate-200 px-3 flex items-center justify-between text-xs text-slate-700">
            {selectedBlock ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setSelectedBlockId(null)}
                  className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                  title="Back to all widgets"
                >
                  <ArrowLeft size={14} />
                  <span className="font-semibold">Widgets</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="font-bold text-slate-900 truncate flex-1">
                  Edit {selectedBlock.type.replace('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => handleDuplicateBlock(selectedBlock.id)}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  title="Duplicate Element"
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                  className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                  title="Delete Element"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Grid size={14} className="text-[#e2285c]" />
                  <span>Elements</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowTemplateLibraryModal(true)}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <FolderOpen size={12} className="text-[#e2285c]" />
                    <span>Templates</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── VIEW A: WIDGETS PALETTE (When no block is selected) ─────────── */}
          {!selectedBlock ? (
            <div className="flex-1 overflow-y-auto flex flex-col p-3 space-y-4">
              {/* Search Widget input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Widget..."
                  value={widgetSearchQuery}
                  onChange={(e) => setWidgetSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#e2285c] shadow-2xs"
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                {widgetSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setWidgetSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {(['All', 'Layout', 'Basic', 'eCommerce'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-[#e2285c] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Widgets Grid */}
              <div className="grid grid-cols-2 gap-2">
                {filteredWidgets.map((w) => {
                  const Icon = w.icon;
                  return (
                    <button
                      key={w.type + w.title}
                      type="button"
                      onClick={() => handleAddWidget(w)}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#e2285c]/60 rounded-xl flex flex-col items-center justify-center text-center space-y-2 group transition cursor-pointer shadow-2xs"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-[#e2285c]/10 text-slate-600 group-hover:text-[#e2285c] flex items-center justify-center transition">
                        <Icon size={18} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-[#e2285c] transition">
                        {w.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ─── VIEW B: ELEMENT EDIT PANEL (Content, Style, Advanced) ─────── */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs: Content | Style | Advanced (Light Theme) */}
              <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveElementTab('content')}
                  className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                    activeElementTab === 'content'
                      ? 'border-[#e2285c] text-[#e2285c] font-bold bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => setActiveElementTab('style')}
                  className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                    activeElementTab === 'style'
                      ? 'border-[#e2285c] text-[#e2285c] font-bold bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Style
                </button>
                <button
                  type="button"
                  onClick={() => setActiveElementTab('advanced')}
                  className={`flex-1 py-2.5 text-center transition cursor-pointer border-b-2 ${
                    activeElementTab === 'advanced'
                      ? 'border-[#e2285c] text-[#e2285c] font-bold bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Advanced
                </button>
              </div>

              {/* Tab Body (Light Theme) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-700 bg-white">
                {/* ─── 1. CONTENT TAB ────────────────────────────────────────── */}
                {activeElementTab === 'content' && (
                  <div className="space-y-4">
                    {/* For HEADING */}
                    {selectedBlock.type === 'HEADING' && (
                      <>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Title Text</label>
                          <textarea
                            rows={3}
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-[#e2285c] focus:border-[#e2285c]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">HTML Tag</label>
                            <select
                              value={selectedBlock.data.tag || 'h2'}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.tag = e.target.value;
                                  return b;
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                            >
                              <option value="h1">H1</option>
                              <option value="h2">H2</option>
                              <option value="h3">H3</option>
                              <option value="h4">H4</option>
                              <option value="h5">H5</option>
                              <option value="h6">H6</option>
                              <option value="div">div</option>
                              <option value="span">span</option>
                              <option value="p">p</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Link URL</label>
                            <input
                              type="text"
                              placeholder="https://..."
                              value={selectedBlock.data.link_url || ''}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.link_url = e.target.value;
                                  return b;
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* For TEXT_EDITOR & RICH_TEXT: WordPress / Lexical Editor */}
                    {(selectedBlock.type === 'TEXT_EDITOR' || selectedBlock.type === 'RICH_TEXT') && (
                      <div className="space-y-4">
                        {/* Section Title (for RICH_TEXT or if title is present) */}
                        {selectedBlock.type === 'RICH_TEXT' && (
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                              Section Title
                            </label>
                            <input
                              type="text"
                              value={selectedBlock.data.title || ''}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.title = e.target.value;
                                  return b;
                                })
                              }
                              placeholder="e.g. Official Privacy Policy"
                              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-1 focus:ring-[#e2285c] focus:border-[#e2285c]"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="block text-slate-700 font-semibold mb-1">
                            {selectedBlock.type === 'RICH_TEXT'
                              ? 'Rich Text Content & Media'
                              : 'WordPress Classic Text Editor'}
                          </label>
                          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white text-black shadow-2xs">
                            <WordPressEditor
                              value={selectedBlock.data.html_content || selectedBlock.data.content || ''}
                              onChange={(val) =>
                                updateSelectedBlock((b) => {
                                  b.data.content = val;
                                  b.data.html_content = val;
                                  return b;
                                })
                              }
                              minHeight={320}
                            />
                          </div>
                        </div>

                        {selectedBlock.type === 'RICH_TEXT' && (
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">
                              Max Width
                            </label>
                            <select
                              value={selectedBlock.data.max_width || 'normal'}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.max_width = e.target.value;
                                  return b;
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                            >
                              <option value="narrow">Narrow (640px)</option>
                              <option value="normal">Normal (768px)</option>
                              <option value="wide">Wide (1024px)</option>
                              <option value="full">Full Width</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* For BUTTON */}
                    {selectedBlock.type === 'BUTTON' && (
                      <>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Button Text</label>
                          <input
                            type="text"
                            value={selectedBlock.data.label || selectedBlock.data.text || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.label = e.target.value;
                                b.data.text = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Link URL</label>
                          <input
                            type="text"
                            value={selectedBlock.data.url || selectedBlock.data.link || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.url = e.target.value;
                                b.data.link = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Variant</label>
                            <select
                              value={selectedBlock.data.variant || 'luxury'}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.variant = e.target.value;
                                  return b;
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                            >
                              <option value="luxury">Luxury Gold</option>
                              <option value="outline">Outline</option>
                              <option value="dark">Dark</option>
                              <option value="light">Light</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Size</label>
                            <select
                              value={selectedBlock.data.size || 'md'}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.size = e.target.value;
                                  return b;
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                            >
                              <option value="sm">Small</option>
                              <option value="md">Medium</option>
                              <option value="lg">Large</option>
                              <option value="xl">Extra Large</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* For IMAGE (Full Add, Remove, Resize Controls) */}
                    {selectedBlock.type === 'IMAGE' && (
                      <div className="space-y-3">
                        <ImageControlGroup
                          label="Image Settings"
                          imageUrl={selectedBlock.data.image_url}
                          onImageChange={(url) =>
                            updateSelectedBlock((b) => {
                              b.data.image_url = url;
                              return b;
                            })
                          }
                          onRemove={() =>
                            updateSelectedBlock((b) => {
                              b.data.image_url = '';
                              return b;
                            })
                          }
                          widthPercent={selectedBlock.data.width_percent || selectedBlock.data.width || 100}
                          onWidthChange={(w) =>
                            updateSelectedBlock((b) => {
                              b.data.width_percent = w;
                              b.data.width = w;
                              return b;
                            })
                          }
                          alignment={selectedBlock.data.alignment || 'center'}
                          onAlignmentChange={(a) =>
                            updateSelectedBlock((b) => {
                              b.data.alignment = a;
                              if (!b.style) b.style = {};
                              b.style.alignment = a;
                              return b;
                            })
                          }
                          aspectRatio={selectedBlock.data.aspect_ratio || '16/9'}
                          onAspectRatioChange={(r) =>
                            updateSelectedBlock((b) => {
                              b.data.aspect_ratio = r;
                              return b;
                            })
                          }
                          altText={selectedBlock.data.alt_text || ''}
                          onAltTextChange={(t) =>
                            updateSelectedBlock((b) => {
                              b.data.alt_text = t;
                              return b;
                            })
                          }
                          caption={selectedBlock.data.caption || ''}
                          onCaptionChange={(c) =>
                            updateSelectedBlock((b) => {
                              b.data.caption = c;
                              return b;
                            })
                          }
                        />

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Click Link URL (Optional)</label>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={selectedBlock.data.link_url || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.link_url = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>
                      </div>
                    )}

                    {/* For HERO */}
                    {selectedBlock.type === 'HERO' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Badge / Tagline</label>
                          <input
                            type="text"
                            placeholder="e.g. Atelier Dubai 2026"
                            value={selectedBlock.data.badge || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.badge = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Main Title</label>
                          <textarea
                            rows={2}
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Subtitle</label>
                          <textarea
                            rows={3}
                            value={selectedBlock.data.subtitle || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.subtitle = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        {/* Primary Button */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <span className="font-bold text-slate-800 text-[11px] block">Primary Button</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">Label</label>
                              <input
                                type="text"
                                value={selectedBlock.data.primary_button?.label || ''}
                                onChange={(e) =>
                                  updateSelectedBlock((b) => {
                                    if (!b.data.primary_button) b.data.primary_button = {};
                                    b.data.primary_button.label = e.target.value;
                                    return b;
                                  })
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">Link URL</label>
                              <input
                                type="text"
                                value={selectedBlock.data.primary_button?.url || ''}
                                onChange={(e) =>
                                  updateSelectedBlock((b) => {
                                    if (!b.data.primary_button) b.data.primary_button = {};
                                    b.data.primary_button.url = e.target.value;
                                    return b;
                                  })
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Secondary Button */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <span className="font-bold text-slate-800 text-[11px] block">Secondary Button</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">Label</label>
                              <input
                                type="text"
                                value={selectedBlock.data.secondary_button?.label || ''}
                                onChange={(e) =>
                                  updateSelectedBlock((b) => {
                                    if (!b.data.secondary_button) b.data.secondary_button = {};
                                    b.data.secondary_button.label = e.target.value;
                                    return b;
                                  })
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">Link URL</label>
                              <input
                                type="text"
                                value={selectedBlock.data.secondary_button?.url || ''}
                                onChange={(e) =>
                                  updateSelectedBlock((b) => {
                                    if (!b.data.secondary_button) b.data.secondary_button = {};
                                    b.data.secondary_button.url = e.target.value;
                                    return b;
                                  })
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Hero Background Image */}
                        <ImageControlGroup
                          label="Hero Background Image"
                          imageUrl={selectedBlock.data.bg_image || selectedBlock.data.image_url}
                          onImageChange={(url) =>
                            updateSelectedBlock((b) => {
                              b.data.bg_type = 'image';
                              b.data.bg_image = url;
                              b.data.image_url = url;
                              return b;
                            })
                          }
                          onRemove={() =>
                            updateSelectedBlock((b) => {
                              b.data.bg_image = '';
                              b.data.image_url = '';
                              return b;
                            })
                          }
                        />
                      </div>
                    )}

                    {/* For TWO_COLUMN */}
                    {selectedBlock.type === 'TWO_COLUMN' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Eyebrow / Subheading</label>
                          <input
                            type="text"
                            value={selectedBlock.data.subheading || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.subheading = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Main Heading</label>
                          <input
                            type="text"
                            value={selectedBlock.data.heading || selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.heading = e.target.value;
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Content / Paragraph</label>
                          <textarea
                            rows={4}
                            value={selectedBlock.data.content || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.content = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        {/* Image Position Toggle */}
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Image Position</label>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlock((b) => {
                                  b.data.image_position = 'left';
                                  return b;
                                })
                              }
                              className={`flex-1 py-1 text-center rounded text-xs font-semibold cursor-pointer ${
                                selectedBlock.data.image_position === 'left'
                                  ? 'bg-white text-slate-900 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Image on Left
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlock((b) => {
                                  b.data.image_position = 'right';
                                  return b;
                                })
                              }
                              className={`flex-1 py-1 text-center rounded text-xs font-semibold cursor-pointer ${
                                selectedBlock.data.image_position !== 'left'
                                  ? 'bg-white text-slate-900 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Image on Right
                            </button>
                          </div>
                        </div>

                        {/* Story Image Controls */}
                        <ImageControlGroup
                          label="Story Image"
                          imageUrl={selectedBlock.data.image_url}
                          onImageChange={(url) =>
                            updateSelectedBlock((b) => {
                              b.data.image_url = url;
                              return b;
                            })
                          }
                          onRemove={() =>
                            updateSelectedBlock((b) => {
                              b.data.image_url = '';
                              return b;
                            })
                          }
                          widthPercent={selectedBlock.data.width_percent || 100}
                          onWidthChange={(w) =>
                            updateSelectedBlock((b) => {
                              b.data.width_percent = w;
                              return b;
                            })
                          }
                        />

                        {/* Highlights Repeater */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">Key Highlights</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlock((b) => {
                                  if (!Array.isArray(b.data.highlights)) b.data.highlights = [];
                                  b.data.highlights.push('New key highlight point');
                                  return b;
                                })
                              }
                              className="text-[11px] text-[#e2285c] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add Bullet</span>
                            </button>
                          </div>
                          {Array.isArray(selectedBlock.data.highlights) &&
                            selectedBlock.data.highlights.map((hl: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={hl}
                                  onChange={(e) =>
                                    updateSelectedBlock((b) => {
                                      b.data.highlights[idx] = e.target.value;
                                      return b;
                                    })
                                  }
                                  className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:border-[#e2285c]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSelectedBlock((b) => {
                                      b.data.highlights.splice(idx, 1);
                                      return b;
                                    })
                                  }
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <span className="font-bold text-slate-800 text-[11px] block">CTA Button</span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">Label</label>
                              <input
                                type="text"
                                value={selectedBlock.data.cta_button?.label || ''}
                                onChange={(e) =>
                                  updateSelectedBlock((b) => {
                                    if (!b.data.cta_button) b.data.cta_button = {};
                                    b.data.cta_button.label = e.target.value;
                                    return b;
                                  })
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">Link URL</label>
                              <input
                                type="text"
                                value={selectedBlock.data.cta_button?.url || ''}
                                onChange={(e) =>
                                  updateSelectedBlock((b) => {
                                    if (!b.data.cta_button) b.data.cta_button = {};
                                    b.data.cta_button.url = e.target.value;
                                    return b;
                                  })
                                }
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* For FEATURES_GRID */}
                    {selectedBlock.type === 'FEATURES_GRID' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Section Title</label>
                          <input
                            type="text"
                            value={selectedBlock.data.heading || selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.heading = e.target.value;
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Subtitle</label>
                          <textarea
                            rows={2}
                            value={selectedBlock.data.subtitle || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.subtitle = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Columns</label>
                          <select
                            value={selectedBlock.data.columns || 4}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.columns = parseInt(e.target.value, 10);
                                return b;
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                          >
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                            <option value={4}>4 Columns</option>
                          </select>
                        </div>

                        {/* Features Repeater */}
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">Feature Cards</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlock((b) => {
                                  if (!Array.isArray(b.data.items)) b.data.items = [];
                                  b.data.items.push({
                                    icon: 'Sparkles',
                                    title: 'Feature Title',
                                    description: 'Description of this craft or service value.',
                                  });
                                  return b;
                                })
                              }
                              className="text-[11px] text-[#e2285c] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add Card</span>
                            </button>
                          </div>

                          {Array.isArray(selectedBlock.data.items) &&
                            selectedBlock.data.items.map((it: any, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 text-[11px]">Card #{idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedBlock((b) => {
                                        b.data.items.splice(idx, 1);
                                        return b;
                                      })
                                    }
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2">
                                    <input
                                      type="text"
                                      placeholder="Title"
                                      value={it.title || ''}
                                      onChange={(e) =>
                                        updateSelectedBlock((b) => {
                                          b.data.items[idx].title = e.target.value;
                                          return b;
                                        })
                                      }
                                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <select
                                      value={it.icon || 'Sparkles'}
                                      onChange={(e) =>
                                        updateSelectedBlock((b) => {
                                          b.data.items[idx].icon = e.target.value;
                                          return b;
                                        })
                                      }
                                      className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                    >
                                      <option value="Sparkles">Sparkles</option>
                                      <option value="Shield">Shield</option>
                                      <option value="Truck">Truck</option>
                                      <option value="Award">Award</option>
                                      <option value="Heart">Heart</option>
                                      <option value="Star">Star</option>
                                      <option value="Headset">Headset</option>
                                    </select>
                                  </div>
                                </div>
                                <textarea
                                  rows={2}
                                  placeholder="Description..."
                                  value={it.description || ''}
                                  onChange={(e) =>
                                    updateSelectedBlock((b) => {
                                      b.data.items[idx].description = e.target.value;
                                      return b;
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* For STATS_COUNTER */}
                    {selectedBlock.type === 'STATS_COUNTER' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Section Title</label>
                          <input
                            type="text"
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        {/* Stats Repeater */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">Stats Counters</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlock((b) => {
                                  if (!Array.isArray(b.data.stats)) b.data.stats = [];
                                  b.data.stats.push({ number: '100+', label: 'New Metric' });
                                  return b;
                                })
                              }
                              className="text-[11px] text-[#e2285c] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add Stat</span>
                            </button>
                          </div>

                          {Array.isArray(selectedBlock.data.stats) &&
                            selectedBlock.data.stats.map((st: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <input
                                  type="text"
                                  placeholder="e.g. 50K+"
                                  value={st.number || ''}
                                  onChange={(e) =>
                                    updateSelectedBlock((b) => {
                                      b.data.stats[idx].number = e.target.value;
                                      return b;
                                    })
                                  }
                                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs font-bold"
                                />
                                <input
                                  type="text"
                                  placeholder="Label (e.g. Happy Clients)"
                                  value={st.label || ''}
                                  onChange={(e) =>
                                    updateSelectedBlock((b) => {
                                      b.data.stats[idx].label = e.target.value;
                                      return b;
                                    })
                                  }
                                  className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSelectedBlock((b) => {
                                      b.data.stats.splice(idx, 1);
                                      return b;
                                    })
                                  }
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* For TESTIMONIALS */}
                    {selectedBlock.type === 'TESTIMONIALS' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Section Title</label>
                          <input
                            type="text"
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={selectedBlock.data.subtitle || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.subtitle = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        {/* Testimonials Repeater */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">Testimonials</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlock((b) => {
                                  if (!Array.isArray(b.data.items)) b.data.items = [];
                                  b.data.items.push({
                                    quote: 'The craftsmanship exceeded my expectations completely.',
                                    author: 'Client Name',
                                    role: 'Dubai, UAE',
                                    rating: 5,
                                  });
                                  return b;
                                })
                              }
                              className="text-[11px] text-[#e2285c] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add Review</span>
                            </button>
                          </div>

                          {Array.isArray(selectedBlock.data.items) &&
                            selectedBlock.data.items.map((it: any, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 text-[11px]">Review #{idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedBlock((b) => {
                                        b.data.items.splice(idx, 1);
                                        return b;
                                      })
                                    }
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <textarea
                                  rows={2}
                                  placeholder="Review quote..."
                                  value={it.quote || ''}
                                  onChange={(e) =>
                                    updateSelectedBlock((b) => {
                                      b.data.items[idx].quote = e.target.value;
                                      return b;
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Author"
                                    value={it.author || ''}
                                    onChange={(e) =>
                                      updateSelectedBlock((b) => {
                                        b.data.items[idx].author = e.target.value;
                                        return b;
                                      })
                                    }
                                    className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Role / City"
                                    value={it.role || ''}
                                    onChange={(e) =>
                                      updateSelectedBlock((b) => {
                                        b.data.items[idx].role = e.target.value;
                                        return b;
                                      })
                                    }
                                    className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* For FAQ_ACCORDION */}
                    {selectedBlock.type === 'FAQ_ACCORDION' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Section Title</label>
                          <input
                            type="text"
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>

                        {/* FAQs Repeater */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">Frequently Asked Questions</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedBlock((b) => {
                                  if (!Array.isArray(b.data.items)) b.data.items = [];
                                  b.data.items.push({
                                    question: 'New Question Here?',
                                    answer: 'Detailed answer or policy explanation goes here.',
                                  });
                                  return b;
                                })
                              }
                              className="text-[11px] text-[#e2285c] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add Question</span>
                            </button>
                          </div>

                          {Array.isArray(selectedBlock.data.items) &&
                            selectedBlock.data.items.map((it: any, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 text-[11px]">FAQ #{idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedBlock((b) => {
                                        b.data.items.splice(idx, 1);
                                        return b;
                                      })
                                    }
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Question..."
                                  value={it.question || ''}
                                  onChange={(e) =>
                                    updateSelectedBlock((b) => {
                                      b.data.items[idx].question = e.target.value;
                                      return b;
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs font-semibold"
                                />
                                <textarea
                                  rows={2}
                                  placeholder="Answer..."
                                  value={it.answer || ''}
                                  onChange={(e) =>
                                    updateSelectedBlock((b) => {
                                      b.data.items[idx].answer = e.target.value;
                                      return b;
                                    })
                                  }
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* For CTA_BANNER */}
                    {selectedBlock.type === 'CTA_BANNER' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Banner Title</label>
                          <input
                            type="text"
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Subtitle</label>
                          <textarea
                            rows={2}
                            value={selectedBlock.data.subtitle || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.subtitle = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:border-[#e2285c]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Button Label</label>
                            <input
                              type="text"
                              value={selectedBlock.data.button_text || ''}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.button_text = e.target.value;
                                  return b;
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-semibold mb-1">Button Link</label>
                            <input
                              type="text"
                              value={selectedBlock.data.button_link || ''}
                              onChange={(e) =>
                                updateSelectedBlock((b) => {
                                  b.data.button_link = e.target.value;
                                  return b;
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* For CONTACT_FORM */}
                    {selectedBlock.type === 'CONTACT_FORM' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Badge</label>
                          <input
                            type="text"
                            value={selectedBlock.data.badge || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.badge = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Title</label>
                          <input
                            type="text"
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Subtitle</label>
                          <textarea
                            rows={2}
                            value={selectedBlock.data.subtitle || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.subtitle = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Email</label>
                          <input
                            type="text"
                            value={selectedBlock.data.email || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.email = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Business Hours</label>
                          <textarea
                            rows={2}
                            value={selectedBlock.data.hours || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.hours = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* For VIDEO */}
                    {selectedBlock.type === 'VIDEO' && (
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Video Link (YouTube / Vimeo)</label>
                        <input
                          type="text"
                          value={selectedBlock.data.url || selectedBlock.data.video_url || ''}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              b.data.url = e.target.value;
                              b.data.video_url = e.target.value;
                              return b;
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                        />
                      </div>
                    )}

                    {/* For DIVIDER */}
                    {selectedBlock.type === 'DIVIDER' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Style</label>
                          <select
                            value={selectedBlock.data.style || 'solid'}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.style = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                            <option value="double">Double</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">
                            Width: {selectedBlock.data.width || 100}%
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={selectedBlock.data.width || 100}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.width = parseInt(e.target.value);
                                return b;
                              })
                            }
                            className="w-full accent-[#e2285c]"
                          />
                        </div>
                      </div>
                    )}

                    {/* For SPACER */}
                    {selectedBlock.type === 'SPACER' && (
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Height: {selectedBlock.data.height || 48}px
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="250"
                          value={selectedBlock.data.height || 48}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              b.data.height = parseInt(e.target.value);
                              return b;
                            })
                          }
                          className="w-full accent-[#e2285c]"
                        />
                      </div>
                    )}

                    {/* For CONTAINER / GRID */}
                    {(selectedBlock.type === 'CONTAINER' || selectedBlock.type === 'GRID') && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Columns</label>
                          <select
                            value={selectedBlock.data.columns || 1}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                const val = e.target.value;
                                b.data.columns = isNaN(Number(val)) ? val : Number(val);
                                return b;
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                          >
                            <option value={1}>1 Column (100%)</option>
                            <option value={2}>2 Columns (50% / 50%)</option>
                            <option value={3}>3 Columns (33% / 33% / 33%)</option>
                            <option value={4}>4 Columns (25% each)</option>
                            <option value="1/3-2/3">1/3 + 2/3 Columns</option>
                            <option value="2/3-1/3">2/3 + 1/3 Columns</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* For MAP */}
                    {selectedBlock.type === 'MAP' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Map Title</label>
                          <input
                            type="text"
                            value={selectedBlock.data.title || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.title = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1">Address</label>
                          <textarea
                            rows={2}
                            value={selectedBlock.data.address || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                b.data.address = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── 2. STYLE TAB (Typography, Alignment, Colors) ── */}
                {activeElementTab === 'style' && (
                  <div className="space-y-5">
                    {/* Alignment */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-slate-700 font-semibold">Alignment</label>
                        <span className="text-[10px] text-slate-500 uppercase">{deviceView}</span>
                      </div>
                      <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                        {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() =>
                              updateSelectedBlock((b) => {
                                if (!b.style) b.style = {};
                                b.style.alignment = align;
                                b.data.alignment = align;
                                return b;
                              })
                            }
                            className={`flex-1 py-1 text-center rounded capitalize text-xs transition cursor-pointer ${
                              (selectedBlock.style?.alignment || selectedBlock.data.alignment) === align
                                ? 'bg-[#e2285c] text-white font-bold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {align}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedBlock.style?.textColor || '#000000'}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.style) b.style = {};
                              b.style.textColor = e.target.value;
                              return b;
                            })
                          }
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={selectedBlock.style?.textColor || ''}
                          placeholder="#000000"
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.style) b.style = {};
                              b.style.textColor = e.target.value;
                              return b;
                            })
                          }
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Typography Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <Type size={13} className="text-[#e2285c]" />
                          <span>Typography</span>
                        </span>
                      </div>

                      {/* Font Family */}
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-1">Family</label>
                        <select
                          value={selectedBlock.style?.typography?.family || 'Inter'}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.style) b.style = {};
                              if (!b.style.typography) b.style.typography = {};
                              b.style.typography.family = e.target.value;
                              return b;
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                        >
                          {GOOGLE_FONTS.map((font) => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Font Size */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                          <span>Size</span>
                          <span>{selectedBlock.style?.typography?.size || 16}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="96"
                          value={selectedBlock.style?.typography?.size || 16}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.style) b.style = {};
                              if (!b.style.typography) b.style.typography = {};
                              b.style.typography.size = parseInt(e.target.value);
                              return b;
                            })
                          }
                          className="w-full accent-[#e2285c]"
                        />
                      </div>

                      {/* Font Weight */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="block text-slate-600 mb-1">Weight</label>
                          <select
                            value={selectedBlock.style?.typography?.weight || '400'}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.style) b.style = {};
                                if (!b.style.typography) b.style.typography = {};
                                b.style.typography.weight = e.target.value;
                                return b;
                              })
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                          >
                            <option value="300">Light 300</option>
                            <option value="400">Regular 400</option>
                            <option value="500">Medium 500</option>
                            <option value="600">Semi-Bold 600</option>
                            <option value="700">Bold 700</option>
                            <option value="800">Extra Bold 800</option>
                            <option value="900">Black 900</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Transform</label>
                          <select
                            value={selectedBlock.style?.typography?.transform || 'none'}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.style) b.style = {};
                                if (!b.style.typography) b.style.typography = {};
                                b.style.typography.transform = e.target.value as any;
                                return b;
                              })
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                          >
                            <option value="none">Default</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="capitalize">Capitalize</option>
                          </select>
                        </div>
                      </div>

                      {/* Line Height & Letter Spacing */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="block text-slate-600 mb-1">Line Height</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.8"
                            max="3"
                            value={selectedBlock.style?.typography?.lineHeight || 1.5}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.style) b.style = {};
                                if (!b.style.typography) b.style.typography = {};
                                b.style.typography.lineHeight = parseFloat(e.target.value);
                                return b;
                              })
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 mb-1">Letter Spacing (px)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedBlock.style?.typography?.letterSpacing || 0}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.style) b.style = {};
                                if (!b.style.typography) b.style.typography = {};
                                b.style.typography.letterSpacing = parseFloat(e.target.value);
                                return b;
                              })
                            }
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Background Color & Gradient */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">Background</label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedBlock.style?.backgroundColor || '#ffffff'}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.style) b.style = {};
                                b.style.backgroundColor = e.target.value;
                                return b;
                              })
                            }
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Solid color hex (e.g. #f8fafc)"
                            value={selectedBlock.style?.backgroundColor || ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.style) b.style = {};
                                b.style.backgroundColor = e.target.value;
                                return b;
                              })
                            }
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── 3. ADVANCED TAB (Margins, Paddings, Z-Index, Responsive) ─── */}
                {activeElementTab === 'advanced' && (
                  <div className="space-y-5">
                    {/* Margins */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">Margin (px)</label>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.margin?.top ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.margin) b.advanced.margin = {};
                                b.advanced.margin.top = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Top</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.margin?.right ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.margin) b.advanced.margin = {};
                                b.advanced.margin.right = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Right</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.margin?.bottom ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.margin) b.advanced.margin = {};
                                b.advanced.margin.bottom = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Bottom</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.margin?.left ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.margin) b.advanced.margin = {};
                                b.advanced.margin.left = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Left</span>
                        </div>
                      </div>
                    </div>

                    {/* Paddings */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1.5">Padding (px)</label>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.padding?.top ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.padding) b.advanced.padding = {};
                                b.advanced.padding.top = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Top</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.padding?.right ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.padding) b.advanced.padding = {};
                                b.advanced.padding.right = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Right</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.padding?.bottom ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.padding) b.advanced.padding = {};
                                b.advanced.padding.bottom = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Bottom</span>
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="0"
                            value={selectedBlock.advanced?.padding?.left ?? ''}
                            onChange={(e) =>
                              updateSelectedBlock((b) => {
                                if (!b.advanced) b.advanced = {};
                                if (!b.advanced.padding) b.advanced.padding = {};
                                b.advanced.padding.left = parseInt(e.target.value) || 0;
                                return b;
                              })
                            }
                            className="w-full py-1 text-center bg-white border border-slate-300 rounded text-slate-900"
                          />
                          <span className="text-slate-500">Left</span>
                        </div>
                      </div>
                    </div>

                    {/* Z-Index & CSS ID */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Z-Index</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={selectedBlock.advanced?.zIndex ?? ''}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.advanced) b.advanced = {};
                              b.advanced.zIndex = parseInt(e.target.value) || 0;
                              return b;
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">CSS ID</label>
                        <input
                          type="text"
                          placeholder="my-section"
                          value={selectedBlock.advanced?.cssId || ''}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.advanced) b.advanced = {};
                              b.advanced.cssId = e.target.value;
                              return b;
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs"
                        />
                      </div>
                    </div>

                    {/* Responsive Visibility Toggles */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <span className="font-bold text-slate-800 text-xs block">Responsive Visibility</span>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-600">Hide on Desktop</span>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedBlock.advanced?.hideOnDesktop)}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.advanced) b.advanced = {};
                              b.advanced.hideOnDesktop = e.target.checked;
                              return b;
                            })
                          }
                          className="rounded text-[#e2285c] focus:ring-[#e2285c]"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-600">Hide on Tablet</span>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedBlock.advanced?.hideOnTablet)}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.advanced) b.advanced = {};
                              b.advanced.hideOnTablet = e.target.checked;
                              return b;
                            })
                          }
                          className="rounded text-[#e2285c] focus:ring-[#e2285c]"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-slate-600">Hide on Mobile</span>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedBlock.advanced?.hideOnMobile)}
                          onChange={(e) =>
                            updateSelectedBlock((b) => {
                              if (!b.advanced) b.advanced = {};
                              b.advanced.hideOnMobile = e.target.checked;
                              return b;
                            })
                          }
                          className="rounded text-[#e2285c] focus:ring-[#e2285c]"
                        />
                      </label>
                    </div>

                    {/* Custom CSS */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Custom CSS</label>
                      <textarea
                        rows={3}
                        placeholder="color: #e2285c; transform: rotate(1deg);"
                        value={selectedBlock.advanced?.customCss || ''}
                        onChange={(e) =>
                          updateSelectedBlock((b) => {
                            if (!b.advanced) b.advanced = {};
                            b.advanced.customCss = e.target.value;
                            return b;
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-[11px] text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Panel Bottom Footer */}
          <div className="h-11 bg-white border-t border-slate-200 px-3 flex items-center justify-between text-xs shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setShowPageSettingsModal(true)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Page Settings"
            >
              <Settings2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setShowNavigatorDrawer(!showNavigatorDrawer)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Navigator"
            >
              <Layers size={16} />
            </button>
            <button
              type="button"
              onClick={() => setShowTemplateLibraryModal(true)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Template Library"
            >
              <FolderOpen size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleSavePage()}
              disabled={saving}
              className="px-3.5 py-1 bg-[#008a20] hover:bg-[#00a32a] text-white font-bold rounded text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </aside>

        {/* ─── SIDEBAR TOGGLE ARROW (Iconic Elementor collapse handle) ────── */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-[340px] sm:left-[380px] top-1/2 -translate-y-1/2 z-40 w-4 h-12 bg-white hover:bg-[#e2285c] text-slate-600 hover:text-white border border-slate-300 border-l-0 rounded-r flex items-center justify-center transition cursor-pointer shadow-md font-bold text-xs"
          style={{ left: sidebarOpen ? undefined : 0 }}
          title={sidebarOpen ? 'Hide Panel' : 'Show Panel'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        {/* ─── RIGHT CANVAS: DIRECT LIVE SITE RENDERING ───────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#edf0f5] p-4 sm:p-6 flex flex-col items-center">
          <div
            className={`transition-all duration-300 w-full min-h-full bg-white text-slate-900 shadow-xl relative ${
              deviceView === 'tablet'
                ? 'max-w-[768px] my-6 rounded-2xl border-8 border-slate-300'
                : deviceView === 'mobile'
                ? 'max-w-[375px] my-6 rounded-3xl border-8 border-slate-300'
                : 'max-w-full rounded-none'
            }`}
          >
            {/* Live Block Elements List */}
            {blocks.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 mx-auto flex items-center justify-center text-[#e2285c]">
                  <Layout size={32} />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-800">Start Building Your Page</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Drag widgets from the left panel or choose from our pre-designed luxury atelier templates.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTemplateLibraryModal(true)}
                    className="px-5 py-2.5 bg-[#e2285c] text-white font-semibold rounded-lg text-xs shadow-md hover:bg-rose-600 transition cursor-pointer flex items-center gap-2"
                  >
                    <FolderOpen size={14} />
                    <span>Browse Templates</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {blocks.map((block, index) => {
                  const isSelected = selectedBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlockId(block.id);
                        if (!sidebarOpen) setSidebarOpen(true);
                      }}
                      className={`group relative transition ${
                        isSelected
                          ? 'ring-2 ring-[#e2285c] z-10'
                          : 'hover:ring-1 hover:ring-[#2271b1]'
                      }`}
                    >
                      {/* Section Top Controls (Iconic Elementor [+] [:::] [x]) */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition flex items-center bg-[#2271b1] text-white rounded-md shadow-md text-[11px] overflow-hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStructureInsertIndex(index);
                          }}
                          className="px-2 py-1 hover:bg-[#135e96] transition cursor-pointer"
                          title="Add Section Above"
                        >
                          <Plus size={12} />
                        </button>
                        <div
                          className="px-2.5 py-1 bg-[#135e96] font-bold cursor-move flex items-center gap-1 select-none"
                          title="Section Handle"
                        >
                          <span className="tracking-widest">:::</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(block.id);
                          }}
                          className="px-2 py-1 hover:bg-red-600 transition cursor-pointer"
                          title="Delete Section"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {/* Element Type Tag on Top Left */}
                      <div
                        className={`absolute top-0 left-2 -translate-y-1/2 z-20 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition shadow-xs ${
                          isSelected ? 'bg-[#e2285c] text-white' : 'bg-[#2271b1] text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {block.type.replace('_', ' ')}
                      </div>

                      {/* Rendered Live Block */}
                      <BlockRenderer
                        block={block}
                        isInteractive={false}
                        deviceView={deviceView}
                        onDataChange={handleInlineBlockDataChange}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── ICONIC ELEMENTOR DASHER ADD SECTION ── */}
            <div className="p-8 my-6 mx-4 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center space-y-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                {/* Pink Add (+) Button */}
                <button
                  type="button"
                  onClick={() => setStructureInsertIndex(blocks.length)}
                  className="w-12 h-12 rounded-full bg-[#e2285c] hover:bg-rose-600 text-white flex items-center justify-center transition shadow-lg cursor-pointer transform hover:scale-105"
                  title="Add New Section / Container"
                >
                  <Plus size={24} />
                </button>

                {/* Light Template (Folder) Button */}
                <button
                  type="button"
                  onClick={() => setShowTemplateLibraryModal(true)}
                  className="w-12 h-12 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center transition shadow-md cursor-pointer transform hover:scale-105"
                  title="Add Template from Library"
                >
                  <FolderOpen size={20} />
                </button>
              </div>

              <span className="text-xs text-slate-500 font-medium tracking-wide">
                Drag widget here or click + to add structure
              </span>

              {/* Structure Selector (If (+) was clicked) */}
              {structureInsertIndex !== null && (
                <div className="w-full max-w-xl bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select Your Structure
                    </span>
                    <button
                      type="button"
                      onClick={() => setStructureInsertIndex(null)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                    {/* 1 Col */}
                    <button
                      type="button"
                      onClick={() => handleAddContainerStructure(1, structureInsertIndex)}
                      className="p-2 border border-slate-200 hover:border-[#e2285c] bg-slate-50 hover:bg-rose-50/40 rounded-lg flex flex-col items-center gap-1.5 transition cursor-pointer group"
                    >
                      <div className="w-full h-8 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                      <span className="text-[10px] text-slate-600">1 Col</span>
                    </button>

                    {/* 2 Cols 50/50 */}
                    <button
                      type="button"
                      onClick={() => handleAddContainerStructure(2, structureInsertIndex)}
                      className="p-2 border border-slate-200 hover:border-[#e2285c] bg-slate-50 hover:bg-rose-50/40 rounded-lg flex flex-col items-center gap-1.5 transition cursor-pointer group"
                    >
                      <div className="w-full h-8 flex gap-1">
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                      </div>
                      <span className="text-[10px] text-slate-600">2 Cols</span>
                    </button>

                    {/* 3 Cols */}
                    <button
                      type="button"
                      onClick={() => handleAddContainerStructure(3, structureInsertIndex)}
                      className="p-2 border border-slate-200 hover:border-[#e2285c] bg-slate-50 hover:bg-rose-50/40 rounded-lg flex flex-col items-center gap-1.5 transition cursor-pointer group"
                    >
                      <div className="w-full h-8 flex gap-1">
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                      </div>
                      <span className="text-[10px] text-slate-600">3 Cols</span>
                    </button>

                    {/* 4 Cols */}
                    <button
                      type="button"
                      onClick={() => handleAddContainerStructure(4, structureInsertIndex)}
                      className="p-2 border border-slate-200 hover:border-[#e2285c] bg-slate-50 hover:bg-rose-50/40 rounded-lg flex flex-col items-center gap-1.5 transition cursor-pointer group"
                    >
                      <div className="w-full h-8 flex gap-0.5">
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="flex-1 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                      </div>
                      <span className="text-[10px] text-slate-600">4 Cols</span>
                    </button>

                    {/* 1/3 + 2/3 */}
                    <button
                      type="button"
                      onClick={() => handleAddContainerStructure('1/3-2/3', structureInsertIndex)}
                      className="p-2 border border-slate-200 hover:border-[#e2285c] bg-slate-50 hover:bg-rose-50/40 rounded-lg flex flex-col items-center gap-1.5 transition cursor-pointer group"
                    >
                      <div className="w-full h-8 flex gap-1">
                        <div className="w-1/3 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="w-2/3 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                      </div>
                      <span className="text-[10px] text-slate-600">1/3 + 2/3</span>
                    </button>

                    {/* 2/3 + 1/3 */}
                    <button
                      type="button"
                      onClick={() => handleAddContainerStructure('2/3-1/3', structureInsertIndex)}
                      className="p-2 border border-slate-200 hover:border-[#e2285c] bg-slate-50 hover:bg-rose-50/40 rounded-lg flex flex-col items-center gap-1.5 transition cursor-pointer group"
                    >
                      <div className="w-full h-8 flex gap-1">
                        <div className="w-2/3 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                        <div className="w-1/3 bg-slate-200 group-hover:bg-[#e2285c]/20 rounded" />
                      </div>
                      <span className="text-[10px] text-slate-600">2/3 + 1/3</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL A: PAGE SEO & SETTINGS MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {showPageSettingsModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-slate-900">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm flex items-center gap-2 text-slate-800">
                <Settings2 size={16} className="text-[#e2285c]" />
                <span>Page Settings & SEO</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPageSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Page Title</label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">URL Slug</label>
                <input
                  type="text"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Meta SEO Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Luxury Modest Couture Dubai | Saba Al Wadi"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Meta SEO Description</label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded text-[#e2285c] focus:ring-[#e2285c]"
                />
                <span className="font-semibold text-slate-800">Publish this page to the public website</span>
              </label>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPageSettingsModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSavePage();
                  setShowPageSettingsModal(false);
                }}
                className="px-5 py-2 bg-[#008a20] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#00a32a]"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL B: TEMPLATE LIBRARY MODAL
         ══════════════════════════════════════════════════════════════════════ */}
      {showTemplateLibraryModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in text-slate-900">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-[#e2285c]" />
                <h3 className="font-bold text-sm text-slate-800">Saba Al Wadi Atelier Template Library</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateLibraryModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAGE_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-white border border-slate-200 hover:border-[#e2285c] rounded-xl p-5 space-y-3 flex flex-col justify-between transition group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-[#e2285c] font-bold uppercase tracking-wider">
                        {tmpl.badge}
                      </span>
                      <span className="text-xs text-slate-500">{tmpl.blocks.length} Sections</span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-slate-900 group-hover:text-[#e2285c] transition">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">/{tmpl.suggestedSlug}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Load "${tmpl.name}"? This will append the template sections.`)) {
                          updateBlocksWithHistory([...blocks, ...tmpl.blocks]);
                          setShowTemplateLibraryModal(false);
                        }
                      }}
                      className="px-4 py-1.5 bg-[#e2285c] hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      Insert Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DRAWER C: DOM STRUCTURE NAVIGATOR
         ══════════════════════════════════════════════════════════════════════ */}
      {showNavigatorDrawer && (
        <div className="fixed right-4 bottom-16 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-900">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
              <Layers size={13} className="text-[#e2285c]" />
              <span>Navigator</span>
            </span>
            <button
              type="button"
              onClick={() => setShowNavigatorDrawer(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={12} />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
            {blocks.map((b, idx) => {
              const isSelected = selectedBlockId === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedBlockId(b.id);
                    if (!sidebarOpen) setSidebarOpen(true);
                  }}
                  className={`px-2.5 py-2 flex items-center justify-between rounded cursor-pointer transition ${
                    isSelected ? 'bg-[#e2285c] text-white font-bold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">
                    {idx + 1}. {b.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveBlock(b.id, 'up')}
                      className="p-0.5 hover:text-slate-900 text-slate-400 disabled:opacity-30"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === blocks.length - 1}
                      onClick={() => handleMoveBlock(b.id, 'down')}
                      className="p-0.5 hover:text-slate-900 text-slate-400 disabled:opacity-30"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
