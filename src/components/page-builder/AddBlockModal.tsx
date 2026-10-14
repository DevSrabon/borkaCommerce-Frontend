'use client';

import React from 'react';
import {
  X,
  Layout,
  Columns,
  Grid,
  BarChart3,
  MessageSquare,
  HelpCircle,
  Megaphone,
  FileText,
  Minus,
  Sparkles,
  BookOpen,
  PhoneCall,
  MapPin,
} from 'lucide-react';
import { BlockType, PageBlock } from '@/types/page-builder';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBlock: (block: PageBlock) => void;
  onLoadTemplate: (blocks: PageBlock[]) => void;
}

const BLOCK_DEFINITIONS: {
  type: BlockType;
  title: string;
  description: string;
  icon: React.ElementType;
  defaultData: Record<string, any>;
}[] = [
  {
    type: 'HERO',
    title: 'Hero Banner',
    description: 'Prominent header section with title, badge, background and CTA buttons',
    icon: Layout,
    defaultData: {
      badge: 'Bespoke Atelier',
      title: 'Timeless Modest Elegance',
      subtitle: 'Redefining modesty with architectural silhouettes and premium textiles.',
      alignment: 'center',
      background_type: 'gradient',
      primary_button: { label: 'Explore Collection', url: '/catalog' },
      secondary_button: { label: 'Learn More', url: '#about' },
    },
  },
  {
    type: 'TWO_COLUMN',
    title: 'Two Column (Image + Text)',
    description: 'Split section for telling your brand story, craftsmanship, or materials',
    icon: Columns,
    defaultData: {
      heading: 'Our Craftsmanship & Heritage',
      subheading: 'ARTISANAL PERFECTION',
      content:
        'Every garment is crafted with meticulous attention to detail, using imported breathable silk and Japanese crepes.',
      image_url:
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
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
    title: 'Features / Values Grid',
    description: '3 or 4 column grid highlighting key value propositions and pillars',
    icon: Grid,
    defaultData: {
      heading: 'Why Connoisseurs Choose Us',
      subtitle: 'Crafted with reverence for both faith and high fashion',
      columns: 4,
      items: [
        { icon: 'Sparkles', title: 'Master Tailoring', description: 'Flowing drapery designed for ultimate modesty.' },
        { icon: 'Shield', title: 'Imported Textiles', description: 'Premium Nida and Japanese crepe fabrics.' },
        { icon: 'Truck', title: 'Express Delivery', description: 'Complimentary shipping across UAE & Bangladesh.' },
        { icon: 'Award', title: 'Quality Guarantee', description: 'Hand-inspected before luxurious packaging.' },
      ],
    },
  },
  {
    type: 'STATS_COUNTER',
    title: 'Stats & Metrics Counter',
    description: 'Showcase brand credibility with bold numbers and achievements',
    icon: BarChart3,
    defaultData: {
      title: 'Our Journey in Numbers',
      stats: [
        { number: '25,000+', label: 'Delighted Clients' },
        { number: '100%', label: 'Pure Imported Fabrics' },
        { number: '35+', label: 'Global Destinations' },
        { number: '4.9/5', label: 'Satisfaction Rating' },
      ],
    },
  },
  {
    type: 'TESTIMONIALS',
    title: 'Customer Testimonials',
    description: 'Quotes, client reviews, 5-star ratings, and endorsements',
    icon: MessageSquare,
    defaultData: {
      title: 'Client Accolades',
      subtitle: 'Words from our cherished patrons',
      items: [
        {
          quote: 'The stitch quality and fabric weight are beyond anything I have purchased before.',
          author: 'Layla Al-Maktoum',
          role: 'Dubai, UAE',
          rating: 5,
        },
        {
          quote: 'Arrived beautifully packaged in signature luxury box. Outstanding craftsmanship.',
          author: 'Sadia Jahan',
          role: 'Dhaka, Bangladesh',
          rating: 5,
        },
      ],
    },
  },
  {
    type: 'FAQ_ACCORDION',
    title: 'FAQ Accordion',
    description: 'Collapsible questions and answers for sizing, shipping, or care',
    icon: HelpCircle,
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
    description: 'High-converting banner to guide visitors towards the shop or contact',
    icon: Megaphone,
    defaultData: {
      title: 'Experience The Luxury Collection',
      subtitle: 'Hand-embroidered abayas crafted to inspire grace and reverence.',
      button_text: 'Shop New Arrivals',
      button_link: '/catalog',
    },
  },
  {
    type: 'RICH_TEXT',
    title: 'Rich Text / Article',
    description: 'Formatted paragraphs, headings, bullet lists, and custom HTML content',
    icon: FileText,
    defaultData: {
      title: 'Article Section',
      max_width: 'normal',
      html_content: '<p>Write your detailed story or policy information here...</p>',
    },
  },
  {
    type: 'SPACER',
    title: 'Spacer & Divider',
    description: 'Add breathing room or a subtle stylish divider between sections',
    icon: Minus,
    defaultData: {
      height: 48,
      has_divider: true,
    },
  },
  {
    type: 'MAP',
    title: 'Interactive Map & Location',
    description: 'Google Maps embed with boutique address, hours, directions, and store card',
    icon: MapPin,
    defaultData: {
      title: 'Visit Our Flagship Boutique',
      subtitle: 'Experience our bespoke modest collections in person',
      map_url: 'https://maps.google.com/maps?q=Downtown+Dubai&t=&z=14&ie=UTF8&iwloc=&output=embed',
      address: 'Fashion Avenue, The Dubai Mall, Financial Center Rd, Downtown Dubai, UAE',
      phone: '+971 4 123 4567',
      email: 'boutique@borkacommerce.com',
      hours: 'Mon - Sun: 10:00 AM - 11:00 PM',
      map_height: 420,
      layout: 'split',
      show_card: true,
    },
  },
];

export default function AddBlockModal({
  isOpen,
  onClose,
  onAddBlock,
  onLoadTemplate,
}: AddBlockModalProps) {
  if (!isOpen) return null;

  const handleSelectBlock = (def: (typeof BLOCK_DEFINITIONS)[0]) => {
    const newBlock: PageBlock = {
      id: `block-${def.type.toLowerCase()}-${Date.now()}`,
      type: def.type,
      data: JSON.parse(JSON.stringify(def.defaultData)),
    };
    onAddBlock(newBlock);
    onClose();
  };

  const handleLoadAboutTemplate = () => {
    const aboutBlocks: PageBlock[] = [
      {
        id: `hero-${Date.now()}`,
        type: 'HERO',
        data: {
          badge: 'The House of Modesty & Prestige',
          title: 'Elegance Rooted in Grace, Modesty & Perfection',
          subtitle:
            'Crafted for women who cherish timeless elegance. Every thread celebrates heritage and contemporary modest couture.',
          alignment: 'center',
          background_type: 'gradient',
          primary_button: { label: 'Explore Collection', url: '/catalog' },
          secondary_button: { label: 'Our Story', url: '#story' },
        },
      },
      {
        id: `story-${Date.now()}`,
        type: 'TWO_COLUMN',
        data: {
          heading: 'Our Story & Bespoke Artistry',
          subheading: 'SINCE 2021 — DUBAI & DHAKA',
          content:
            'BorkaCommerce was born out of a profound passion for modest fashion that refuses to compromise on quality, comfort, or architectural silhouette.',
          image_url:
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
          image_position: 'left',
          highlights: [
            '100% Breathable & Lightweight Imported Fabrics',
            'Hand-embellished crystal & zardozi embroidery',
            'Tailored fits with flowing, modest silhouettes',
          ],
          cta_button: { label: 'View Collection', url: '/catalog' },
        },
      },
      {
        id: `stats-${Date.now()}`,
        type: 'STATS_COUNTER',
        data: {
          title: 'Recognized for Excellence Worldwide',
          stats: [
            { number: '25,000+', label: 'Delighted Clients' },
            { number: '100%', label: 'Pure Imported Fabrics' },
            { number: '35+', label: 'Countries Shipped' },
            { number: '4.9/5', label: 'Satisfaction Score' },
          ],
        },
      },
      {
        id: `features-${Date.now()}`,
        type: 'FEATURES_GRID',
        data: {
          heading: 'The Four Pillars of Our Craft',
          columns: 4,
          items: [
            { icon: 'Sparkles', title: 'Master Tailoring', description: 'Flowing drapery designed for modesty.' },
            { icon: 'Shield', title: 'Unrivaled Textiles', description: 'Directly imported fabrics.' },
            { icon: 'Truck', title: 'Global Express', description: 'Doorstep delivery worldwide.' },
            { icon: 'Award', title: 'Bespoke Alteration', description: 'Concierge sizing advice.' },
          ],
        },
      },
      {
        id: `faq-${Date.now()}`,
        type: 'FAQ_ACCORDION',
        data: {
          title: 'Frequently Asked Questions',
          items: [
            { question: 'What sizes are available?', answer: 'Sizes 50 to 60 inches length.' },
            { question: 'Do you offer worldwide shipping?', answer: 'Yes, DHL Express delivers globally in 3-5 days.' },
          ],
        },
      },
      {
        id: `cta-${Date.now()}`,
        type: 'CTA_BANNER',
        data: {
          title: 'Experience the Art of Modest Luxury',
          subtitle: 'Join our privileged circle and discover handcrafted garments.',
          button_text: 'Shop Now',
          button_link: '/catalog',
        },
      },
    ];
    onLoadTemplate(aboutBlocks);
    onClose();
  };

  const handleLoadContactTemplate = () => {
    const contactBlocks: PageBlock[] = [
      {
        id: `hero-${Date.now()}`,
        type: 'HERO',
        data: {
          badge: '24/7 Client Concierge',
          title: 'We Are Here For You',
          subtitle:
            'Have questions about bespoke tailoring, order tracking, or styling assistance? Our atelier concierge is ready to assist.',
          alignment: 'center',
          background_type: 'gradient',
          primary_button: { label: 'Start Live Chat', url: '/#chat' },
          secondary_button: { label: 'Email Care Team', url: 'mailto:support@borkacommerce.com' },
        },
      },
      {
        id: `features-${Date.now()}`,
        type: 'FEATURES_GRID',
        data: {
          heading: 'Direct Assistance Channels',
          subtitle: 'Reach out to us through any of our channels',
          columns: 3,
          items: [
            { icon: 'Sparkles', title: 'Live Chat', description: 'Instant answers via our website chat widget.' },
            { icon: 'Truck', title: 'Track Order', description: 'View real-time delivery status in your profile.' },
            { icon: 'Award', title: 'VIP Consultation', description: 'Schedule personal sizing and styling.' },
          ],
        },
      },
      {
        id: `faq-${Date.now()}`,
        type: 'FAQ_ACCORDION',
        data: {
          title: 'Frequently Asked Support Questions',
          items: [
            { question: 'How can I track my shipment?', answer: 'Log into your profile and click Orders to see live tracking.' },
            { question: 'What is your exchange policy?', answer: 'We offer hassle-free 7-day exchanges on unworn items.' },
          ],
        },
      },
      {
        id: `map-${Date.now()}`,
        type: 'MAP',
        data: {
          title: 'Flagship Atelier & Showroom',
          subtitle: 'Drop in to consult our master tailors or preview seasonal fabrics',
          map_url: 'https://maps.google.com/maps?q=Downtown+Dubai&t=&z=14&ie=UTF8&iwloc=&output=embed',
          address: 'Fashion Avenue, The Dubai Mall, Financial Center Rd, Downtown Dubai, UAE',
          phone: '+971 4 123 4567',
          email: 'boutique@borkacommerce.com',
          hours: 'Mon - Sun: 10:00 AM - 11:00 PM',
          map_height: 440,
          layout: 'split',
          show_card: true,
        },
      },
    ];
    onLoadTemplate(contactBlocks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background">
          <div>
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Add Block to Page
            </h3>
            <p className="text-xs text-muted-foreground">
              Select a component to insert or load a ready-made page template
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Templates Banner */}
        <div className="bg-primary/5 border-b border-primary/20 px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <BookOpen size={14} />
            Quick Start Starter Kits:
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadAboutTemplate}
              className="px-3 py-1 text-xs rounded bg-card border border-border hover:border-primary/50 text-foreground transition font-medium cursor-pointer"
            >
              Load "About Us" Template
            </button>
            <button
              type="button"
              onClick={handleLoadContactTemplate}
              className="px-3 py-1 text-xs rounded bg-card border border-border hover:border-primary/50 text-foreground transition font-medium cursor-pointer"
            >
              Load "Contact Us" Template
            </button>
          </div>
        </div>

        {/* Block Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-background/30">
          {BLOCK_DEFINITIONS.map((def) => {
            const Icon = def.icon;
            return (
              <button
                key={def.type}
                type="button"
                onClick={() => handleSelectBlock(def)}
                className="text-left p-4 rounded-lg border border-border bg-card/60 hover:bg-accent/40 hover:border-primary/60 transition group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {def.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-normal">
                    {def.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
