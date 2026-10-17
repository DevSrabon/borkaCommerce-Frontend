'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { PageBlock, BlockType, CMSPage } from '@/types/page-builder';
import PageBuilderCanvas from '@/components/page-builder/PageBuilderCanvas';
import AddBlockModal from '@/components/page-builder/AddBlockModal';
import BlockSettingsModal from '@/components/page-builder/BlockSettingsModal';
import { PAGE_TEMPLATES, PageTemplateInfo } from '@/components/page-builder/pageTemplates';

// Block Palette definitions for the WordPress-like side drawer
const PALETTE_BLOCKS: {
  type: BlockType;
  title: string;
  category: string;
  icon: React.ElementType;
  description: string;
  defaultData: Record<string, any>;
}[] = [
  {
    type: 'HERO',
    title: 'Hero Banner',
    category: 'Header',
    icon: Layout,
    description: 'Prominent showcase header with badge, title, subtitle & CTAs',
    defaultData: {
      badge: 'Bespoke Atelier',
      title: 'Timeless Modest Elegance',
      subtitle: 'Redefining modesty with architectural silhouettes and premium textiles.',
      alignment: 'center',
      background_type: 'gradient',
      primary_button: { label: 'Explore Collection', url: '/catalog' },
      secondary_button: { label: 'Learn More', url: '#story' },
    },
  },
  {
    type: 'TWO_COLUMN',
    title: 'Two Column (Story + Image)',
    category: 'Content',
    icon: Columns,
    description: 'Split section for atelier heritage, craftsmanship, or styling',
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
    title: 'Features & Values Grid',
    category: 'Content',
    icon: Grid,
    description: '3 or 4 column grid showcasing brand pillars and unique services',
    defaultData: {
      heading: 'Why Connoisseurs Choose Us',
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
    type: 'STATS_COUNTER',
    title: 'Stats & Metrics Counter',
    category: 'Social Proof',
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
    type: 'TESTIMONIALS',
    title: 'Client Testimonials',
    category: 'Social Proof',
    icon: MessageSquare,
    description: 'Authentic patron quotes, star ratings, and locations',
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
    category: 'Content',
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
    type: 'CTA_BANNER',
    title: 'Call to Action Banner',
    category: 'Conversion',
    icon: Megaphone,
    description: 'High-converting banner driving visitors to collection or contact',
    defaultData: {
      title: 'Experience The Luxury Collection',
      subtitle: 'Hand-embroidered abayas crafted to inspire grace and reverence.',
      button_text: 'Shop New Arrivals',
      button_link: '/catalog',
    },
  },
  {
    type: 'RICH_TEXT',
    title: 'Rich Text / Legal Article',
    category: 'Content',
    icon: FileText,
    description: 'Formatted typography for policies, privacy terms, and detailed stories',
    defaultData: {
      title: 'Section Title',
      max_width: 'normal',
      html_content: '<p>Write your detailed story, policies, or terms content here...</p>',
    },
  },
  {
    type: 'MAP',
    title: 'Interactive Map & Location',
    category: 'Contact',
    icon: MapPin,
    description: 'Google Maps embed with boutique addresses, phone & hours',
    defaultData: {
      title: 'Visit Our Flagship Boutique',
      subtitle: 'Experience our bespoke modest collections in person',
      map_url: 'https://maps.google.com/maps?q=Downtown+Dubai&t=&z=14&ie=UTF8&iwloc=&output=embed',
      address: 'Suit No: M-49, 2nd Floor, Al Habtoor Building, Abu Hail, Deira-Dubai, UAE',
      phone: '+971 55 642 4758',
      email: 'contact@sabaalwadi.com',
      hours: 'Sat - Thu: 09:00 AM - 11:00 PM',
      map_height: 420,
      layout: 'split',
      show_card: true,
    },
  },
  {
    type: 'SPACER',
    title: 'Spacer & Divider',
    category: 'Layout',
    icon: Minus,
    description: 'Add vertical breathing room or subtle dividers between blocks',
    defaultData: {
      height: 48,
      has_divider: true,
    },
  },
  {
    type: 'IMAGE',
    title: 'Single Image / Visual Banner',
    category: 'Media',
    icon: Layout,
    description: 'Standalone image section with caption, custom aspect ratio, link & rounded corners',
    defaultData: {
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80',
      caption: 'Saba Al Wadi Autumn Haute Couture Lookbook',
      alt_text: 'Luxury modest wear collection',
      aspect_ratio: '16/9',
      max_width: 'boxed',
      link_url: '/catalog',
      overlay_badge: 'Exclusive Atelier',
      overlay_title: 'Handcrafted With Uncompromising Modesty',
    },
  },
  {
    type: 'CARDS_GRID',
    title: 'Content & Product Cards Grid',
    category: 'Content',
    icon: Layers,
    description: 'Showcase abaya pieces, seasonal collections, or highlights in interactive cards',
    defaultData: {
      title: 'Curated Seasonal Highlights',
      subtitle: 'Hand-tailored creations in limited quantities for discerning clients',
      columns: 3,
      cards: [
        {
          image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
          badge: 'Best Seller',
          title: 'Royal Nada Open Abaya',
          description: 'Pure Korean Nada textile with hand-embellished crystal sleeves and architectural drape.',
          tag: 'AED 450',
          button_label: 'View Piece',
          button_url: '/catalog',
        },
        {
          image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
          badge: 'Atelier Signature',
          title: 'Midnight Black French Crepe',
          description: 'Floor-sweeping architectural silhouette designed for graceful, dignified modesty.',
          tag: 'AED 520',
          button_label: 'View Piece',
          button_url: '/catalog',
        },
        {
          image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
          badge: 'New Arrival',
          title: 'Champagne Gold Embroidered Set',
          description: 'Complete 3-piece set with matching silk chiffon Sheila and tailored sleeves.',
          tag: 'AED 610',
          button_label: 'View Piece',
          button_url: '/catalog',
        },
      ],
    },
  },
  {
    type: 'GALLERY',
    title: 'Image Gallery / Lookbook Grid',
    category: 'Media',
    icon: Grid,
    description: 'Multi-image lookbook gallery showcasing atelier craftsmanship, fabrics, and styling',
    defaultData: {
      title: 'Atelier Lookbook Gallery',
      subtitle: 'A visual celebration of modest couture and artisanal craftsmanship',
      columns: 3,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
          caption: 'Hand Embroidery Details',
          link: '/catalog',
        },
        {
          url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
          caption: 'Silk Chiffon Drapes',
          link: '/catalog',
        },
        {
          url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
          caption: 'Bespoke Atelier Workshop',
          link: '/catalog',
        },
      ],
    },
  },
];

