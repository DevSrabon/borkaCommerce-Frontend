'use client';

import React, { useState } from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Settings,
  Copy,
  Trash2,
  Plus,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Wifi,
  BatteryMedium,
  Sparkles,
} from 'lucide-react';
import { PageBlock } from '@/types/page-builder';
import BlockRenderer from './BlockRenderer';
import { PAGE_TEMPLATES, PageTemplateInfo } from './pageTemplates';

interface PageBuilderCanvasProps {
  blocks: PageBlock[];
  onChangeBlocks: (blocks: PageBlock[]) => void;
  onEditBlock: (block: PageBlock) => void;
  onOpenAddModal: (insertIndex?: number) => void;
  onLoadTemplate?: (template: PageTemplateInfo) => void;
  deviceView?: 'desktop' | 'tablet' | 'mobile';
  onDeviceViewChange?: (view: 'desktop' | 'tablet' | 'mobile') => void;
}

export default function PageBuilderCanvas({
  blocks,
  onChangeBlocks,
  onEditBlock,
  onOpenAddModal,
  onLoadTemplate,
  deviceView: controlledDeviceView,
  onDeviceViewChange,
}: PageBuilderCanvasProps) {
  const [internalDeviceView, setInternalDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const deviceView = controlledDeviceView || internalDeviceView;
  const setDeviceView = (view: 'desktop' | 'tablet' | 'mobile') => {
    if (onDeviceViewChange) onDeviceViewChange(view);
    setInternalDeviceView(view);
  };
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Reordering helpers
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChangeBlocks(next);
  };

  const duplicateBlock = (index: number) => {
    const original = blocks[index];
    const clone: PageBlock = {
      id: `block-${original.type.toLowerCase()}-${Date.now()}`,
      type: original.type,
      data: JSON.parse(JSON.stringify(original.data)),
    };
    const next = [...blocks];
    next.splice(index + 1, 0, clone);
    onChangeBlocks(next);
  };

  const deleteBlock = (index: number) => {
    if (confirm('Are you sure you want to delete this block?')) {
      const next = blocks.filter((_, i) => i !== index);
      onChangeBlocks(next);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const next = [...blocks];
    const [dragged] = next.splice(draggedIndex, 1);
    next.splice(dropIndex, 0, dragged);
    onChangeBlocks(next);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950/40 overflow-y-auto">
      {/* Device Viewport Bar */}
      <div className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-lg border border-border shadow-xs">
            <button
              type="button"
              onClick={() => setDeviceView('desktop')}
              className={`p-1.5 px-2.5 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
                deviceView === 'desktop'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Desktop View (Fluid 100%)"
            >
              <Monitor size={14} />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView('tablet')}
              className={`p-1.5 px-2.5 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
                deviceView === 'tablet'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tablet View (768px iPad)"
            >
              <Tablet size={14} />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceView('mobile')}
              className={`p-1.5 px-2.5 rounded text-xs flex items-center gap-1.5 transition cursor-pointer ${
                deviceView === 'mobile'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Mobile View (390px iPhone)"
            >
              <Smartphone size={14} />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <span className="text-xs font-mono text-muted-foreground hidden md:inline px-2 py-0.5 rounded bg-card border border-border">
            {deviceView === 'desktop'
              ? '100% Fluid Desktop'
              : deviceView === 'tablet'
              ? '768 × 1024 px (iPad)'
              : '390 × 844 px (iPhone)'}
          </span>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-3">
          <span className="font-medium text-foreground">{blocks.length} Blocks</span>
          <span className="hidden sm:inline text-muted-foreground">• Drag handles to reorder</span>
        </div>
      </div>

      {/* Canvas Area with Responsive Mockup Framing */}
      <div className={`flex-1 py-8 px-4 flex justify-center items-start overflow-x-hidden ${
        deviceView !== 'desktop' ? 'bg-zinc-950/80' : ''
      }`}>
        {/* Device Frame Wrapper */}
        <div className={`transition-all duration-300 ${
          deviceView === 'mobile'
            ? 'w-[400px] max-w-full my-2 bg-background border-[10px] border-zinc-800 rounded-[48px] shadow-2xl ring-1 ring-zinc-700/60 overflow-hidden relative'
            : deviceView === 'tablet'
            ? 'w-[788px] max-w-full my-2 bg-background border-[10px] border-zinc-800 rounded-[28px] shadow-2xl ring-1 ring-zinc-700/60 overflow-hidden relative'
            : 'w-full bg-background'
        }`}>
          {/* Mobile Status Bar Simulation */}
          {deviceView === 'mobile' && (
            <div className="bg-zinc-950 px-6 pt-3 pb-2 flex items-center justify-between text-xs font-medium text-zinc-300 border-b border-zinc-900 select-none">
              <span>9:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto" />
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Wifi size={11} />
                <BatteryMedium size={13} />
              </div>
            </div>
          )}

          {/* Tablet Camera Dot Simulation */}
          {deviceView === 'tablet' && (
            <div className="bg-zinc-950 py-1.5 flex items-center justify-center border-b border-zinc-900 select-none">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
            </div>
          )}

          {/* Inner Content Area */}
          <div className="min-h-[500px]">
            {blocks.length === 0 ? (
              <div className="p-8 sm:p-12 text-center border-2 border-dashed border-border rounded-2xl space-y-6 my-8 mx-4 bg-card/40 backdrop-blur-xs">
                <div className="space-y-2 max-w-lg mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                    <Sparkles size={13} /> WordPress-Style Site Customizer
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Build Your Page in Seconds
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Choose one of our handcrafted luxury boutique templates below for instant setup, or start with a custom block.
                  </p>
                </div>

                {/* 1-Click Starter Templates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto text-left">
                  {PAGE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => onLoadTemplate ? onLoadTemplate(tmpl) : onOpenAddModal(0)}
                      className="p-4 rounded-xl border border-border bg-background/80 hover:bg-accent/40 hover:border-primary/60 transition group flex flex-col justify-between space-y-2.5 cursor-pointer shadow-xs text-left"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {tmpl.badge}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {tmpl.blocks.length} sections
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                          <span>{tmpl.name}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <span className="text-xs text-muted-foreground">Or build from scratch:</span>
                  <button
                    type="button"
                    onClick={() => onOpenAddModal(0)}
                    className="px-4 py-2 border border-border hover:border-primary/50 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus size={13} />
                    Add Custom Block
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {blocks.map((block, idx) => {
                  const isBeingDragged = draggedIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <React.Fragment key={block.id}>
                      {/* Add Block divider trigger */}
                      <div className="relative group/divider h-4 -my-2 z-20 flex items-center justify-center">
                        <div className="w-full border-t border-transparent group-hover/divider:border-primary/40 transition-colors" />
                        <button
                          type="button"
                          onClick={() => onOpenAddModal(idx)}
                          className="absolute opacity-0 group-hover/divider:opacity-100 transition-all scale-90 group-hover/divider:scale-100 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                        >
                          <Plus size={10} /> Add Block Here
                        </button>
                      </div>

                      {/* Block Container with Drag and Drop & Hover Controls */}
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        className={`relative group transition-all ${
                          isBeingDragged ? 'opacity-30 scale-98 border-2 border-dashed border-primary' : ''
                        } ${isDragOver ? 'border-t-4 border-primary' : ''}`}
                      >
                        {/* Floating WordPress-like Block Toolbar */}
                        <div className="absolute top-3 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-lg px-2 py-1.5 flex items-center gap-1">
                          {/* Drag Handle */}
                          <div
                            className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <GripVertical size={14} />
                          </div>

                          <div className="flex items-center gap-1 border-r border-border pr-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                              {block.type.replace('_', ' ')}
                            </span>
                            {block.data.bg_type && block.data.bg_type !== 'default' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`Custom Background: ${block.data.bg_type}`} />
                            )}
                            {block.data.container_width && block.data.container_width !== 'boxed' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`Custom Width: ${block.data.container_width}`} />
                            )}
                            {(block.data.hide_on_mobile || block.data.hide_on_desktop) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Device visibility rules active" />
                            )}
                          </div>

                          {/* Reorder Buttons */}
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                            title="Move Block Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 'down')}
                            disabled={idx === blocks.length - 1}
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                            title="Move Block Down"
                          >
                            <ChevronDown size={14} />
                          </button>

                          {/* Edit Settings */}
                          <button
                            type="button"
                            onClick={() => onEditBlock(block)}
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit Block Content & Responsive Settings"
                          >
                            <Settings size={14} />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => duplicateBlock(idx)}
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Duplicate Block"
                          >
                            <Copy size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteBlock(idx)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete Block"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Visual Content Render with deviceView passed */}
                        <div className="group-hover:ring-1 group-hover:ring-primary/40 rounded transition-all">
                          <BlockRenderer block={block} isInteractive={false} deviceView={deviceView} />
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Bottom Add Block Trigger */}
                <div className="pt-8 pb-12 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenAddModal(blocks.length)}
                    className="px-6 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/80 bg-card/40 hover:bg-card text-foreground text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition cursor-pointer shadow-sm hover:scale-102"
                  >
                    <Plus size={16} className="text-primary" />
                    Add Block at Bottom
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Home Bar Simulation */}
          {deviceView === 'mobile' && (
            <div className="bg-zinc-950 py-2.5 flex justify-center border-t border-zinc-900 select-none">
              <div className="w-28 h-1 bg-zinc-600 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
