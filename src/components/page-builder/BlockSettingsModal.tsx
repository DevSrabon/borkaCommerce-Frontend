'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Settings,
  Sparkles,
  Smartphone,
  Monitor,
  EyeOff,
  Palette,
  Maximize2,
  Sliders,
  Type,
  LayoutGrid,
  Paintbrush,
  Image as ImageIcon,
  FileText,
  Layers,
  Code,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MapPin,
} from 'lucide-react';
import { PageBlock } from '@/types/page-builder';
import RichTextEditor from '../RichTextEditor';

interface BlockSettingsModalProps {
  block: PageBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBlock: PageBlock) => void;
}

export default function BlockSettingsModal({
  block,
  isOpen,
  onClose,
  onSave,
}: BlockSettingsModalProps) {
  if (!isOpen || !block) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-foreground">
                  Configure {block.type.replace('_', ' ')} Block
                </h3>
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">
                  {block.type}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">ID: {block.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <BlockForm block={block} onClose={onClose} onSave={onSave} />
      </div>
    </div>
  );
}

function BlockForm({
  block,
  onClose,
  onSave,
}: {
  block: PageBlock;
  onClose: () => void;
  onSave: (updated: PageBlock) => void;
}) {
  const [activeTab, setActiveTab] = useState<'content' | 'layout' | 'style' | 'advanced'>('content');
  const [formData, setFormData] = useState<Record<string, any>>({
    ...block.data,
  });

  const updateField = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSave({
      ...block,
      data: formData,
    });
    onClose();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-border bg-card px-6 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'content'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText size={15} />
          <span>Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('layout')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'layout'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Maximize2 size={15} />
          <span>Layout &amp; Dimensions</span>
          {(formData.container_width || formData.padding_y || formData.border_radius) && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'style'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette size={15} />
          <span>Style &amp; Background</span>
          {(formData.bg_type || formData.text_color) && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-medium transition cursor-pointer shrink-0 ${
            activeTab === 'advanced'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders size={15} />
          <span>Responsive &amp; Custom CSS</span>
          {(formData.hide_on_mobile || formData.hide_on_desktop || formData.custom_classes) && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/40 text-xs">
        {/* =========================================================================
            TAB 1: CONTENT
            ========================================================================= */}
        {activeTab === 'content' && (
          <div className="space-y-5">
            {block.type === 'HERO' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => updateField('badge', e.target.value)}
                    placeholder="e.g. Bespoke Atelier"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Main Heading *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-serif font-bold text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subtitle / Paragraph</label>
                  <textarea
                    rows={3}
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-4">
                  <div>
                    <label className="block font-semibold mb-1">Primary Button Label</label>
                    <input
                      type="text"
                      value={formData.primary_button?.label || ''}
                      onChange={(e) =>
                        updateField('primary_button', {
                          ...formData.primary_button,
                          label: e.target.value,
                        })
                      }
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Primary Button URL</label>
                    <input
                      type="text"
                      value={formData.primary_button?.url || ''}
                      onChange={(e) =>
                        updateField('primary_button', {
                          ...formData.primary_button,
                          url: e.target.value,
                        })
                      }
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Secondary Button Label</label>
                    <input
                      type="text"
                      value={formData.secondary_button?.label || ''}
                      onChange={(e) =>
                        updateField('secondary_button', {
                          ...formData.secondary_button,
                          label: e.target.value,
                        })
                      }
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Secondary Button URL</label>
                    <input
                      type="text"
                      value={formData.secondary_button?.url || ''}
                      onChange={(e) =>
                        updateField('secondary_button', {
                          ...formData.secondary_button,
                          url: e.target.value,
                        })
                      }
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                </div>
              </>
            )}

            {block.type === 'TWO_COLUMN' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Subheading / Badge</label>
                  <input
                    type="text"
                    value={formData.subheading || ''}
                    onChange={(e) => updateField('subheading', e.target.value)}
                    placeholder="e.g. SINCE 2021"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Main Heading *</label>
                  <input
                    type="text"
                    value={formData.heading || ''}
                    onChange={(e) => updateField('heading', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 font-serif font-bold text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.image_url || ''}
                    onChange={(e) => updateField('image_url', e.target.value)}
                    placeholder="https://... image URL"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 font-mono text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Image Placement</label>
                    <select
                      value={formData.image_position || 'left'}
                      onChange={(e) => updateField('image_position', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    >
                      <option value="left">Left Column</option>
                      <option value="right">Right Column</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Button Label</label>
                    <input
                      type="text"
                      value={formData.cta_button?.label || ''}
                      onChange={(e) =>
                        updateField('cta_button', {
                          ...formData.cta_button,
                          label: e.target.value,
                        })
                      }
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Story Content / Paragraphs</label>
                  <textarea
                    rows={4}
                    value={formData.content || ''}
                    onChange={(e) => updateField('content', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold">Highlights / Checkpoints</label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('highlights', [
                          ...(formData.highlights || []),
                          'New feature highlight',
                        ])
                      }
                      className="text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Point
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(formData.highlights || []).map((h: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => {
                            const next = [...formData.highlights];
                            next[idx] = e.target.value;
                            updateField('highlights', next);
                          }}
                          className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.highlights.filter((_: any, i: number) => i !== idx);
                            updateField('highlights', next);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {block.type === 'STATS_COUNTER' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Section Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Stat Cards</label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('stats', [
                          ...(formData.stats || []),
                          { number: '100+', label: 'New Metric' },
                        ])
                      }
                      className="text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Stat
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formData.stats || []).map((st: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center p-2 rounded-lg border border-border bg-card">
                        <input
                          type="text"
                          placeholder="Number (e.g. 25,000+)"
                          value={st.number}
                          onChange={(e) => {
                            const next = [...formData.stats];
                            next[idx].number = e.target.value;
                            updateField('stats', next);
                          }}
                          className="w-1/3 bg-background border border-border rounded px-2 py-1 font-bold text-foreground"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g. Happy Clients)"
                          value={st.label}
                          onChange={(e) => {
                            const next = [...formData.stats];
                            next[idx].label = e.target.value;
                            updateField('stats', next);
                          }}
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = formData.stats.filter((_: any, i: number) => i !== idx);
                            updateField('stats', next);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {block.type === 'FEATURES_GRID' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Section Title</label>
                  <input
                    type="text"
                    value={formData.heading || ''}
                    onChange={(e) => updateField('heading', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Feature Items</label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('items', [
                          ...(formData.items || []),
                          { icon: 'Sparkles', title: 'New Feature', description: 'Description here...' },
                        ])
                      }
                      className="text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Feature
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(formData.items || []).map((it: any, idx: number) => (
                      <div key={idx} className="p-3 border border-border rounded-lg bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <select
                            value={it.icon || 'Sparkles'}
                            onChange={(e) => {
                              const next = [...formData.items];
                              next[idx].icon = e.target.value;
                              updateField('items', next);
                            }}
                            className="bg-background border border-border rounded px-2 py-1 text-foreground"
                          >
                            <option value="Headset">Headset / Support Icon</option>
                            <option value="Sparkles">Sparkles Icon</option>
                            <option value="Shield">Shield Icon</option>
                            <option value="Truck">Truck Icon</option>
                            <option value="Award">Award Icon</option>
                            <option value="Heart">Heart Icon</option>
                            <option value="Star">Star Icon</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.items.filter((_: any, i: number) => i !== idx);
                              updateField('items', next);
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Title"
                          value={it.title}
                          onChange={(e) => {
                            const next = [...formData.items];
                            next[idx].title = e.target.value;
                            updateField('items', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 font-bold text-foreground"
                        />
                        <textarea
                          rows={2}
                          placeholder="Description"
                          value={it.description}
                          onChange={(e) => {
                            const next = [...formData.items];
                            next[idx].description = e.target.value;
                            updateField('items', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {block.type === 'TESTIMONIALS' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Section Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground font-serif font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Testimonial Cards</label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('items', [
                          ...(formData.items || []),
                          {
                            author: 'Sara Al Mazrouei',
                            role: 'Dubai Client',
                            quote: 'The bespoke abaya exceeded all expectations in craftsmanship.',
                            rating: 5,
                          },
                        ])
                      }
                      className="text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Review
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(formData.items || []).map((rev: any, idx: number) => (
                      <div key={idx} className="p-3 border border-border rounded-lg bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-muted-foreground">Review #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.items.filter((_: any, i: number) => i !== idx);
                              updateField('items', next);
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Client Name"
                            value={rev.author}
                            onChange={(e) => {
                              const next = [...formData.items];
                              next[idx].author = e.target.value;
                              updateField('items', next);
                            }}
                            className="bg-background border border-border rounded px-2.5 py-1 font-bold text-foreground"
                          />
                          <input
                            type="text"
                            placeholder="Role / Location"
                            value={rev.role}
                            onChange={(e) => {
                              const next = [...formData.items];
                              next[idx].role = e.target.value;
                              updateField('items', next);
                            }}
                            className="bg-background border border-border rounded px-2.5 py-1 text-foreground"
                          />
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Client Quote"
                          value={rev.quote}
                          onChange={(e) => {
                            const next = [...formData.items];
                            next[idx].quote = e.target.value;
                            updateField('items', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground italic"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {block.type === 'FAQ_ACCORDION' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Section Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 font-serif font-bold text-sm text-foreground"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Questions &amp; Answers</label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('items', [
                          ...(formData.items || []),
                          { question: 'New Question?', answer: 'Answer goes here...' },
                        ])
                      }
                      className="text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add FAQ Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(formData.items || []).map((faq: any, idx: number) => (
                      <div key={idx} className="p-3 border border-border rounded-lg bg-card space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-muted-foreground">Q #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.items.filter((_: any, i: number) => i !== idx);
                              updateField('items', next);
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Question"
                          value={faq.question}
                          onChange={(e) => {
                            const next = [...formData.items];
                            next[idx].question = e.target.value;
                            updateField('items', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 font-bold text-foreground"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer"
                          value={faq.answer}
                          onChange={(e) => {
                            const next = [...formData.items];
                            next[idx].answer = e.target.value;
                            updateField('items', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {block.type === 'CTA_BANNER' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Banner Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 font-serif font-bold text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subtitle</label>
                  <textarea
                    rows={2}
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.button_text || ''}
                      onChange={(e) => updateField('button_text', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Button Link</label>
                    <input
                      type="text"
                      value={formData.button_link || ''}
                      onChange={(e) => updateField('button_link', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                </div>
              </>
            )}

            {block.type === 'RICH_TEXT' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Section Title (Optional)</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 font-serif font-bold text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-semibold mb-1">Rich Text Content &amp; Media</label>
                  <RichTextEditor
                    value={formData.html_content || ''}
                    onChange={(html) => updateField('html_content', html)}
                    placeholder="Write content, format headings, adjust font size, paste text, or insert media..."
                    minHeight={280}
                  />
                </div>
              </>
            )}

            {block.type === 'SPACER' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">
                    Height: {formData.height || 40}px
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="160"
                    step="8"
                    value={formData.height || 40}
                    onChange={(e) => updateField('height', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="has_divider"
                    checked={formData.has_divider ?? false}
                    onChange={(e) => updateField('has_divider', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="has_divider" className="font-semibold cursor-pointer text-foreground">
                    Show subtle horizontal divider line
                  </label>
                </div>
              </>
            )}

            {block.type === 'MAP' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Section Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g. Visit Our Flagship Boutique"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground font-serif font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Subtitle / Description</label>
                  <textarea
                    rows={2}
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    placeholder="e.g. Experience our bespoke modest collections in person"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>

                <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs uppercase tracking-wider text-primary">
                      Map Embed Location or URL *
                    </label>
                    <span className="text-xs text-muted-foreground">URL, Query, or &lt;iframe&gt;</span>
                  </div>
                  <input
                    type="text"
                    value={formData.map_url || ''}
                    onChange={(e) => updateField('map_url', e.target.value)}
                    placeholder="e.g. Downtown Dubai or https://maps.google.com/..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground leading-normal">
                    Tip: You can paste a Google Maps embed URL, a full <code>&lt;iframe&gt;</code> code, or simply type any location query like <span className="text-primary font-medium">"Dubai Mall, UAE"</span> or <span className="text-primary font-medium">"Gulshan 2, Dhaka"</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">
                      Map Height: {formData.map_height || 420}px
                    </label>
                    <input
                      type="range"
                      min="260"
                      max="650"
                      step="20"
                      value={formData.map_height || 420}
                      onChange={(e) => updateField('map_height', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Layout Style</label>
                    <select
                      value={formData.layout || 'split'}
                      onChange={(e) => updateField('layout', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    >
                      <option value="split">Split View (Map + Store Info Card)</option>
                      <option value="full">Full Width (Map with Floating Badge)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs uppercase tracking-wider text-primary">
                      Store &amp; Atelier Details Card
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="show_card"
                        checked={formData.show_card ?? true}
                        onChange={(e) => updateField('show_card', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="show_card" className="text-xs font-semibold cursor-pointer">
                        Display Card
                      </label>
                    </div>
                  </div>

                  {(formData.show_card ?? true) && (
                    <div className="space-y-3 pt-2 border-t border-border/50">
                      <div>
                        <label className="block font-semibold mb-1 text-xs">Boutique Physical Address</label>
                        <input
                          type="text"
                          value={formData.address || ''}
                          onChange={(e) => updateField('address', e.target.value)}
                          placeholder="e.g. Fashion Avenue, The Dubai Mall, Downtown Dubai, UAE"
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-xs">Telephone Concierge</label>
                          <input
                            type="text"
                            value={formData.phone || ''}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="e.g. +971 4 123 4567"
                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-xs">Direct Email</label>
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="e.g. boutique@borkacommerce.com"
                            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-xs">Visiting / Business Hours</label>
                        <input
                          type="text"
                          value={formData.hours || ''}
                          onChange={(e) => updateField('hours', e.target.value)}
                          placeholder="e.g. Mon - Sun: 10:00 AM - 11:00 PM"
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* =====================================================================
                IMAGE BLOCK
                ===================================================================== */}
            {block.type === 'IMAGE' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Image URL *</label>
                  <input
                    type="text"
                    required
                    value={formData.image_url || ''}
                    onChange={(e) => updateField('image_url', e.target.value)}
                    placeholder="https://... or upload to media library"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground font-mono text-xs"
                  />
                  {formData.image_url && (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-border h-40 max-w-sm bg-muted/40">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Caption (Displayed below)</label>
                    <input
                      type="text"
                      value={formData.caption || ''}
                      onChange={(e) => updateField('caption', e.target.value)}
                      placeholder="e.g. Saba Al Wadi Haute Couture Collection"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Image Alt Text (SEO)</label>
                    <input
                      type="text"
                      value={formData.alt_text || ''}
                      onChange={(e) => updateField('alt_text', e.target.value)}
                      placeholder="e.g. Model wearing black royal abaya"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Aspect Ratio</label>
                    <select
                      value={formData.aspect_ratio || '16/9'}
                      onChange={(e) => updateField('aspect_ratio', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground cursor-pointer"
                    >
                      <option value="16/9">Landscape 16:9 (Standard Banner)</option>
                      <option value="21/9">Cinematic 21:9 (Wide Banner)</option>
                      <option value="4/3">Standard 4:3</option>
                      <option value="1/1">Square 1:1</option>
                      <option value="auto">Natural Image Ratio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Click Through Link (Optional)</label>
                    <input
                      type="text"
                      value={formData.link_url || ''}
                      onChange={(e) => updateField('link_url', e.target.value)}
                      placeholder="e.g. /catalog or https://..."
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-primary">
                    Optional Text Overlay On Image
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1 text-xs">Overlay Badge</label>
                      <input
                        type="text"
                        value={formData.overlay_badge || ''}
                        onChange={(e) => updateField('overlay_badge', e.target.value)}
                        placeholder="e.g. Limited Edition"
                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-xs">Overlay Title</label>
                      <input
                        type="text"
                        value={formData.overlay_title || ''}
                        onChange={(e) => updateField('overlay_title', e.target.value)}
                        placeholder="e.g. Handcrafted In Dubai"
                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* =====================================================================
                CARDS_GRID BLOCK
                ===================================================================== */}
            {block.type === 'CARDS_GRID' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Section Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="e.g. Curated Highlights"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 font-serif font-bold text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Grid Columns</label>
                    <select
                      value={formData.columns || 3}
                      onChange={(e) => updateField('columns', parseInt(e.target.value))}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground cursor-pointer"
                    >
                      <option value={2}>2 Columns (Large Cards)</option>
                      <option value={3}>3 Columns (Standard)</option>
                      <option value={4}>4 Columns (Compact)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Section Subtitle</label>
                  <textarea
                    rows={2}
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    placeholder="e.g. Discover our most coveted creations"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>

                {/* Card Items */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs uppercase tracking-wider text-primary">
                      Cards in Grid ({(formData.cards || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('cards', [
                          ...(formData.cards || []),
                          {
                            image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
                            badge: 'New Item',
                            title: 'Bespoke Creation',
                            description: 'Description of this card item or collection piece.',
                            tag: 'AED 450',
                            button_label: 'View Details',
                            button_url: '/catalog',
                          },
                        ])
                      }
                      className="text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Plus size={13} /> Add Card
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(formData.cards || []).map((card: any, idx: number) => (
                      <div key={idx} className="p-4 border border-border rounded-xl bg-card/60 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                          <span className="font-bold text-xs text-foreground">Card #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.cards.filter((_: any, i: number) => i !== idx);
                              updateField('cards', next);
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Remove Card"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-xs">Card Image URL</label>
                          <input
                            type="text"
                            value={card.image_url || ''}
                            onChange={(e) => {
                              const next = [...formData.cards];
                              next[idx].image_url = e.target.value;
                              updateField('cards', next);
                            }}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs font-mono text-foreground"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="block font-semibold mb-1 text-xs">Card Title *</label>
                            <input
                              type="text"
                              value={card.title || ''}
                              onChange={(e) => {
                                const next = [...formData.cards];
                                next[idx].title = e.target.value;
                                updateField('cards', next);
                              }}
                              className="w-full bg-background border border-border rounded px-2.5 py-1 font-bold text-foreground text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-xs">Badge / Pill</label>
                            <input
                              type="text"
                              value={card.badge || ''}
                              onChange={(e) => {
                                const next = [...formData.cards];
                                next[idx].badge = e.target.value;
                                updateField('cards', next);
                              }}
                              placeholder="e.g. Best Seller"
                              className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1 text-xs">Description</label>
                          <textarea
                            rows={2}
                            value={card.description || ''}
                            onChange={(e) => {
                              const next = [...formData.cards];
                              next[idx].description = e.target.value;
                              updateField('cards', next);
                            }}
                            className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block font-semibold mb-1 text-xs">Tag / Price</label>
                            <input
                              type="text"
                              value={card.tag || ''}
                              onChange={(e) => {
                                const next = [...formData.cards];
                                next[idx].tag = e.target.value;
                                updateField('cards', next);
                              }}
                              placeholder="e.g. AED 450"
                              className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs font-semibold text-primary"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-xs">Button Label</label>
                            <input
                              type="text"
                              value={card.button_label || ''}
                              onChange={(e) => {
                                const next = [...formData.cards];
                                next[idx].button_label = e.target.value;
                                updateField('cards', next);
                              }}
                              placeholder="e.g. View Piece"
                              className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1 text-xs">Button URL</label>
                            <input
                              type="text"
                              value={card.button_url || ''}
                              onChange={(e) => {
                                const next = [...formData.cards];
                                next[idx].button_url = e.target.value;
                                updateField('cards', next);
                              }}
                              placeholder="/catalog"
                              className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* =====================================================================
                GALLERY BLOCK
                ===================================================================== */}
            {block.type === 'GALLERY' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Gallery Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="e.g. Atelier Lookbook"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 font-serif font-bold text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Gallery Columns</label>
                    <select
                      value={formData.columns || 3}
                      onChange={(e) => updateField('columns', parseInt(e.target.value))}
                      className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground cursor-pointer"
                    >
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Subtitle</label>
                  <textarea
                    rows={2}
                    value={formData.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    placeholder="e.g. A visual tour of our bespoke craftsmanship"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs uppercase tracking-wider text-primary">
                      Gallery Images ({(formData.images || []).length})
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateField('images', [
                          ...(formData.images || []),
                          {
                            url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
                            caption: 'Craftsmanship Detail',
                            link: '/catalog',
                          },
                        ])
                      }
                      className="text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Plus size={13} /> Add Image
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(formData.images || []).map((img: any, idx: number) => (
                      <div key={idx} className="p-3 border border-border rounded-xl bg-card/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">Photo #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = formData.images.filter((_: any, i: number) => i !== idx);
                              updateField('images', next);
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={img.url || ''}
                          onChange={(e) => {
                            const next = [...formData.images];
                            next[idx].url = e.target.value;
                            updateField('images', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs font-mono text-foreground"
                        />
                        <input
                          type="text"
                          placeholder="Caption / Description"
                          value={img.caption || ''}
                          onChange={(e) => {
                            const next = [...formData.images];
                            next[idx].caption = e.target.value;
                            updateField('images', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                        />
                        <input
                          type="text"
                          placeholder="Link URL (optional)"
                          value={img.link || ''}
                          onChange={(e) => {
                            const next = [...formData.images];
                            next[idx].link = e.target.value;
                            updateField('images', next);
                          }}
                          className="w-full bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: LAYOUT & DIMENSIONS
            ========================================================================= */}
        {activeTab === 'layout' && (
          <div className="space-y-5">
            {/* Container Max Width */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <label className="block font-bold text-xs uppercase tracking-wider text-primary">
                Container Width &amp; Boundary
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'boxed', label: 'Standard Boxed', desc: '1024px Max' },
                  { id: 'narrow', label: 'Narrow Boxed', desc: '768px (Articles)' },
                  { id: 'wide', label: 'Wide Canvas', desc: '1280px (Galleries)' },
                  { id: 'full', label: 'Full Width', desc: '100% Edge-to-Edge' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateField('container_width', opt.id)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      (formData.container_width || 'boxed') === opt.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-background/50 hover:bg-accent text-foreground'
                    }`}
                  >
                    <div className="text-xs font-semibold">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical & Horizontal Padding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2.5">
                <label className="block font-semibold text-xs">Section Vertical Padding (Y-axis)</label>
                <select
                  value={formData.padding_y || 'normal'}
                  onChange={(e) => updateField('padding_y', e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="none">None (0px Padding)</option>
                  <option value="compact">Compact (24px - 40px)</option>
                  <option value="normal">Standard (48px - 80px)</option>
                  <option value="spacious">Spacious Luxury (80px - 128px)</option>
                </select>
                <div className="pt-2">
                  <label className="block text-xs text-muted-foreground mb-1">
                    Or Custom Vertical Padding (px)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 64"
                    value={formData.padding_y_custom || ''}
                    onChange={(e) => updateField('padding_y_custom', e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2.5">
                <label className="block font-semibold text-xs">Section Horizontal Padding (X-axis)</label>
                <select
                  value={formData.padding_x || 'default'}
                  onChange={(e) => updateField('padding_x', e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="none">None (0px - Edge to Edge)</option>
                  <option value="compact">Compact (8px - 16px)</option>
                  <option value="default">Standard (16px - 24px)</option>
                  <option value="generous">Generous (24px - 48px)</option>
                </select>

                <div className="pt-2">
                  <label className="block text-xs text-muted-foreground mb-1">Section Vertical Margin</label>
                  <select
                    value={formData.margin_y || 'none'}
                    onChange={(e) => updateField('margin_y', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                  >
                    <option value="none">None (0px)</option>
                    <option value="sm">Small (16px)</option>
                    <option value="md">Medium (32px)</option>
                    <option value="lg">Large (64px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Alignment & Curves */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                <label className="block font-semibold text-xs">Content Text Alignment</label>
                <div className="flex gap-2">
                  {[
                    { id: 'left', label: 'Left', icon: AlignLeft },
                    { id: 'center', label: 'Center', icon: AlignCenter },
                    { id: 'right', label: 'Right', icon: AlignRight },
                  ].map((al) => {
                    const Icon = al.icon;
                    return (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => updateField('alignment', al.id)}
                        className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          (formData.alignment || 'left') === al.id
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-border bg-background hover:bg-accent text-foreground'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{al.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2.5">
                <label className="block font-semibold text-xs">Block Border Radius (Rounded)</label>
                <select
                  value={formData.border_radius || 'none'}
                  onChange={(e) => updateField('border_radius', e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="none">Sharp / No Radius (0px)</option>
                  <option value="sm">Subtle Rounded (8px)</option>
                  <option value="md">Medium Curve (12px)</option>
                  <option value="lg">Luxury Curve (16px)</option>
                  <option value="full">Pill / Max Curve (24px)</option>
                </select>
              </div>
            </div>

            {/* Borders & Shadows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2.5">
                <label className="block font-semibold text-xs">Border Style &amp; Frame</label>
                <select
                  value={formData.border_style || 'default'}
                  onChange={(e) => updateField('border_style', e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="default">Standard Bottom Divider</option>
                  <option value="none">No Border</option>
                  <option value="solid">Full Subtle Frame (border)</option>
                  <option value="accent">Luxury Gold Frame (border-2)</option>
                  <option value="dashed">Subtle Dashed Border</option>
                </select>
                {formData.border_style === 'solid' && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Custom Border Color:</span>
                    <input
                      type="color"
                      value={formData.border_color || '#e5e7eb'}
                      onChange={(e) => updateField('border_color', e.target.value)}
                      className="w-7 h-7 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="#e5e7eb"
                      value={formData.border_color || ''}
                      onChange={(e) => updateField('border_color', e.target.value)}
                      className="w-24 bg-card border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2.5">
                <label className="block font-semibold text-xs">Box Shadow &amp; Glow</label>
                <select
                  value={formData.box_shadow || 'none'}
                  onChange={(e) => updateField('box_shadow', e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="none">No Shadow</option>
                  <option value="sm">Soft Elevation (shadow-sm)</option>
                  <option value="md">Card Shadow (shadow-md)</option>
                  <option value="lg">Deep Luxury Shadow (shadow-2xl)</option>
                  <option value="glow">Gold Ambient Glow</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: STYLE & BACKGROUND
            ========================================================================= */}
        {activeTab === 'style' && (
          <div className="space-y-5">
            {/* Background Type Selection */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <label className="block font-bold text-xs uppercase tracking-wider text-primary">
                Background Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'default', label: 'Default Theme', desc: 'Inherit Theme' },
                  { id: 'solid', label: 'Solid Color', desc: 'Custom Hex Color' },
                  { id: 'gradient', label: 'Gradient', desc: 'Luxury Gradients' },
                  { id: 'image', label: 'Background Image', desc: 'Photo with Overlay' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => updateField('bg_type', bg.id)}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      (formData.bg_type || 'default') === bg.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-background/50 hover:bg-accent text-foreground'
                    }`}
                  >
                    <div className="text-xs font-semibold">{bg.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{bg.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Solid Color Controls */}
            {formData.bg_type === 'solid' && (
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3 animate-in fade-in">
                <label className="block font-semibold text-xs">Solid Color Selection</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { label: 'Void Black', hex: '#09090b' },
                    { label: 'Charcoal', hex: '#18181b' },
                    { label: 'Deep Zinc', hex: '#27272a' },
                    { label: 'Pure White', hex: '#ffffff' },
                    { label: 'Silk Ivory', hex: '#faf7f2' },
                    { label: 'Desert Sand', hex: '#f4efe6' },
                    { label: 'Royal Gold Tint', hex: '#262014' },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => updateField('bg_color', preset.hex)}
                      className="px-2.5 py-1.5 rounded-md border border-border text-xs flex items-center gap-1.5 hover:border-primary transition cursor-pointer bg-background"
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-border shrink-0" style={{ backgroundColor: preset.hex }} />
                      <span className="text-foreground">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-muted-foreground">Custom Color Picker:</span>
                  <input
                    type="color"
                    value={formData.bg_color || '#18181b'}
                    onChange={(e) => updateField('bg_color', e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="#18181b"
                    value={formData.bg_color || ''}
                    onChange={(e) => updateField('bg_color', e.target.value)}
                    className="w-32 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground"
                  />
                </div>
              </div>
            )}

            {/* Gradient Background Controls */}
            {formData.bg_type === 'gradient' && (
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3 animate-in fade-in">
                <label className="block font-semibold text-xs">Gradient Presets</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      label: 'Obsidian Fade',
                      grad: 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)',
                    },
                    {
                      label: 'Gold Radiance Glow',
                      grad: 'radial-gradient(ellipse at top, rgba(184,144,71,0.25) 0%, #09090b 70%)',
                    },
                    {
                      label: 'Silk Champagne Light',
                      grad: 'linear-gradient(135deg, #faf7f2 0%, #f0e6d6 100%)',
                    },
                    {
                      label: 'Emerald Night',
                      grad: 'linear-gradient(135deg, #061e14 0%, #09090b 100%)',
                    },
                    {
                      label: 'Amber Sunset',
                      grad: 'linear-gradient(135deg, #1f1406 0%, #0f0a04 100%)',
                    },
                  ].map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => updateField('bg_gradient', g.grad)}
                      className={`p-3 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                        formData.bg_gradient === g.grad
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border'
                      }`}
                      style={{ background: g.grad }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-sm">{g.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs text-muted-foreground mb-1">
                    Or Custom CSS Gradient Syntax:
                  </label>
                  <input
                    type="text"
                    placeholder="linear-gradient(135deg, #18181b 0%, #27272a 100%)"
                    value={formData.bg_gradient || ''}
                    onChange={(e) => updateField('bg_gradient', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground"
                  />
                </div>
              </div>
            )}

            {/* Background Image Controls */}
            {formData.bg_type === 'image' && (
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3.5 animate-in fade-in">
                <div>
                  <label className="block font-semibold text-xs mb-1">Background Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... or uploaded asset URL"
                    value={formData.bg_image || ''}
                    onChange={(e) => updateField('bg_image', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground"
                  />
                </div>

                {formData.bg_image && (
                  <div className="h-28 w-full rounded-lg overflow-hidden border border-border relative">
                    <img
                      src={formData.bg_image}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-black flex items-center justify-center text-white text-xs font-semibold"
                      style={{ opacity: (formData.bg_overlay ?? 50) / 100 }}
                    >
                      Preview with {(formData.bg_overlay ?? 50)}% Overlay
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-xs mb-1">
                      Darkening Overlay: {formData.bg_overlay ?? 50}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={formData.bg_overlay ?? 50}
                      onChange={(e) => updateField('bg_overlay', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Ensures high text contrast over images
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-xs mb-1">Background Image Blur</label>
                    <select
                      value={formData.bg_blur || 'none'}
                      onChange={(e) => updateField('bg_blur', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                    >
                      <option value="none">Sharp / No Blur</option>
                      <option value="sm">Subtle Soft Blur (4px)</option>
                      <option value="md">Heavy Atmosphere Blur (12px)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Typography & Text Color Overrides */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3.5">
              <label className="block font-bold text-xs uppercase tracking-wider text-primary">
                Typography &amp; Colors
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-xs mb-1">Heading Font Family</label>
                  <select
                    value={formData.heading_font || 'serif'}
                    onChange={(e) => updateField('heading_font', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground font-serif"
                  >
                    <option value="serif" className="font-serif">Playfair / Luxury Serif</option>
                    <option value="sans" className="font-sans">Modern Clean Sans-Serif</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-xs mb-1">Text Color Override</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.text_color || '#fafafa'}
                      onChange={(e) => updateField('text_color', e.target.value)}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Default (theme text)"
                      value={formData.text_color || ''}
                      onChange={(e) => updateField('text_color', e.target.value)}
                      className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground"
                    />
                    {formData.text_color && (
                      <button
                        type="button"
                        onClick={() => updateField('text_color', '')}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: RESPONSIVE & ADVANCED CUSTOM CSS
            ========================================================================= */}
        {activeTab === 'advanced' && (
          <div className="space-y-5">
            {/* Device Visibility Rules */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <label className="block font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Smartphone size={14} />
                Device Display Rules
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/50 transition">
                  <input
                    type="checkbox"
                    checked={formData.hide_on_mobile ?? false}
                    onChange={(e) => updateField('hide_on_mobile', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold block text-foreground">Hide on Mobile</span>
                    <span className="text-xs text-muted-foreground">Hidden on screens &lt; 768px</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:border-primary/50 transition">
                  <input
                    type="checkbox"
                    checked={formData.hide_on_desktop ?? false}
                    onChange={(e) => updateField('hide_on_desktop', e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold block text-foreground">Hide on Desktop</span>
                    <span className="text-xs text-muted-foreground">Hidden on screens &ge; 1024px</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Mobile Alignment & Ordering */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <label className="block font-semibold text-xs">Mobile-Specific Behavior</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Mobile Text Alignment
                  </label>
                  <select
                    value={formData.mobile_align || 'default'}
                    onChange={(e) => updateField('mobile_align', e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                  >
                    <option value="default">Default (Inherit Desktop)</option>
                    <option value="center">Center Align on Mobile</option>
                    <option value="left">Left Align on Mobile</option>
                  </select>
                </div>

                {block.type === 'TWO_COLUMN' && (
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mobile_reverse ?? false}
                        onChange={(e) => updateField('mobile_reverse', e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium text-foreground">
                        Stack Text First, Image Second on Mobile
                      </span>
                    </label>
                  </div>
                )}

                {(block.type === 'FEATURES_GRID' || block.type === 'STATS_COUNTER') && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Mobile Grid Columns
                    </label>
                    <select
                      value={formData.mobile_cols || '1'}
                      onChange={(e) => updateField('mobile_cols', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                    >
                      <option value="1">1 Column (Vertical Stack)</option>
                      <option value="2">2 Columns (Compact Grid)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Tailwind CSS Classes */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
              <label className="block font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Code size={14} />
                Custom Tailwind CSS Classes
              </label>
              <input
                type="text"
                placeholder="e.g. ring-1 ring-primary/20 backdrop-blur-md opacity-95"
                value={formData.custom_classes || ''}
                onChange={(e) => updateField('custom_classes', e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground"
              />
              <span className="text-xs text-muted-foreground block">
                Any valid Tailwind CSS utility class will be appended directly to the block wrapper.
              </span>
            </div>

            {/* Custom Inline CSS */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
              <label className="block font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sliders size={14} />
                Custom Inline CSS (Arbitrary Styles)
              </label>
              <textarea
                rows={3}
                placeholder="letter-spacing: 0.08em; text-transform: uppercase;"
                value={formData.custom_css || ''}
                onChange={(e) => updateField('custom_css', e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground"
              />
              <span className="text-xs text-muted-foreground block">
                Write standard CSS semicolon-separated declarations (e.g. <code>letter-spacing: 2px;</code>)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="border-t border-border px-6 py-4 bg-background flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Changes will reflect in canvas immediately upon saving.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent cursor-pointer text-foreground text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 btn-luxury rounded-lg font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer text-xs shadow-md"
          >
            <Check size={14} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