import { useModal } from '@/components/common/LuxuryModal';

export default function PageBuilderEditorPage() {
  const params = useParams();
  const pageId = params?.id as string;
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const { showAlert } = useModal();

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

  // WordPress-style Customizer Panel State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'elements' | 'outline' | 'settings'>('elements');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [paletteSearch, setPaletteSearch] = useState('');
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);

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
          showAlert('Could not find the requested CMS page.', 'Page Not Found', 'warning');
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

  const handleSavePage = useCallback(async (publishOverride?: boolean) => {
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
        showAlert(err.message || 'Failed to save page', 'Save Failed', 'error');
      }
    } catch (err) {
      console.error('Error saving page:', err);
      showAlert('Network error saving page. Please check your connection.', 'Network Error', 'error');
    } finally {
      setSaving(false);
    }
  }, [token, pageId, isPublished, title, slug, blocks, metaTitle, metaDescription, showAlert]);

  // Keyboard shortcut: Ctrl + S / Cmd + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSavePage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSavePage]);

  // Insert block handler
  const handleAddBlock = (newBlock: PageBlock) => {
    if (insertIndex !== undefined && insertIndex >= 0) {
      const next = [...blocks];
      next.splice(insertIndex, 0, newBlock);
      setBlocks(next);
    } else {
      setBlocks((prev) => [...prev, newBlock]);
    }
    setInsertIndex(undefined);
  };

  // Instant add from palette
  const handleQuickAddBlock = (def: (typeof PALETTE_BLOCKS)[0]) => {
    const newBlock: PageBlock = {
      id: `block-${def.type.toLowerCase()}-${Date.now()}`,
      type: def.type,
      data: JSON.parse(JSON.stringify(def.defaultData)),
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  // 1-Click Starter Template Loader (About Us, Contact Us, Privacy Policy, Terms)
  const handleLoadStarterTemplate = (template: PageTemplateInfo) => {
    if (blocks.length > 0) {
      if (!confirm(`This will replace your current page sections with the "${template.name}" template. Proceed?`)) {
        return;
      }
    }
    setBlocks(template.blocks);
    setShowTemplatesDropdown(false);

    // Auto-fill title, slug, and meta if newly created
    if (!title || title.toLowerCase().includes('untitled') || title.toLowerCase().includes('new page')) {
      setTitle(template.suggestedTitle);
      setSlug(template.suggestedSlug);
      setMetaTitle(template.suggestedTitle);
      setMetaDescription(template.suggestedMetaDesc);
    }
  };

  const handleUpdateBlock = (updated: PageBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setBlocks(next);
  };

  const handleDuplicateBlock = (index: number) => {
    const original = blocks[index];
    const clone: PageBlock = {
      id: `block-${original.type.toLowerCase()}-${Date.now()}`,
      type: original.type,
      data: JSON.parse(JSON.stringify(original.data)),
    };
    const next = [...blocks];
    next.splice(index + 1, 0, clone);
    setBlocks(next);
  };

  const handleDeleteBlock = (index: number) => {
    if (confirm('Are you sure you want to delete this section?')) {
      setBlocks((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const filteredPaletteBlocks = PALETTE_BLOCKS.filter(
    (b) =>
      b.title.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      b.description.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xs text-muted-foreground flex-col gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold tracking-wider uppercase">Loading WordPress-Style Customizer...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ─── TOP WORDPRESS-STYLE BUILDER HEADER ───────────────────────────────── */}
      <header className="h-16 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/pages"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
            title="Back to Pages List"
          >
            <ArrowLeft size={16} />
          </Link>

          {/* Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isSidebarOpen
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            title={isSidebarOpen ? 'Collapse Left Customizer' : 'Expand Left Customizer'}
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            <span className="hidden md:inline">{isSidebarOpen ? 'Hide Panel' : 'Show Panel'}</span>
          </button>

          {/* Page Title & Live Slug */}
          <div className="flex flex-col min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page Title (e.g. About Us)"
              className="bg-transparent font-serif font-bold text-sm sm:text-base text-foreground focus:outline-none focus:border-b border-primary truncate max-w-[260px] sm:max-w-md"
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono text-[11px] truncate">/{slug}</span>
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                title={isSlugLocked ? 'Edit URL slug' : 'Lock slug'}
              >
                {isSlugLocked ? <Lock size={10} /> : <Unlock size={10} className="text-primary" />}
              </button>
              {!isSlugLocked && (
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-background border border-border rounded px-1.5 py-0.5 text-xs font-mono w-28"
                />
              )}
            </div>
          </div>
        </div>

        {/* Device Viewport Selector (Middle) */}
        <div className="hidden lg:flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border shadow-xs">
          <button
            type="button"
            onClick={() => setDeviceView('desktop')}
            className={`p-1.5 px-3 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
              deviceView === 'desktop'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Monitor size={13} />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('tablet')}
            className={`p-1.5 px-3 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
              deviceView === 'tablet'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tablet size={13} />
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('mobile')}
            className={`p-1.5 px-3 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
              deviceView === 'mobile'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone size={13} />
            <span>Mobile</span>
          </button>
        </div>

        {/* Actions Toolbar (Right) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1-Click Starter Templates Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplatesDropdown(!showTemplatesDropdown)}
              className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Load Pre-designed Boutique Templates"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Starter Templates</span>
              <ChevronDown size={12} />
            </button>

            {showTemplatesDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-bold text-foreground">1-Click Starter Templates</p>
                  <p className="text-[11px] text-muted-foreground">Select a pre-built luxury layout</p>
                </div>
                {PAGE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleLoadStarterTemplate(tmpl)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-accent transition text-xs flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="mt-0.5 p-1 rounded bg-primary/10 text-primary shrink-0">
                      {tmpl.id === 'about-us' && <Sparkles size={14} />}
                      {tmpl.id === 'contact-us' && <Phone size={14} />}
                      {tmpl.id === 'privacy-policy' && <Shield size={14} />}
                      {tmpl.id === 'terms-of-service' && <FileCheck size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                        <span className="truncate">{tmpl.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">{tmpl.badge}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{tmpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEO Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowSeoModal(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-border hover:bg-accent text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Configure SEO & Social Meta Tags"
          >
            <Settings2 size={14} />
            <span className="hidden md:inline">SEO</span>
          </button>

          {/* Publish / Draft Switch */}
          <button
            type="button"
            onClick={() => {
              const next = !isPublished;
              setIsPublished(next);
              handleSavePage(next);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isPublished
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
            }`}
          >
            <Globe size={13} />
            <span>{isPublished ? 'Published' : 'Draft'}</span>
          </button>

          {/* Save Button with Ctrl+S */}
          <button
            type="button"
            onClick={() => handleSavePage()}
            disabled={saving}
            className="px-4 py-1.5 btn-luxury rounded-lg text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            title="Save Page Changes (Ctrl + S)"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* View Live Page */}
          <Link
            href={`/${slug}`}
            target="_blank"
            className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
            title="Preview Live Page in New Window"
          >
            <ExternalLink size={15} />
          </Link>
        </div>
      </header>

      {/* ─── WORKSPACE (LEFT CUSTOMIZER PANEL + CANVAS) ─────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left WordPress-Style Customizer Panel */}
        {isSidebarOpen && (
          <aside className="w-80 sm:w-96 border-r border-border bg-card/95 backdrop-blur-md flex flex-col z-20 shrink-0 shadow-xl transition-all">
            {/* Panel Tabs Header */}
            <div className="flex items-center border-b border-border p-1.5 bg-background/50 text-xs">
              <button
                type="button"
                onClick={() => setSidebarTab('elements')}
                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  sidebarTab === 'elements'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Plus size={14} />
                <span>Blocks</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('outline')}
                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  sidebarTab === 'outline'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers size={14} />
                <span>Layers ({blocks.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('settings')}
                className={`flex-1 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  sidebarTab === 'settings'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings2 size={14} />
                <span>Settings</span>
              </button>
            </div>

            {/* TAB 1: ELEMENTS PALETTE */}
            {sidebarTab === 'elements' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Search Blocks */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={paletteSearch}
                    onChange={(e) => setPaletteSearch(e.target.value)}
                    placeholder="Search blocks (hero, map, faq...)"
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* 1-Click Starter Kits Quick Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Quick Templates
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {PAGE_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleLoadStarterTemplate(tmpl)}
                        className="p-2.5 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 text-left transition cursor-pointer group shadow-2xs"
                      >
                        <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {tmpl.id === 'about-us' && '🌟 About Us'}
                          {tmpl.id === 'contact-us' && '📞 Contact Us'}
                          {tmpl.id === 'privacy-policy' && '🔒 Privacy Policy'}
                          {tmpl.id === 'terms-of-service' && '📜 Terms of Service'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {tmpl.blocks.length} sections
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blocks Grid */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Add Sections &amp; Blocks
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {filteredPaletteBlocks.map((blockDef) => {
                      const Icon = blockDef.icon;
                      return (
                        <button
                          key={blockDef.type}
                          type="button"
                          onClick={() => handleQuickAddBlock(blockDef)}
                          className="w-full p-2.5 rounded-lg border border-border bg-background hover:bg-accent/40 hover:border-primary/60 transition text-left flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {blockDef.title}
                              </h4>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {blockDef.description}
                              </p>
                            </div>
                          </div>
                          <Plus size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OUTLINE & LAYERS NAVIGATOR */}
            {sidebarTab === 'outline' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Page Sections ({blocks.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInsertIndex(blocks.length);
                      setShowAddModal(true);
                    }}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>

                {blocks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No blocks added yet. Click Blocks to insert.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {blocks.map((block, idx) => {
                      const blockTitle =
                        block.data.heading ||
                        block.data.title ||
                        block.data.badge ||
                        `${block.type} Section`;

                      return (
                        <div
                          key={block.id}
                          className="p-2.5 rounded-lg border border-border bg-background hover:border-primary/40 transition flex items-center justify-between gap-2 text-xs group"
                        >
                          <div
                            onClick={() => setEditingBlock(block)}
                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                            title="Click to edit block properties"
                          >
                            <span className="font-mono text-[11px] text-muted-foreground w-4">
                              {idx + 1}.
                            </span>
                            <span className="font-semibold text-foreground truncate">
                              {blockTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingBlock(block)}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Settings"
                            >
                              <Settings2 size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveBlock(idx, 'up')}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === blocks.length - 1}
                              onClick={() => handleMoveBlock(idx, 'down')}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateBlock(idx)}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(idx)}
                              className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAGE SETTINGS & LIVE SEO PREVIEW */}
            {sidebarTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Page Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. About Us"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-foreground">URL Slug</label>
                    <button
                      type="button"
                      onClick={() => setIsSlugLocked(!isSlugLocked)}
                      className="text-primary text-[11px] hover:underline cursor-pointer"
                    >
                      {isSlugLocked ? 'Unlock to Edit' : 'Lock Slug'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-mono">/</span>
                    <input
                      type="text"
                      disabled={isSlugLocked}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-foreground">Publication Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPublished(false)}
                      className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        !isPublished
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-500'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublished(true)}
                      className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        isPublished
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-500'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      Published
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Settings2 size={13} className="text-primary" />
                    SEO Search Engine Preview
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">Meta Title</label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder={title}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">Meta Description</label>
                      <textarea
                        rows={3}
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Concise summary for Google search results..."
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                      />
                    </div>

                    {/* Google SERP Snippet Preview */}
                    <div className="p-3 rounded-lg bg-background border border-border space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Google Search Preview
                      </span>
                      <p className="text-blue-500 font-medium text-xs truncate">
                        {metaTitle || title || 'Page Title'} | Saba Al Wadi
                      </p>
                      <p className="text-emerald-600 text-[11px] truncate">
                        https://sabaalwadi.com/{slug}
                      </p>
                      <p className="text-muted-foreground text-[11px] line-clamp-2">
                        {metaDescription || 'Discover our luxury modest abayas and bespoke couture collections in Dubai.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Live Canvas Area with Device Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageBuilderCanvas
            blocks={blocks}
            onChangeBlocks={setBlocks}
            onEditBlock={(block) => setEditingBlock(block)}
            onOpenAddModal={(idx) => {
              setInsertIndex(idx);
              setShowAddModal(true);
            }}
            onLoadTemplate={(tmpl) => handleLoadStarterTemplate(tmpl)}
            deviceView={deviceView}
            onDeviceViewChange={(v) => setDeviceView(v)}
          />
        </div>
      </div>

      {/* Floating Save Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 size={16} />
          Page changes saved successfully!
        </div>
      )}

      {/* Modal: Add Block / Template */}
      <AddBlockModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddBlock={handleAddBlock}
        onLoadTemplate={(tmplBlocks) => {
          if (blocks.length > 0) {
            if (!confirm('This will replace current blocks with the template. Continue?')) return;
          }
          setBlocks(tmplBlocks);
        }}
      />

      {/* Modal: Block Settings Inspector */}
      <BlockSettingsModal
        block={editingBlock}
        isOpen={Boolean(editingBlock)}
        onClose={() => setEditingBlock(null)}
        onSave={handleUpdateBlock}
      />

      {/* Modal: SEO Settings Standalone Modal */}
      {showSeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              SEO &amp; Social Metadata
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
                className="px-4 py-2 border border-border rounded hover:bg-accent cursor-pointer text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
