'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Headset,
  Shield,
  Truck,
  Award,
  Heart,
  Star,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  HelpCircle,
  EyeOff,
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Navigation,
  Send,
  Building2,
  Check,
  Upload,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { PageBlock } from '@/types/page-builder';

const ICON_MAP: Record<string, React.ElementType> = {
  Headset,
  Sparkles,
  Shield,
  Truck,
  Award,
  Heart,
  Star,
  HelpCircle,
};

interface BlockRendererProps {
  block: PageBlock;
  isInteractive?: boolean;
  deviceView?: 'desktop' | 'tablet' | 'mobile';
  /** Called by inline editor when user edits text directly on the canvas */
  onDataChange?: (blockId: string, newData: Record<string, any>) => void;
}

/**
 * Computes custom layout, styling, backgrounds, and responsive visibility
 * for any block based on the custom options configured in Elementor settings.
 */
function getBlockLayoutAndStyle(block: PageBlock, isMobile: boolean) {
  const data = block.data || {};
  const styleSettings = block.style || {};
  const advanced = block.advanced || {};

  // ─── Visibility ──────────────────────────────────────────────────────────
  const hideOnMobile = Boolean(advanced.hideOnMobile || data.hide_on_mobile);
  const hideOnDesktop = Boolean(advanced.hideOnDesktop || data.hide_on_desktop);
  const visibilityClass = `${hideOnMobile ? 'hidden md:block' : ''} ${hideOnDesktop ? 'md:hidden' : ''}`.trim();

  // ─── Container Max Width ─────────────────────────────────────────────────
  let maxWidthClass = 'max-w-5xl mx-auto';
  if (data.container_width === 'full') maxWidthClass = 'w-full max-w-full';
  else if (data.container_width === 'narrow') maxWidthClass = 'max-w-3xl mx-auto';
  else if (data.container_width === 'wide') maxWidthClass = 'max-w-7xl mx-auto';
  else if (data.container_width === 'boxed') maxWidthClass = 'max-w-5xl mx-auto';

  // ─── Vertical Spacing (Padding Y) ────────────────────────────────────────
  let paddingYClass = 'py-12 sm:py-20';
  if (data.padding_y === 'none') paddingYClass = 'py-0';
  else if (data.padding_y === 'compact') paddingYClass = 'py-6 sm:py-10';
  else if (data.padding_y === 'spacious') paddingYClass = 'py-20 sm:py-32';
  else if (data.padding_y === 'normal') paddingYClass = 'py-12 sm:py-20';
  else if (isMobile) paddingYClass = 'py-8 sm:py-12';

  // ─── Horizontal Spacing (Padding X) ──────────────────────────────────────
  let paddingXClass = 'px-4 sm:px-6';
  if (data.padding_x === 'none') paddingXClass = 'px-0';
  else if (data.padding_x === 'compact') paddingXClass = 'px-2 sm:px-4';
  else if (data.padding_x === 'generous') paddingXClass = 'px-6 sm:px-12';

  // ─── Margin Y ────────────────────────────────────────────────────────────
  let marginYClass = '';
  if (data.margin_y === 'sm') marginYClass = 'my-3 sm:my-4';
  else if (data.margin_y === 'md') marginYClass = 'my-6 sm:my-8';
  else if (data.margin_y === 'lg') marginYClass = 'my-10 sm:my-16';

  // ─── Border Radius ───────────────────────────────────────────────────────
  let roundedClass = '';
  if (data.border_radius === 'sm') roundedClass = 'rounded-lg';
  else if (data.border_radius === 'md') roundedClass = 'rounded-xl';
  else if (data.border_radius === 'lg') roundedClass = 'rounded-2xl';
  else if (data.border_radius === 'full') roundedClass = 'rounded-3xl';

  // ─── Border Style ────────────────────────────────────────────────────────
  let borderClass = 'border-b border-border/30';
  if (data.border_style === 'none') borderClass = '';
  else if (data.border_style === 'solid') borderClass = 'border border-border';
  else if (data.border_style === 'accent') borderClass = 'border-2 border-primary/50';
  else if (data.border_style === 'dashed') borderClass = 'border-2 border-dashed border-border';

  // ─── Box Shadow ──────────────────────────────────────────────────────────
  let shadowClass = '';
  if (data.box_shadow === 'sm') shadowClass = 'shadow-sm';
  else if (data.box_shadow === 'md') shadowClass = 'shadow-md';
  else if (data.box_shadow === 'lg') shadowClass = 'shadow-2xl';
  else if (data.box_shadow === 'glow') shadowClass = 'shadow-[0_0_35px_rgba(184,144,71,0.25)]';

  // ─── Alignment ───────────────────────────────────────────────────────────
  let alignClass = '';
  const chosenAlign = styleSettings.alignment || data.alignment;
  if (chosenAlign === 'center') alignClass = 'text-center';
  else if (chosenAlign === 'left') alignClass = 'text-left';
  else if (chosenAlign === 'right') alignClass = 'text-right';
  else if (chosenAlign === 'justify') alignClass = 'text-justify';

  if (isMobile && data.mobile_align === 'center') alignClass = 'text-center';
  if (isMobile && data.mobile_align === 'left') alignClass = 'text-left';

  // ─── Heading Font ────────────────────────────────────────────────────────
  const headingFontClass = data.heading_font === 'sans' ? 'font-sans' : 'font-serif';

  // ─── Custom Styles Object ────────────────────────────────────────────────
  const style: React.CSSProperties = {};

  // Background
  if (styleSettings.backgroundColor) {
    style.backgroundColor = styleSettings.backgroundColor;
  } else if (data.bg_type === 'solid' && data.bg_color) {
    style.backgroundColor = data.bg_color;
  }
  if (styleSettings.backgroundGradient) {
    style.background = styleSettings.backgroundGradient;
  } else if (data.bg_type === 'gradient' && data.bg_gradient) {
    style.background = data.bg_gradient;
  }

  // Text Color
  if (styleSettings.textColor) {
    style.color = styleSettings.textColor;
  } else if (data.text_color) {
    style.color = data.text_color;
  }

  // Typography
  if (styleSettings.typography) {
    const t = styleSettings.typography;
    if (t.family) style.fontFamily = t.family;
    if (t.size) style.fontSize = `${t.size}px`;
    if (t.weight) style.fontWeight = t.weight;
    if (t.transform && t.transform !== 'none') style.textTransform = t.transform;
    if (t.style) style.fontStyle = t.style;
    if (t.decoration && t.decoration !== 'none') style.textDecoration = t.decoration;
    if (t.lineHeight) style.lineHeight = t.lineHeight;
    if (t.letterSpacing) style.letterSpacing = `${t.letterSpacing}px`;
    if (t.wordSpacing) style.wordSpacing = `${t.wordSpacing}px`;
  }

  // Border & Radius
  if (styleSettings.borderType && styleSettings.borderType !== 'none') {
    style.border = `${styleSettings.borderWidth || 1}px ${styleSettings.borderType} ${styleSettings.borderColor || '#e5e7eb'}`;
  } else if (data.border_color) {
    style.borderColor = data.border_color;
  }
  if (styleSettings.borderRadius !== undefined) {
    style.borderRadius = `${styleSettings.borderRadius}px`;
  }

  // Box Shadow
  if (styleSettings.boxShadow && styleSettings.boxShadow !== 'none') {
    if (styleSettings.boxShadow === 'sm') shadowClass = 'shadow-sm';
    else if (styleSettings.boxShadow === 'md') shadowClass = 'shadow-md';
    else if (styleSettings.boxShadow === 'lg') shadowClass = 'shadow-xl';
    else if (styleSettings.boxShadow === 'glow') shadowClass = 'shadow-[0_0_35px_rgba(184,144,71,0.25)]';
  }

  // Advanced Margins & Paddings
  if (advanced.margin) {
    if (advanced.margin.top !== undefined) style.marginTop = `${advanced.margin.top}px`;
    if (advanced.margin.right !== undefined) style.marginRight = `${advanced.margin.right}px`;
    if (advanced.margin.bottom !== undefined) style.marginBottom = `${advanced.margin.bottom}px`;
    if (advanced.margin.left !== undefined) style.marginLeft = `${advanced.margin.left}px`;
  }
  if (advanced.padding) {
    if (advanced.padding.top !== undefined) style.paddingTop = `${advanced.padding.top}px`;
    if (advanced.padding.right !== undefined) style.paddingRight = `${advanced.padding.right}px`;
    if (advanced.padding.bottom !== undefined) style.paddingBottom = `${advanced.padding.bottom}px`;
    if (advanced.padding.left !== undefined) style.paddingLeft = `${advanced.padding.left}px`;
  } else if (data.padding_y_custom) {
    style.paddingTop = `${data.padding_y_custom}px`;
    style.paddingBottom = `${data.padding_y_custom}px`;
  }

  if (advanced.zIndex !== undefined) {
    style.zIndex = advanced.zIndex;
  }

  // Parse arbitrary custom inline css (e.g. "letter-spacing: 0.1em; opacity: 0.95")
  const customCssStr = advanced.customCss || data.custom_css;
  if (customCssStr && typeof customCssStr === 'string') {
    try {
      const declarations = customCssStr.split(';').map((s: string) => s.trim()).filter(Boolean);
      for (const decl of declarations) {
        const [prop, val] = decl.split(':').map((s: string) => s.trim());
        if (prop && val) {
          const camelProp = prop.replace(/-([a-z])/g, (_: any, w: string) => w.toUpperCase());
          (style as any)[camelProp] = val;
        }
      }
    } catch (_) {}
  }

  // Build combined section & inner classes
  const customClasses = `${data.custom_classes || ''} ${advanced.cssClasses || ''}`.trim();
  const sectionClass = `relative overflow-hidden ${paddingYClass} ${marginYClass} ${roundedClass} ${borderClass} ${shadowClass} ${visibilityClass} ${customClasses}`.trim();
  const innerClass = `${maxWidthClass} ${paddingXClass} ${alignClass} relative z-10`.trim();

  return {
    sectionClass,
    innerClass,
    style,
    headingFontClass,
    alignClass,
    hasBgImage: data.bg_type === 'image' && Boolean(data.bg_image),
    bgImageUrl: data.bg_image,
    bgOverlayOpacity: typeof data.bg_overlay === 'number' ? data.bg_overlay : 50,
    bgBlur: data.bg_blur,
    hideOnMobile,
    hideOnDesktop,
    cssId: advanced.cssId,
  };
}

export default function BlockRenderer({
  block,
  isInteractive = true,
  deviceView,
  onDataChange,
}: BlockRendererProps) {
  const { type, data } = block;

  // ── Inline editing state ────────────────────────────────────────────────────
  const [inlineEditField, setInlineEditField] = useState<string | null>(null);

  const isMobile = deviceView === 'mobile';
  const isTablet = deviceView === 'tablet';

  const layout = getBlockLayoutAndStyle(block, isMobile);

  // Helper: commit inline edit from a contentEditable node (supports both top-level keys & nested 'items.0.title')
  const commitInlineEdit = (fieldPath: string, el: HTMLElement) => {
    if (!onDataChange) return;
    const text = el.innerText.trim();
    const nextData = { ...data };

    if (fieldPath.includes('.')) {
      const parts = fieldPath.split('.');
      if (parts.length === 3) {
        const [arrName, idxStr, propName] = parts;
        const idx = parseInt(idxStr, 10);
        if (Array.isArray(nextData[arrName]) && nextData[arrName][idx]) {
          const nextArr = [...nextData[arrName]];
          nextArr[idx] = { ...nextArr[idx], [propName]: text };
          nextData[arrName] = nextArr;
          onDataChange(block.id, nextData);
        }
      }
    } else {
      if (text !== nextData[fieldPath]) {
        nextData[fieldPath] = text;
        onDataChange(block.id, nextData);
      }
    }
    setInlineEditField(null);
  };

  // Helper: whether we are in edit mode for a given field
  const isEditing = (field: string) => inlineEditField === field && !!onDataChange;

  // Canvas Image Action: Trigger PC file picker and convert to base64 DataURL
  const triggerImageUpload = (targetField: string = 'image_url') => {
    if (!onDataChange) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onDataChange(block.id, { ...data, [targetField]: reader.result });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Canvas Image Action: Remove / clear image
  const removeImage = (targetField: string = 'image_url') => {
    if (!onDataChange) return;
    onDataChange(block.id, { ...data, [targetField]: '' });
  };

  // Canvas Image Action: Resize image width percentage
  const resizeImage = (widthPercent: number, targetField: string = 'width_percent') => {
    if (!onDataChange) return;
    onDataChange(block.id, { ...data, [targetField]: widthPercent });
  };

  // Canvas Image Action: Set alignment
  const alignImage = (alignment: 'left' | 'center' | 'right', targetField: string = 'alignment') => {
    if (!onDataChange) return;
    onDataChange(block.id, { ...data, [targetField]: alignment });
  };

  // In the editor canvas, show placeholder if hidden on the current viewport
  if (!isInteractive) {
    if (isMobile && layout.hideOnMobile) {
      return (
        <div className="p-4 mx-4 my-2 border border-dashed border-amber-500/40 bg-amber-500/10 rounded-lg text-center text-xs text-amber-500 flex items-center justify-center gap-2">
          <EyeOff size={14} />
          <span>This {type.replace('_', ' ')} block is hidden on Mobile devices</span>
        </div>
      );
    }
    if ((!deviceView || deviceView === 'desktop') && layout.hideOnDesktop) {
      return (
        <div className="p-4 mx-4 my-2 border border-dashed border-blue-500/40 bg-blue-500/10 rounded-lg text-center text-xs text-blue-500 flex items-center justify-center gap-2">
          <EyeOff size={14} />
          <span>This {type.replace('_', ' ')} block is hidden on Desktop devices</span>
        </div>
      );
    }
  }

  // Background Image Overlay Component
  const bgImageLayer = layout.hasBgImage && (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <img
        src={layout.bgImageUrl}
        alt="Section Background"
        className={`w-full h-full object-cover ${layout.bgBlur === 'md' ? 'blur-md scale-105' : layout.bgBlur === 'sm' ? 'blur-xs scale-102' : ''}`}
      />
      <div
        className="absolute inset-0 bg-black transition-opacity"
        style={{ opacity: layout.bgOverlayOpacity / 100 }}
      />
    </div>
  );

  switch (type) {
    // ═════════════════════════════════════════════════════════════════════════
    // ELEMENTOR CORE WIDGETS
    // ═════════════════════════════════════════════════════════════════════════

    case 'CONTAINER':
    case 'GRID': {
      const cols = data.columns || 1;
      let gridClass = 'flex flex-col';
      if (cols === 2) gridClass = 'grid grid-cols-1 md:grid-cols-2';
      else if (cols === 3) gridClass = 'grid grid-cols-1 md:grid-cols-3';
      else if (cols === 4) gridClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
      else if (cols === '1/3-2/3') gridClass = 'grid grid-cols-1 md:grid-cols-12 [&>*:first-child]:md:col-span-4 [&>*:last-child]:md:col-span-8';
      else if (cols === '2/3-1/3') gridClass = 'grid grid-cols-1 md:grid-cols-12 [&>*:first-child]:md:col-span-8 [&>*:last-child]:md:col-span-4';

      const gapClass = data.gap === 'none' ? 'gap-0' : data.gap === 'sm' ? 'gap-3' : data.gap === 'lg' ? 'gap-8 sm:gap-12' : 'gap-5 sm:gap-6';

      return (
        <section id={layout.cssId} className={layout.sectionClass} style={layout.style}>
          {bgImageLayer}
          <div className={`${layout.innerClass}`}>
            <div className={`${gridClass} ${gapClass} items-${data.align_items || 'start'}`}>
              {block.children && block.children.length > 0 ? (
                block.children.map((child) => (
                  <BlockRenderer key={child.id} block={child} isInteractive={isInteractive} deviceView={deviceView} onDataChange={onDataChange} />
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg w-full">
                  Empty Container • Click + in Elementor to add widgets
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    case 'HEADING': {
      const Tag = (data.tag || 'h2') as any;
      const editing = isEditing('title');

      const headingEl = (
        <Tag
          contentEditable={editing}
          suppressContentEditableWarning
          onDoubleClick={(e: React.MouseEvent) => {
            if (!onDataChange) return;
            e.stopPropagation();
            setInlineEditField('title');
          }}
          onBlur={(e: React.FocusEvent<HTMLElement>) => {
            if (editing) commitInlineEdit('title', e.currentTarget);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitInlineEdit('title', e.currentTarget as HTMLElement);
              (e.currentTarget as HTMLElement).blur();
            }
            if (e.key === 'Escape') {
              (e.currentTarget as HTMLElement).innerText = data.title || '';
              (e.currentTarget as HTMLElement).blur();
              setInlineEditField(null);
            }
          }}
          className={`${
            layout.headingFontClass
          } font-bold tracking-tight leading-tight ${
            Tag === 'h1' ? 'text-3xl sm:text-5xl md:text-6xl' :
            Tag === 'h2' ? 'text-2xl sm:text-4xl' :
            Tag === 'h3' ? 'text-xl sm:text-2xl' :
            Tag === 'h4' ? 'text-lg sm:text-xl' :
            'text-base'
          } ${
            editing
              ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-white/5 min-w-[80px]'
              : onDataChange ? 'cursor-text hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:outline-offset-4 hover:rounded' : ''
          }`}
          style={layout.style}
          title={onDataChange ? 'Double-click to edit' : undefined}
        >
          {data.title || 'Add Your Heading Text Here'}
        </Tag>
      );

      return (
        <div id={layout.cssId} className={`${layout.innerClass} py-3 relative`}>
          {editing && (
            <div className="absolute -top-7 left-0 z-50 flex items-center gap-1 bg-white text-slate-800 text-[10px] px-2 py-1 rounded shadow-md border border-slate-200">
              <span className="text-[#e2285c] font-bold">✏ Editing Heading</span>
              <span className="text-slate-500">• Press Enter or click outside to save</span>
            </div>
          )}
          {data.link_url ? (
            <Link href={data.link_url} className="hover:opacity-80 transition inline-block">
              {headingEl}
            </Link>
          ) : (
            headingEl
          )}
        </div>
      );
    }

    case 'TEXT_EDITOR': {
      const html = data.content || data.html_content || '<p>Type or paste your rich story text here...</p>';
      const editing = isEditing('content');

      return (
        <div id={layout.cssId} className={`${layout.innerClass} py-3 relative`}>
          {editing && (
            <div className="absolute -top-7 left-0 z-50 flex items-center gap-1 bg-white text-slate-800 text-[10px] px-2 py-1 rounded shadow-md border border-slate-200">
              <span className="text-[#e2285c] font-bold">✏ Editing Text</span>
              <span className="text-slate-500">• Esc to cancel</span>
            </div>
          )}
          <div
            contentEditable={editing}
            suppressContentEditableWarning
            onDoubleClick={(e) => {
              if (!onDataChange) return;
              e.stopPropagation();
              setInlineEditField('content');
            }}
            onPaste={(e) => {
              if (!editing) return;
              const items = e.clipboardData.items ? Array.from(e.clipboardData.items) : [];
              const imageItem = items.find((item) => item.type.startsWith('image/'));
              const files = e.clipboardData.files ? Array.from(e.clipboardData.files) : [];
              const imageFile = files.find((f) => f.type.startsWith('image/')) || (imageItem ? imageItem.getAsFile() : null);

              let rawHtml = e.clipboardData.getData('text/html');
              const plainText = e.clipboardData.getData('text/plain');

              if (!rawHtml && !plainText?.trim() && imageFile) {
                e.preventDefault();
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    document.execCommand('insertHTML', false, `<img src="${reader.result}" alt="Pasted Image" style="max-width:100%;height:auto;margin:1rem 0;" />`);
                  }
                };
                reader.readAsDataURL(imageFile);
                return;
              }

              // If rawHtml is empty, check if plainText is raw HTML markup
              if (!rawHtml && plainText) {
                const trimmed = plainText.trim();
                if (/<([a-z][a-z0-9]*)\b[^>]*>/i.test(trimmed)) {
                  rawHtml = trimmed;
                }
              }

              if (rawHtml) {
                e.preventDefault();
                const parser = new DOMParser();
                const doc = parser.parseFromString(rawHtml, 'text/html');

                ['script', 'meta', 'link', 'head'].forEach((tag) => {
                  Array.from(doc.getElementsByTagName(tag)).forEach((el) => el.remove());
                });

                // Unwrap Word XML/Office tags and preserve images
                doc.querySelectorAll('*').forEach((el) => {
                  const tagLower = el.tagName.toLowerCase();
                  if (tagLower.endsWith('imagedata') || tagLower === 'v:imagedata') {
                    const src = el.getAttribute('src') || el.getAttribute('href') || '';
                    if (src) {
                      const img = doc.createElement('img');
                      img.setAttribute('src', src);
                      img.setAttribute('style', 'max-width: 100%; height: auto;');
                      el.parentNode?.replaceChild(img, el);
                      return;
                    }
                  }
                  if (el.tagName.includes(':')) {
                    const parent = el.parentNode;
                    if (parent) {
                      while (el.firstChild) parent.insertBefore(el.firstChild, el);
                      parent.removeChild(el);
                    }
                    return;
                  }
                  // Keep all valid inline styles, strip only mso-*
                  const style = el.getAttribute('style');
                  if (style) {
                    const cleaned = style
                      .split(';')
                      .map((s) => s.trim())
                      .filter((s) => {
                        if (!s) return false;
                        const prop = s.split(':')[0].trim().toLowerCase();
                        return !prop.startsWith('mso-') && !prop.startsWith('-mso-') && prop !== 'tab-stops';
                      })
                      .join('; ');
                    if (cleaned) el.setAttribute('style', cleaned);
                  }
                });

                // Ensure images have max-width
                doc.querySelectorAll('img').forEach((img) => {
                  const s = img.getAttribute('style') || '';
                  if (!s.includes('max-width')) {
                    img.setAttribute('style', `max-width:100%;height:auto;${s ? ' ' + s : ''}`);
                  }
                });

                const body = doc.body;
                const cleanedHtml = body ? body.innerHTML : rawHtml;
                document.execCommand('insertHTML', false, cleanedHtml);
              }
            }}
            onBlur={(e) => {
              if (editing && onDataChange) {
                const newHtml = e.currentTarget.innerHTML;
                if (newHtml !== html) {
                  onDataChange(block.id, { ...data, content: newHtml, html_content: newHtml });
                }
                setInlineEditField(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.innerHTML = html;
                e.currentTarget.blur();
                setInlineEditField(null);
              }
            }}
            className={`wp-editor-content prose prose-neutral max-w-none text-sm leading-relaxed ${
              editing
                ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-white/5 p-2'
                : onDataChange ? 'cursor-text hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:outline-offset-4 hover:rounded' : ''
            }`}
            style={layout.style}
            title={onDataChange ? 'Double-click to edit' : undefined}
            dangerouslySetInnerHTML={editing ? undefined : { __html: html }}
          />
        </div>
      );
    }

    case 'BUTTON': {
      const label = data.label || data.text || 'Click Here';
      const url = data.url || data.link || '#';
      const variant = data.variant || 'luxury';
      const size = data.size || 'md';
      const editing = isEditing('label');

      let sizeClass = 'px-6 py-2.5 text-xs';
      if (size === 'sm') sizeClass = 'px-4 py-1.5 text-xs';
      else if (size === 'lg') sizeClass = 'px-8 py-3.5 text-sm';
      else if (size === 'xl') sizeClass = 'px-10 py-4 text-base font-bold';

      let variantClass = 'btn-luxury font-semibold uppercase tracking-wider rounded-md shadow-md';
      if (variant === 'outline') variantClass = 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold rounded-md transition';
      else if (variant === 'dark') variantClass = 'bg-black text-white hover:bg-neutral-800 font-semibold rounded-md transition';
      else if (variant === 'light') variantClass = 'bg-white text-black hover:bg-neutral-100 font-semibold rounded-md transition shadow-xs';

      const IconComponent = data.icon ? ICON_MAP[data.icon] || ArrowRight : null;

      const buttonInner = (
        <>
          {data.icon_position === 'left' && IconComponent && <IconComponent size={14} />}
          <span
            contentEditable={editing}
            suppressContentEditableWarning
            onDoubleClick={(e) => {
              if (!onDataChange) return;
              e.preventDefault();
              e.stopPropagation();
              setInlineEditField('label');
            }}
            onBlur={(e) => {
              if (editing) commitInlineEdit('label', e.currentTarget);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitInlineEdit('label', e.currentTarget as HTMLElement);
                (e.currentTarget as HTMLElement).blur();
              }
              if (e.key === 'Escape') {
                (e.currentTarget as HTMLElement).innerText = label;
                (e.currentTarget as HTMLElement).blur();
                setInlineEditField(null);
              }
            }}
            className={editing ? 'outline-none border-b border-dashed border-white/60 cursor-text min-w-[20px]' : ''}
            title={onDataChange && !editing ? 'Double-click to edit label' : undefined}
          >
            {label}
          </span>
          {data.icon_position !== 'left' && IconComponent && <IconComponent size={14} />}
        </>
      );

      return (
        <div id={layout.cssId} className={`${layout.innerClass} py-3 relative`}>
          {editing && (
            <div className="absolute -top-7 left-0 z-50 flex items-center gap-1 bg-white text-slate-800 text-[10px] px-2 py-1 rounded shadow-md border border-slate-200">
              <span className="text-[#e2285c] font-bold">✏ Editing Button</span>
              <span className="text-slate-500">• Enter to save</span>
            </div>
          )}
          {/* In editor: div wrapper so button doesn't navigate; in frontend: real Link */}
          {onDataChange ? (
            <div
              className={`inline-flex items-center gap-2 ${sizeClass} ${variantClass} hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:outline-offset-4 hover:rounded`}
              style={layout.style}
            >
              {buttonInner}
            </div>
          ) : (
            <Link
              href={url}
              className={`inline-flex items-center gap-2 ${sizeClass} ${variantClass}`}
              style={layout.style}
            >
              {buttonInner}
            </Link>
          )}
        </div>
      );
    }

    case 'VIDEO': {
      let embedUrl = data.url || data.video_url || '';
      if (embedUrl.includes('youtube.com/watch?v=')) {
        embedUrl = embedUrl.replace('watch?v=', 'embed/');
      } else if (embedUrl.includes('youtu.be/')) {
        embedUrl = embedUrl.replace('youtu.be/', 'www.youtube.com/embed/');
      } else if (embedUrl.includes('vimeo.com/')) {
        embedUrl = embedUrl.replace('vimeo.com/', 'player.vimeo.com/video/');
      }

      return (
        <div id={layout.cssId} className={`${layout.innerClass} py-4`}>
          <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md bg-black">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                Enter a YouTube or Vimeo URL in Elementor panel
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'DIVIDER': {
      const lineStyle = data.style || 'solid';
      const widthPercent = data.width || 100;
      return (
        <div id={layout.cssId} className={`${layout.innerClass} py-4 flex items-center justify-${layout.alignClass.includes('center') ? 'center' : layout.alignClass.includes('right') ? 'end' : 'start'}`}>
          <div className="w-full flex items-center gap-4" style={{ width: `${widthPercent}%` }}>
            <div className={`flex-1 border-t border-border`} style={{ borderTopStyle: lineStyle as any }} />
            {data.text && (
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-2 shrink-0">
                {data.text}
              </span>
            )}
            <div className={`flex-1 border-t border-border`} style={{ borderTopStyle: lineStyle as any }} />
          </div>
        </div>
      );
    }

    case 'ICON': {
      const IconComponent = data.icon ? ICON_MAP[data.icon] || Sparkles : Sparkles;
      const size = data.size || 36;
      return (
        <div id={layout.cssId} className={`${layout.innerClass} py-3`}>
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <IconComponent size={size} />
          </div>
        </div>
      );
    }

    case 'PRODUCTS_GRID': {
      return (
        <section id={layout.cssId} className={layout.sectionClass} style={layout.style}>
          <div className={layout.innerClass}>
            {(data.title || data.subtitle) && (
              <div className="text-center mb-8">
                {data.title && <h2 className={`${layout.headingFontClass} text-2xl sm:text-3xl font-bold mb-2`}>{data.title}</h2>}
                {data.subtitle && <p className="text-xs sm:text-sm text-muted-foreground">{data.subtitle}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-2 group cursor-pointer">
                  <div className="aspect-[3/4] bg-muted/60 rounded-lg overflow-hidden relative">
                    <img
                      src={`https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80`}
                      alt="Product"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                      Featured
                    </span>
                  </div>
                  <h4 className="text-xs font-bold truncate">Royal Nada Modest Abaya</h4>
                  <p className="text-xs font-semibold text-primary">AED 390.00</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'HERO': {
      const isCenter = layout.alignClass.includes('text-center') || (!layout.alignClass && data.alignment !== 'left');
      const defaultBg = !data.bg_type || data.bg_type === 'default'
        ? 'bg-gradient-to-b from-card/80 via-background to-background'
        : '';

      return (
        <section className={`${layout.sectionClass} ${defaultBg} group/hero relative`} style={layout.style}>
          {bgImageLayer}
          {/* Floating Canvas Quick Toolbar for Hero Background Image */}
          {onDataChange && (
            <div className="absolute top-3 right-3 z-30 opacity-0 group-hover/hero:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/95 text-slate-800 border border-slate-200/90 p-1.5 rounded-lg shadow-xl backdrop-blur-xs select-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerImageUpload('bg_image');
                }}
                className="px-2 py-1 bg-slate-100 hover:bg-[#e2285c] hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Upload / Change Hero Background Image"
              >
                <Upload size={12} />
                <span>Background Image</span>
              </button>
              {data.bg_image && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage('bg_image');
                  }}
                  className="p-1 hover:bg-rose-50 text-rose-600 rounded transition cursor-pointer"
                  title="Remove Background Image"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
          {!layout.hasBgImage && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
          )}
          <div className={`${layout.innerClass} ${isCenter ? 'text-center' : 'text-left'}`}>
            {data.badge && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-4 sm:mb-6 ${isCenter ? 'mx-auto' : ''}`}>
                <Sparkles size={13} />
                {data.badge}
              </div>
            )}
            <h1
              contentEditable={isEditing('title')}
              suppressContentEditableWarning
              onDoubleClick={(e) => {
                if (!onDataChange) return;
                e.stopPropagation();
                setInlineEditField('title');
              }}
              onBlur={(e) => {
                if (isEditing('title')) commitInlineEdit('title', e.currentTarget);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitInlineEdit('title', e.currentTarget as HTMLElement);
                  (e.currentTarget as HTMLElement).blur();
                }
                if (e.key === 'Escape') {
                  (e.currentTarget as HTMLElement).innerText = data.title || '';
                  (e.currentTarget as HTMLElement).blur();
                  setInlineEditField(null);
                }
              }}
              className={`${layout.headingFontClass} ${isMobile ? 'text-2xl leading-tight' : 'text-3xl sm:text-5xl md:text-6xl'} font-bold tracking-tight leading-[1.15] mb-4 sm:mb-6 ${
                isEditing('title')
                  ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-white/5'
                  : onDataChange ? 'cursor-text hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:outline-offset-4 hover:rounded' : ''
              }`}
              title={onDataChange ? 'Double-click to edit' : undefined}
            >
              {data.title || 'Welcome to our Atelier'}
            </h1>
            {(data.subtitle || isEditing('subtitle')) && (
              <p
                contentEditable={isEditing('subtitle')}
                suppressContentEditableWarning
                onDoubleClick={(e) => {
                  if (!onDataChange) return;
                  e.stopPropagation();
                  setInlineEditField('subtitle');
                }}
                onBlur={(e) => {
                  if (isEditing('subtitle')) commitInlineEdit('subtitle', e.currentTarget);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    commitInlineEdit('subtitle', e.currentTarget as HTMLElement);
                    (e.currentTarget as HTMLElement).blur();
                  }
                  if (e.key === 'Escape') {
                    (e.currentTarget as HTMLElement).innerText = data.subtitle || '';
                    (e.currentTarget as HTMLElement).blur();
                    setInlineEditField(null);
                  }
                }}
                className={`${isMobile ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'} opacity-85 leading-relaxed max-w-3xl mb-6 sm:mb-8 ${isCenter ? 'mx-auto' : ''} ${
                  isEditing('subtitle')
                    ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-white/5'
                    : onDataChange ? 'cursor-text hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:outline-offset-4 hover:rounded' : ''
                }`}
                title={onDataChange ? 'Double-click to edit' : undefined}
              >
                {data.subtitle}
              </p>
            )}
            <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-wrap'} items-center gap-3 sm:gap-4 ${isCenter ? 'justify-center' : 'justify-start'}`}>
              {data.primary_button?.label && (
                <Link
                  href={data.primary_button.url || '/catalog'}
                  className={`${isMobile ? 'w-full justify-center text-center' : ''} px-6 py-3 rounded-md btn-luxury text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 shadow-lg`}
                >
                  {data.primary_button.label}
                  <ArrowRight size={14} />
                </Link>
              )}
              {data.secondary_button?.label && (
                <Link
                  href={data.secondary_button.url || '#'}
                  className={`${isMobile ? 'w-full justify-center text-center' : ''} px-6 py-3 rounded-md border border-border bg-card/60 hover:bg-accent text-foreground text-xs font-semibold uppercase tracking-wider transition inline-flex items-center gap-2`}
                >
                  {data.secondary_button.label}
                </Link>
              )}
            </div>
          </div>
        </section>
      );
    }

    case 'TWO_COLUMN': {
      const isImgLeft = data.image_position === 'left';
      const reverseOnMobile = Boolean(data.mobile_reverse);

      const gridClass = isMobile
        ? 'grid grid-cols-1 gap-8 items-center'
        : `grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${isImgLeft ? '' : 'lg:grid-flow-dense'}`;

      return (
        <section className={layout.sectionClass} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            <div className={gridClass}>
              {/* Image Column with Canvas Image Controls */}
              <div className={`relative ${isMobile && reverseOnMobile ? 'order-last' : ''} ${!isMobile && !isImgLeft ? 'lg:col-start-2' : ''}`}>
                <div className={`group/img relative ${isMobile ? 'aspect-[16/10] max-h-[280px]' : 'aspect-[4/3]'} rounded-2xl overflow-hidden border border-border/60 shadow-xl bg-card`}>
                  {data.image_url ? (
                    <>
                      <img
                        src={data.image_url}
                        alt={data.heading || 'Story Image'}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      {/* Floating Canvas Quick Toolbar on Hover in Editor */}
                      {onDataChange && (
                        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/95 text-slate-800 border border-slate-200/90 p-1 rounded-lg shadow-xl backdrop-blur-xs select-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerImageUpload('image_url');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-[#e2285c] hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Replace / Upload Image from Computer"
                          >
                            <Upload size={12} />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage('image_url');
                            }}
                            className="p-1 hover:bg-rose-50 rounded text-rose-600 hover:text-rose-700 transition cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      onClick={() => onDataChange && triggerImageUpload('image_url')}
                      className={`w-full h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground ${
                        onDataChange ? 'cursor-pointer hover:bg-primary/5 border-2 border-dashed border-primary/40 rounded-2xl transition' : ''
                      }`}
                    >
                      <ImageIcon size={32} className="text-primary mb-2 opacity-60" />
                      <p className="text-xs font-bold text-foreground">No Image Selected</p>
                      {onDataChange && (
                        <span className="text-[11px] text-primary underline mt-1 font-semibold flex items-center gap-1">
                          <Upload size={12} />
                          Click to upload from computer
                        </span>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none rounded-2xl" />
                </div>
              </div>

              {/* Text Column with Double-Click Inline Editing */}
              <div className={`space-y-4 sm:space-y-6 ${isMobile && reverseOnMobile ? 'order-first' : ''} ${!isMobile && !isImgLeft ? 'lg:col-start-1' : ''}`}>
                {(data.subheading || isEditing('subheading')) && (
                  <div className="relative">
                    {isEditing('subheading') && (
                      <div className="absolute -top-7 left-0 z-50 flex items-center gap-1.5 bg-white text-slate-800 text-[10px] px-2 py-0.5 rounded shadow-md border border-slate-200">
                        <span className="text-rose-600 font-bold">✏ Eyebrow</span>
                        <span className="text-slate-500">• Enter to save</span>
                      </div>
                    )}
                    <span
                      contentEditable={isEditing('subheading')}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        if (!onDataChange) return;
                        e.stopPropagation();
                        setInlineEditField('subheading');
                      }}
                      onBlur={(e) => {
                        if (isEditing('subheading')) commitInlineEdit('subheading', e.currentTarget);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitInlineEdit('subheading', e.currentTarget as HTMLElement);
                          (e.currentTarget as HTMLElement).blur();
                        }
                        if (e.key === 'Escape') {
                          (e.currentTarget as HTMLElement).innerText = data.subheading || '';
                          (e.currentTarget as HTMLElement).blur();
                          setInlineEditField(null);
                        }
                      }}
                      className={`text-xs sm:text-xs font-bold tracking-widest uppercase text-primary block ${
                        isEditing('subheading')
                          ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-2 rounded cursor-text bg-rose-50/60'
                          : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                      }`}
                      title={onDataChange ? 'Double-click to edit eyebrow' : undefined}
                    >
                      {data.subheading || 'ARTISANAL PERFECTION'}
                    </span>
                  </div>
                )}

                <div className="relative">
                  {isEditing('heading') && (
                    <div className="absolute -top-7 left-0 z-50 flex items-center gap-1.5 bg-white text-slate-800 text-[10px] px-2 py-0.5 rounded shadow-md border border-slate-200">
                      <span className="text-rose-600 font-bold">✏ Heading</span>
                      <span className="text-slate-500">• Enter to save</span>
                    </div>
                  )}
                  <h2
                    contentEditable={isEditing('heading')}
                    suppressContentEditableWarning
                    onDoubleClick={(e) => {
                      if (!onDataChange) return;
                      e.stopPropagation();
                      setInlineEditField('heading');
                    }}
                    onBlur={(e) => {
                      if (isEditing('heading')) commitInlineEdit('heading', e.currentTarget);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        commitInlineEdit('heading', e.currentTarget as HTMLElement);
                        (e.currentTarget as HTMLElement).blur();
                      }
                      if (e.key === 'Escape') {
                        (e.currentTarget as HTMLElement).innerText = data.heading || '';
                        (e.currentTarget as HTMLElement).blur();
                        setInlineEditField(null);
                      }
                    }}
                    className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-4xl'} font-bold tracking-tight leading-snug ${
                      isEditing('heading')
                        ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-rose-50/60'
                        : onDataChange ? 'cursor-text hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:outline-offset-4 hover:rounded' : ''
                    }`}
                    title={onDataChange ? 'Double-click to edit heading' : undefined}
                  >
                    {data.heading || 'Our Heritage & Design Philosophy'}
                  </h2>
                </div>

                <div className="relative">
                  {isEditing('content') && (
                    <div className="absolute -top-7 left-0 z-50 flex items-center gap-1.5 bg-white text-slate-800 text-[10px] px-2 py-0.5 rounded shadow-md border border-slate-200">
                      <span className="text-rose-600 font-bold">✏ Paragraph</span>
                      <span className="text-slate-500">• Click outside to save</span>
                    </div>
                  )}
                  <div
                    contentEditable={isEditing('content')}
                    suppressContentEditableWarning
                    onDoubleClick={(e) => {
                      if (!onDataChange) return;
                      e.stopPropagation();
                      setInlineEditField('content');
                    }}
                    onBlur={(e) => {
                      if (isEditing('content')) commitInlineEdit('content', e.currentTarget);
                    }}
                    className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} opacity-85 leading-relaxed whitespace-pre-line space-y-2.5 ${
                      isEditing('content')
                        ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-rose-50/60 p-2'
                        : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                    }`}
                    title={onDataChange ? 'Double-click to edit story content' : undefined}
                  >
                    {data.content || 'Every garment is crafted with meticulous attention to detail.'}
                  </div>
                </div>

                {Array.isArray(data.highlights) && data.highlights.length > 0 && (
                  <ul className="space-y-2 pt-1 sm:pt-2">
                    {data.highlights.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm font-medium">
                        <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {data.cta_button?.label && (
                  <div className="pt-2">
                    <Link
                      href={data.cta_button.url || '/catalog'}
                      className={`${isMobile ? 'w-full justify-center text-center' : ''} px-5 py-2.5 rounded btn-luxury text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 shadow-sm`}
                    >
                      {data.cta_button.label}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    case 'STATS_COUNTER': {
      const stats = Array.isArray(data.stats) ? data.stats : [];

      let gridClass = 'grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center';
      if (isMobile) {
        gridClass = data.mobile_cols === '1'
          ? 'grid grid-cols-1 gap-3 text-center'
          : 'grid grid-cols-2 gap-3 text-center';
      } else if (isTablet) {
        gridClass = 'grid grid-cols-2 gap-4 text-center';
      }

      return (
        <section className={`${layout.sectionClass} bg-slate-50/70 border-y border-slate-100`} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            {(data.title || isEditing('title')) && (
              <div className="relative text-center mb-6 sm:mb-10">
                <h3
                  contentEditable={isEditing('title')}
                  suppressContentEditableWarning
                  onDoubleClick={(e) => {
                    if (!onDataChange) return;
                    e.stopPropagation();
                    setInlineEditField('title');
                  }}
                  onBlur={(e) => {
                    if (isEditing('title')) commitInlineEdit('title', e.currentTarget);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitInlineEdit('title', e.currentTarget as HTMLElement);
                      (e.currentTarget as HTMLElement).blur();
                    }
                  }}
                  className={`${layout.headingFontClass} ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold text-center inline-block ${
                    isEditing('title')
                      ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-rose-50/60'
                      : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                  }`}
                  title={onDataChange ? 'Double-click to edit title' : undefined}
                >
                  {data.title || 'Our Journey in Numbers'}
                </h3>
              </div>
            )}
            <div className={gridClass}>
              {stats.map((st: any, idx: number) => {
                const numKey = `stats.${idx}.number`;
                const lblKey = `stats.${idx}.label`;
                return (
                  <div
                    key={idx}
                    className={`${isMobile ? 'p-3.5' : 'p-6'} rounded-xl border border-slate-200/80 bg-white shadow-xs hover:border-primary/40 transition`}
                  >
                    <div
                      contentEditable={isEditing(numKey)}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        if (!onDataChange) return;
                        e.stopPropagation();
                        setInlineEditField(numKey);
                      }}
                      onBlur={(e) => {
                        if (isEditing(numKey)) commitInlineEdit(numKey, e.currentTarget);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitInlineEdit(numKey, e.currentTarget as HTMLElement);
                          (e.currentTarget as HTMLElement).blur();
                        }
                      }}
                      className={`font-serif ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl md:text-5xl'} font-extrabold text-primary mb-1 tracking-tight ${
                        isEditing(numKey)
                          ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                          : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                      }`}
                      title={onDataChange ? 'Double-click to edit number' : undefined}
                    >
                      {st.number}
                    </div>
                    <div
                      contentEditable={isEditing(lblKey)}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        if (!onDataChange) return;
                        e.stopPropagation();
                        setInlineEditField(lblKey);
                      }}
                      onBlur={(e) => {
                        if (isEditing(lblKey)) commitInlineEdit(lblKey, e.currentTarget);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitInlineEdit(lblKey, e.currentTarget as HTMLElement);
                          (e.currentTarget as HTMLElement).blur();
                        }
                      }}
                      className={`text-xs sm:text-xs text-slate-600 font-medium uppercase tracking-wider ${
                        isEditing(lblKey)
                          ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                          : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                      }`}
                      title={onDataChange ? 'Double-click to edit label' : undefined}
                    >
                      {st.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    case 'FEATURES_GRID': {
      const items = Array.isArray(data.items) ? data.items : [];

      let gridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6';
      if (isMobile) {
        gridClass = data.mobile_cols === '2'
          ? 'grid grid-cols-2 gap-2.5'
          : 'grid grid-cols-1 gap-3.5';
      } else if (isTablet) {
        gridClass = 'grid grid-cols-2 gap-4';
      } else if (data.columns === 3) {
        gridClass = 'grid grid-cols-1 md:grid-cols-3 gap-6';
      }

      return (
        <section className={layout.sectionClass} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            <div className={`text-center max-w-2xl mx-auto ${isMobile ? 'mb-8' : 'mb-14'}`}>
              <h2
                contentEditable={isEditing('heading')}
                suppressContentEditableWarning
                onDoubleClick={(e) => {
                  if (!onDataChange) return;
                  e.stopPropagation();
                  setInlineEditField('heading');
                }}
                onBlur={(e) => {
                  if (isEditing('heading')) commitInlineEdit('heading', e.currentTarget);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitInlineEdit('heading', e.currentTarget as HTMLElement);
                    (e.currentTarget as HTMLElement).blur();
                  }
                }}
                className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-4xl'} font-bold tracking-tight mb-2 sm:mb-3 ${
                  isEditing('heading')
                    ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-rose-50/60'
                    : onDataChange ? 'cursor-text hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                }`}
                title={onDataChange ? 'Double-click to edit heading' : undefined}
              >
                {data.heading || 'Crafted with Integrity'}
              </h2>
              {(data.subtitle || isEditing('subtitle')) && (
                <p
                  contentEditable={isEditing('subtitle')}
                  suppressContentEditableWarning
                  onDoubleClick={(e) => {
                    if (!onDataChange) return;
                    e.stopPropagation();
                    setInlineEditField('subtitle');
                  }}
                  onBlur={(e) => {
                    if (isEditing('subtitle')) commitInlineEdit('subtitle', e.currentTarget);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitInlineEdit('subtitle', e.currentTarget as HTMLElement);
                      (e.currentTarget as HTMLElement).blur();
                    }
                  }}
                  className={`text-xs sm:text-sm text-slate-600 ${
                    isEditing('subtitle')
                      ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-2 rounded cursor-text bg-rose-50/60'
                      : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                  }`}
                  title={onDataChange ? 'Double-click to edit subtitle' : undefined}
                >
                  {data.subtitle}
                </p>
              )}
            </div>
            <div className={gridClass}>
              {items.map((item: any, idx: number) => {
                const IconComponent = ICON_MAP[item.icon] || Sparkles;
                const titleKey = `items.${idx}.title`;
                const descKey = `items.${idx}.description`;

                return (
                  <div
                    key={idx}
                    className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-slate-200/90 bg-white hover:border-primary/40 hover:shadow-md transition duration-300 space-y-2.5`}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <IconComponent size={18} />
                    </div>
                    <h3
                      contentEditable={isEditing(titleKey)}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        if (!onDataChange) return;
                        e.stopPropagation();
                        setInlineEditField(titleKey);
                      }}
                      onBlur={(e) => {
                        if (isEditing(titleKey)) commitInlineEdit(titleKey, e.currentTarget);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitInlineEdit(titleKey, e.currentTarget as HTMLElement);
                          (e.currentTarget as HTMLElement).blur();
                        }
                      }}
                      className={`${layout.headingFontClass} text-sm sm:text-base font-bold ${
                        isEditing(titleKey)
                          ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                          : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                      }`}
                      title={onDataChange ? 'Double-click to edit feature title' : undefined}
                    >
                      {item.title}
                    </h3>
                    <p
                      contentEditable={isEditing(descKey)}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        if (!onDataChange) return;
                        e.stopPropagation();
                        setInlineEditField(descKey);
                      }}
                      onBlur={(e) => {
                        if (isEditing(descKey)) commitInlineEdit(descKey, e.currentTarget);
                      }}
                      className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${
                        isEditing(descKey)
                          ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                          : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                      }`}
                      title={onDataChange ? 'Double-click to edit feature description' : undefined}
                    >
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    case 'TESTIMONIALS': {
      const items = Array.isArray(data.items) ? data.items : [];
      const gridClass = isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-6';

      return (
        <section className={`${layout.sectionClass} bg-slate-50/60 border-y border-slate-100`} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            <div className={`text-center max-w-xl mx-auto ${isMobile ? 'mb-8' : 'mb-12'}`}>
              <h2
                contentEditable={isEditing('title')}
                suppressContentEditableWarning
                onDoubleClick={(e) => {
                  if (!onDataChange) return;
                  e.stopPropagation();
                  setInlineEditField('title');
                }}
                onBlur={(e) => {
                  if (isEditing('title')) commitInlineEdit('title', e.currentTarget);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitInlineEdit('title', e.currentTarget as HTMLElement);
                    (e.currentTarget as HTMLElement).blur();
                  }
                }}
                className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold mb-2 ${
                  isEditing('title')
                    ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                    : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                }`}
                title={onDataChange ? 'Double-click to edit title' : undefined}
              >
                {data.title || 'Client Expressions'}
              </h2>
              {(data.subtitle || isEditing('subtitle')) && (
                <p
                  contentEditable={isEditing('subtitle')}
                  suppressContentEditableWarning
                  onDoubleClick={(e) => {
                    if (!onDataChange) return;
                    e.stopPropagation();
                    setInlineEditField('subtitle');
                  }}
                  onBlur={(e) => {
                    if (isEditing('subtitle')) commitInlineEdit('subtitle', e.currentTarget);
                  }}
                  className={`text-xs sm:text-sm text-slate-600 ${
                    isEditing('subtitle')
                      ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                      : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                  }`}
                  title={onDataChange ? 'Double-click to edit subtitle' : undefined}
                >
                  {data.subtitle}
                </p>
              )}
            </div>
            <div className={gridClass}>
              {items.map((item: any, idx: number) => {
                const quoteKey = `items.${idx}.quote`;
                const authorKey = `items.${idx}.author`;
                const roleKey = `items.${idx}.role`;

                return (
                  <div key={idx} className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-slate-200/90 bg-white flex flex-col justify-between space-y-4 shadow-xs`}>
                    <div className="flex gap-1 text-primary">
                      {Array.from({ length: item.rating || 5 }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <p
                      contentEditable={isEditing(quoteKey)}
                      suppressContentEditableWarning
                      onDoubleClick={(e) => {
                        if (!onDataChange) return;
                        e.stopPropagation();
                        setInlineEditField(quoteKey);
                      }}
                      onBlur={(e) => {
                        if (isEditing(quoteKey)) commitInlineEdit(quoteKey, e.currentTarget);
                      }}
                      className={`text-xs sm:text-sm text-slate-700 italic leading-relaxed ${
                        isEditing(quoteKey)
                          ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                          : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                      }`}
                      title={onDataChange ? 'Double-click to edit review quote' : undefined}
                    >
                      "{item.quote}"
                    </p>
                    <div className="pt-2 border-t border-slate-100">
                      <div
                        contentEditable={isEditing(authorKey)}
                        suppressContentEditableWarning
                        onDoubleClick={(e) => {
                          if (!onDataChange) return;
                          e.stopPropagation();
                          setInlineEditField(authorKey);
                        }}
                        onBlur={(e) => {
                          if (isEditing(authorKey)) commitInlineEdit(authorKey, e.currentTarget);
                        }}
                        className={`text-xs font-bold text-slate-900 ${
                          isEditing(authorKey)
                            ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                            : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                        }`}
                        title={onDataChange ? 'Double-click to edit author' : undefined}
                      >
                        {item.author}
                      </div>
                      <div
                        contentEditable={isEditing(roleKey)}
                        suppressContentEditableWarning
                        onDoubleClick={(e) => {
                          if (!onDataChange) return;
                          e.stopPropagation();
                          setInlineEditField(roleKey);
                        }}
                        onBlur={(e) => {
                          if (isEditing(roleKey)) commitInlineEdit(roleKey, e.currentTarget);
                        }}
                        className={`text-xs text-slate-500 ${
                          isEditing(roleKey)
                            ? 'outline-2 outline-dashed outline-[#e2285c] rounded bg-rose-50/60'
                            : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                        }`}
                        title={onDataChange ? 'Double-click to edit role/location' : undefined}
                      >
                        {item.role}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    case 'FAQ_ACCORDION': {
      const items = Array.isArray(data.items) ? data.items : [];
      return (
        <section className={layout.sectionClass} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            <FaqAccordionSection
              data={data}
              items={items}
              isInteractive={isInteractive}
              isMobile={isMobile}
              headingFontClass={layout.headingFontClass}
            />
          </div>
        </section>
      );
    }

    case 'CTA_BANNER': {
      const isCustomBg = data.bg_type && data.bg_type !== 'default';
      // Clean, elegant luxury light gradient by default:
      const defaultBg = !isCustomBg
        ? 'bg-gradient-to-r from-rose-50 via-pink-50/60 to-amber-50 border border-rose-200/60 text-slate-900 shadow-sm'
        : '';

      return (
        <section className={`${layout.sectionClass} ${defaultBg} relative rounded-2xl mx-4 my-6`} style={layout.style}>
          {bgImageLayer}
          {!layout.hasBgImage && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none rounded-2xl" />
          )}
          <div className={`${layout.innerClass} text-center space-y-4 sm:space-y-6 relative z-10`}>
            <h2
              contentEditable={isEditing('title')}
              suppressContentEditableWarning
              onDoubleClick={(e) => {
                if (!onDataChange) return;
                e.stopPropagation();
                setInlineEditField('title');
              }}
              onBlur={(e) => {
                if (isEditing('title')) commitInlineEdit('title', e.currentTarget);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitInlineEdit('title', e.currentTarget as HTMLElement);
                  (e.currentTarget as HTMLElement).blur();
                }
              }}
              className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-4xl'} font-bold tracking-tight text-slate-900 ${
                isEditing('title')
                  ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-white/70'
                  : onDataChange ? 'cursor-text hover:outline-2 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
              }`}
              title={onDataChange ? 'Double-click to edit banner title' : undefined}
            >
              {data.title || 'Experience Bespoke Modesty'}
            </h2>
            {(data.subtitle || isEditing('subtitle')) && (
              <p
                contentEditable={isEditing('subtitle')}
                suppressContentEditableWarning
                onDoubleClick={(e) => {
                  if (!onDataChange) return;
                  e.stopPropagation();
                  setInlineEditField('subtitle');
                }}
                onBlur={(e) => {
                  if (isEditing('subtitle')) commitInlineEdit('subtitle', e.currentTarget);
                }}
                className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} text-slate-700 max-w-2xl mx-auto font-light leading-relaxed ${
                  isEditing('subtitle')
                    ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-2 rounded cursor-text bg-white/70'
                    : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                }`}
                title={onDataChange ? 'Double-click to edit subtitle' : undefined}
              >
                {data.subtitle}
              </p>
            )}
            {data.button_text && (
              <div className="pt-2">
                <Link
                  href={data.button_link || '/catalog'}
                  className={`${isMobile ? 'w-full justify-center text-center' : ''} px-7 py-3 rounded-md btn-luxury text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 shadow-md`}
                >
                  <span
                    contentEditable={isEditing('button_text')}
                    suppressContentEditableWarning
                    onDoubleClick={(e) => {
                      if (!onDataChange) return;
                      e.preventDefault();
                      e.stopPropagation();
                      setInlineEditField('button_text');
                    }}
                    onBlur={(e) => {
                      if (isEditing('button_text')) commitInlineEdit('button_text', e.currentTarget);
                    }}
                    className={isEditing('button_text') ? 'outline-none border-b border-white' : ''}
                  >
                    {data.button_text}
                  </span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'RICH_TEXT': {
      const html = data.html_content || data.content || '<p>Start writing your content...</p>';
      const titleEditing = isEditing('title');
      const contentEditing = isEditing('html_content');

      return (
        <section className={layout.sectionClass} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            {(data.title || titleEditing) && (
              <h2
                contentEditable={titleEditing}
                suppressContentEditableWarning
                onDoubleClick={(e) => {
                  if (!onDataChange) return;
                  e.stopPropagation();
                  setInlineEditField('title');
                }}
                onBlur={(e) => {
                  if (titleEditing) commitInlineEdit('title', e.currentTarget);
                }}
                className={`${layout.headingFontClass} ${isMobile ? 'text-xl mb-4' : 'text-2xl sm:text-3xl mb-6'} font-bold ${
                  titleEditing
                    ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text'
                    : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
                }`}
                title={onDataChange ? 'Double-click to edit title' : undefined}
              >
                {data.title}
              </h2>
            )}
            <div
              contentEditable={contentEditing}
              suppressContentEditableWarning
              onDoubleClick={(e) => {
                if (!onDataChange) return;
                e.stopPropagation();
                setInlineEditField('html_content');
              }}
              onBlur={(e) => {
                if (contentEditing && onDataChange) {
                  const newHtml = e.currentTarget.innerHTML;
                  if (newHtml !== html) {
                    onDataChange(block.id, { ...data, html_content: newHtml, content: newHtml });
                  }
                  setInlineEditField(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.innerHTML = html;
                  e.currentTarget.blur();
                  setInlineEditField(null);
                }
              }}
              className={`prose prose-neutral max-w-none leading-relaxed ${
                contentEditing
                  ? 'outline-2 outline-dashed outline-[#e2285c] outline-offset-4 rounded cursor-text bg-white/5 p-2'
                  : onDataChange ? 'cursor-text hover:outline-1 hover:outline-dashed hover:outline-[#2271b1] hover:rounded' : ''
              }`}
              title={onDataChange ? 'Double-click to inline edit' : undefined}
              dangerouslySetInnerHTML={contentEditing ? undefined : { __html: html }}
            />
          </div>
        </section>
      );
    }

    case 'SPACER': {
      const height = data.height || 40;
      const responsiveHeight = isMobile ? Math.max(16, Math.round(height * 0.6)) : height;
      return (
        <div
          style={{ height: `${responsiveHeight}px`, ...layout.style }}
          className={`w-full flex items-center justify-center ${layout.sectionClass}`}
        >
          {data.has_divider && <hr className="w-full border-border/40" />}
        </div>
      );
    }

    case 'MAP': {
      const rawMapUrl = data.map_url || data.address || 'Downtown Dubai';
      let embedUrl = 'https://maps.google.com/maps?q=Downtown+Dubai&t=&z=14&ie=UTF8&iwloc=&output=embed';

      if (rawMapUrl.includes('<iframe')) {
        const match = rawMapUrl.match(/src=["']([^"']+)["']/);
        if (match && match[1]) {
          embedUrl = match[1];
        }
      } else if (rawMapUrl.startsWith('http://') || rawMapUrl.startsWith('https://')) {
        if (rawMapUrl.includes('output=embed')) {
          embedUrl = rawMapUrl;
        } else if (rawMapUrl.includes('google.com/maps/embed')) {
          embedUrl = rawMapUrl;
        } else {
          embedUrl = `${rawMapUrl}${rawMapUrl.includes('?') ? '&' : '?'}output=embed`;
        }
      } else {
        embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(rawMapUrl)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
      }

      const mapHeight = data.map_height || 420;
      const responsiveHeight = isMobile ? Math.max(280, Math.round(mapHeight * 0.75)) : mapHeight;
      const isSplit = data.layout === 'split';
      const showCard = data.show_card !== false;

      const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        data.address || 'Downtown Dubai'
      )}`;

      return (
        <section style={layout.style} className={layout.sectionClass}>
          <div className={layout.innerClass}>
            {(data.title || data.subtitle) && (
              <div className={`mb-8 sm:mb-12 ${layout.alignClass}`}>
                {data.title && (
                  <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-bold mb-3`}>
                    {data.title}
                  </h2>
                )}
                {data.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {data.subtitle}
                  </p>
                )}
              </div>
            )}

            <div
              className={`w-full ${
                isSplit && showCard
                  ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch'
                  : 'flex flex-col'
              }`}
            >
              {/* Map Embed Iframe Container */}
              <div
                className={`relative overflow-hidden rounded-2xl border border-border shadow-md bg-card/50 ${
                  isSplit && showCard ? 'lg:col-span-7 xl:col-span-8' : 'w-full'
                }`}
                style={{ minHeight: `${responsiveHeight}px` }}
              >
                <iframe
                  title={data.title || 'Location Map'}
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{
                    border: 0,
                    minHeight: `${responsiveHeight}px`,
                    display: 'block',
                  }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full grayscale-[15%] contrast-[105%] hover:grayscale-0 transition-all duration-300"
                />

                {/* Floating Directions Badge */}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/95 hover:bg-card border border-border text-foreground text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:scale-105"
                >
                  <Navigation size={13} className="text-primary" />
                  <span>Get Directions</span>
                  <ExternalLink size={11} className="text-muted-foreground ml-0.5" />
                </a>
              </div>

              {/* Store & Atelier Info Card */}
              {showCard && (
                <div
                  className={`flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm ${
                    isSplit ? 'lg:col-span-5 xl:col-span-4' : 'mt-6'
                  }`}
                >
                  <div className="space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
                        <MapPin size={12} />
                        <span>Flagship Boutique</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-foreground">
                        {data.title || 'Our Atelier & Showroom'}
                      </h3>
                      {data.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 text-xs">
                      {data.address && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Address</p>
                            <p className="text-muted-foreground leading-relaxed mt-0.5">
                              {data.address}
                            </p>
                          </div>
                        </div>
                      )}

                      {data.hours && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Visiting Hours</p>
                            <p className="text-muted-foreground mt-0.5">{data.hours}</p>
                          </div>
                        </div>
                      )}

                      {data.phone && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Phone size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Telephone Concierge</p>
                            <a
                              href={`tel:${data.phone.replace(/\s+/g, '')}`}
                              className="text-primary hover:underline font-mono mt-0.5 inline-block"
                            >
                              {data.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {data.email && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Mail size={16} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Direct Email</p>
                            <a
                              href={`mailto:${data.email}`}
                              className="text-muted-foreground hover:text-primary transition mt-0.5 inline-block"
                            >
                              {data.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border mt-6">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-sm"
                    >
                      <Navigation size={14} />
                      <span>Open in Google Maps</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
              </div>
            </div>
          </section>
        );
      }

    case 'IMAGE': {
      const widthPercent = data.width_percent || data.width || 100;
      const alignment = data.alignment || (layout.alignClass.includes('center') ? 'center' : layout.alignClass.includes('right') ? 'right' : 'left');
      const alignContainerClass =
        alignment === 'center' ? 'flex justify-center' :
        alignment === 'right' ? 'flex justify-end' :
        'flex justify-start';

      const aspectRatioClass =
        data.aspect_ratio === '21/9'
          ? 'aspect-[21/9]'
          : data.aspect_ratio === '4/3'
          ? 'aspect-[4/3]'
          : data.aspect_ratio === '1/1'
          ? 'aspect-square'
          : data.aspect_ratio === 'auto'
          ? 'h-auto'
          : 'aspect-[16/9]';

      const ImageContent = (
        <div
          className={`group/imgblock relative overflow-hidden ${aspectRatioClass} rounded-2xl bg-slate-100 shadow-sm border border-slate-200/80 transition-all`}
          style={{ width: `${widthPercent}%`, maxWidth: '100%' }}
        >
          {data.image_url ? (
            <>
              <img
                src={data.image_url}
                alt={data.alt_text || data.caption || 'Storefront visual'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover/imgblock:scale-[1.02]"
              />

              {/* Floating Canvas Quick Toolbar on Hover in Editor */}
              {onDataChange && (
                <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/imgblock:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 text-slate-800 border border-slate-200/90 p-1 rounded-lg shadow-xl backdrop-blur-xs select-none">
                  {/* Upload / Replace */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      triggerImageUpload('image_url');
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-[#e2285c] hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Upload / Replace Image from Computer"
                  >
                    <Upload size={12} />
                    <span>Upload</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  {/* Quick Resize presets: 25%, 50%, 75%, 100% */}
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        resizeImage(pct, 'width_percent');
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        widthPercent === pct ? 'bg-[#e2285c] text-white shadow-xs' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                      title={`Resize to ${pct}%`}
                    >
                      {pct}%
                    </button>
                  ))}

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  {/* Alignment buttons */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alignImage('left', 'alignment');
                    }}
                    className={`p-1 rounded transition cursor-pointer ${alignment === 'left' ? 'bg-[#e2285c] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                    title="Align Left"
                  >
                    <AlignLeft size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alignImage('center', 'alignment');
                    }}
                    className={`p-1 rounded transition cursor-pointer ${alignment === 'center' ? 'bg-[#e2285c] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                    title="Align Center"
                  >
                    <AlignCenter size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alignImage('right', 'alignment');
                    }}
                    className={`p-1 rounded transition cursor-pointer ${alignment === 'right' ? 'bg-[#e2285c] text-white' : 'hover:bg-slate-100 text-slate-700'}`}
                    title="Align Right"
                  >
                    <AlignRight size={12} />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  {/* Remove / Delete Image */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeImage('image_url');
                    }}
                    className="p-1 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded transition cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              onClick={() => onDataChange && triggerImageUpload('image_url')}
              className={`w-full min-h-[220px] flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl ${
                onDataChange ? 'cursor-pointer hover:bg-rose-50/50 hover:border-[#e2285c]/60 transition' : ''
              }`}
            >
              <ImageIcon size={36} className="text-primary mb-2 opacity-70" />
              <p className="text-sm font-bold text-slate-800">No Image Uploaded</p>
              {onDataChange && (
                <span className="text-xs text-[#e2285c] font-semibold mt-1.5 flex items-center gap-1.5 underline">
                  <Upload size={14} />
                  Click to Upload Image from Computer
                </span>
              )}
            </div>
          )}

          {/* Optional Overlay Text */}
          {(data.overlay_badge || data.overlay_title) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white pointer-events-none">
              {data.overlay_badge && (
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-primary/90 text-primary-foreground backdrop-blur-md mb-2 self-start shadow-md">
                  {data.overlay_badge}
                </span>
              )}
              {data.overlay_title && (
                <h3 className={`${layout.headingFontClass} text-xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md`}>
                  {data.overlay_title}
                </h3>
              )}
            </div>
          )}
        </div>
      );

      return (
        <section
          style={layout.style}
          className={`${layout.sectionClass} relative`}
        >
          {bgImageLayer}
          <div className={layout.innerClass}>
            <div className={alignContainerClass}>
              {data.link_url && !onDataChange ? (
                <a
                  href={data.link_url}
                  className="block cursor-pointer focus:outline-none w-full"
                  target={data.link_url.startsWith('http') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                >
                  {ImageContent}
                </a>
              ) : (
                ImageContent
              )}
            </div>

            {data.caption && (
              <p className="text-center text-xs text-muted-foreground mt-3 italic">
                {data.caption}
              </p>
            )}
          </div>
        </section>
      );
    }

    case 'CARDS_GRID': {
      const cards = Array.isArray(data.cards) ? data.cards : [];
      const cols = data.columns === 2 ? 'sm:grid-cols-2' : data.columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

      return (
        <section
          style={layout.style}
          className={`${layout.sectionClass} relative`}
        >
          {bgImageLayer}
          <div className={layout.innerClass}>
            {(data.title || data.subtitle) && (
              <div className={`text-center ${isMobile ? 'mb-6' : 'mb-12'} space-y-2`}>
                {data.title && (
                  <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-bold tracking-tight text-foreground`}>
                    {data.title}
                  </h2>
                )}
                {data.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {data.subtitle}
                  </p>
                )}
              </div>
            )}

            <div className={`grid grid-cols-1 ${cols} gap-6`}>
              {cards.map((c: any, idx: number) => (
                <div
                  key={idx}
                  className={`group relative rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1`}
                >
                  {/* Card Image */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted/40">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.title || 'Card Item'}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}

                    {/* Badge */}
                    {c.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/90 text-primary border border-primary/30 backdrop-blur-md shadow-xs">
                        {c.badge}
                      </span>
                    )}

                    {/* Tag / Price */}
                    {c.tag && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
                        {c.tag}
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className={`${layout.headingFontClass} font-bold text-base text-foreground group-hover:text-primary transition`}>
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {c.description}
                        </p>
                      )}
                    </div>

                    {c.button_label && (
                      <div className="pt-2">
                        <a
                          href={c.button_url || '/catalog'}
                          className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>{c.button_label}</span>
                          <ArrowRight size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case 'GALLERY': {
      const images = Array.isArray(data.images) ? data.images : [];
      const cols = data.columns === 2 ? 'sm:grid-cols-2' : data.columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';

      return (
        <section
          style={layout.style}
          className={`${layout.sectionClass} relative`}
        >
          {bgImageLayer}
          <div className={layout.innerClass}>
            {(data.title || data.subtitle) && (
              <div className={`text-center ${isMobile ? 'mb-6' : 'mb-10'} space-y-2`}>
                {data.title && (
                  <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight text-foreground`}>
                    {data.title}
                  </h2>
                )}
                {data.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {data.subtitle}
                  </p>
                )}
              </div>
            )}

            <div className={`grid grid-cols-1 ${cols} gap-4`}>
              {images.map((img: any, idx: number) => {
                const Item = (
                  <div
                    key={idx}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-muted/40 border border-border shadow-xs"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || 'Gallery photo'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white">
                      {img.caption && (
                        <p className="text-xs font-medium text-white">{img.caption}</p>
                      )}
                      {img.link && (
                        <span className="text-[10px] uppercase font-bold text-primary flex items-center gap-1 mt-1">
                          View Details <ArrowRight size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                );

                if (img.link) {
                  return (
                    <a key={idx} href={img.link} className="block cursor-pointer">
                      {Item}
                    </a>
                  );
                }
                return Item;
              })}
            </div>
          </div>
        </section>
      );
    }

    case 'CONTACT_FORM': {
      return (
        <ContactFormSection
          data={data}
          isInteractive={isInteractive}
          isMobile={isMobile}
          layout={layout}
        />
      );
    }

    default:
      return (
        <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border my-4 rounded">
          Unknown block type: {type}
        </div>
      );
  }
}

function ContactFormSection({
  data,
  isInteractive,
  isMobile,
  layout,
}: {
  data: any;
  isInteractive: boolean;
  isMobile: boolean;
  layout: any;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const branches = data.branches || [
    'Suit No: M-49, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
    'Suit No: M-104, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
    'Suit No: M-16, 2nd Floor, Al Habtoor Building (Abu Hail Centre), Abu Hail, Deira-Dubai, P.O Box-67242',
  ];

  const phones = data.phones || [
    { label: 'Tel', number: '+971 55 642 4758' },
    { label: 'Mob', number: '+971 55 79 17 409' },
    { label: 'Mob', number: '+971 55 467 5285', note: 'Suit No: M-16 Contact Number' },
    { label: 'Mob', number: '+971 50 93 75 919' },
  ];

  const email = data.email || 'contact@sabaalwadi.com';
  const businessHours = data.business_hours || 'Sat-Thu 09:00am-11:00pm (09:00-23:00) Friday 04:00pm-10:00pm (16:00-22:00)';
  const timezone = data.timezone || '(UTC+4:00) Abu Dhabi, Muscat';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInteractive) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    }, 600);
  };

  return (
    <section id={layout.cssId || 'contact-form-section'} className={layout.sectionClass} style={layout.style}>
      <div className={layout.innerClass}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-2 block">
                {data.contact_info_badge || 'Get in Touch'}
              </span>
              <h2 className={`${layout.headingFontClass} text-2xl sm:text-3xl font-bold mb-3 tracking-tight`}>
                {data.contact_info_title || 'Contact Information'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {data.contact_info_subtitle || 'Have a question or need support? We are here to help. Reach out to our Dubai team directly.'}
              </p>
            </div>

            {/* Branches Card */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Building2 size={18} />
                <span>Branches</span>
              </div>
              <div className="space-y-3 text-xs text-muted-foreground divide-y divide-border/40">
                {branches.map((branch: string, idx: number) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-start gap-2.5">
                    <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{branch}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Us & Email Us */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Call Us Card */}
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                  <Phone size={14} />
                  <span>Call Us</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  {phones.map((p: any, idx: number) => (
                    <div key={idx} className="flex flex-col">
                      <a
                        href={`tel:${p.number.replace(/[^\d+]/g, '')}`}
                        className="text-foreground hover:text-primary transition font-medium"
                      >
                        {p.label}: {p.number}
                      </a>
                      {p.note && <span className="text-[10px] text-muted-foreground">({p.note})</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Us Card */}
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                  <Mail size={14} />
                  <span>Email Us</span>
                </div>
                <div className="text-xs">
                  <a
                    href={`mailto:${email}`}
                    className="text-foreground hover:text-primary transition font-medium break-all"
                  >
                    {email}
                  </a>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Replies within 24 business hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <Clock size={14} />
                <span>Business Hours</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                <p className="font-medium text-foreground">{businessHours}</p>
                <p className="text-[11px] text-primary">Time zone: {timezone}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Send us a Message Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-lg space-y-6">
              <div>
                <h3 className={`${layout.headingFontClass} text-xl sm:text-2xl font-bold mb-1 tracking-tight`}>
                  {data.form_title || 'Send us a Message'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {data.form_subtitle || 'We love to hear from you. Fill out the form below to get in touch.'}
                </p>
              </div>

              {submitted ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check size={20} />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-300">Message Sent Successfully!</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Thank you for contacting Saba Al Wadi. Our concierge team will review your message and reply as soon as possible.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-3 px-4 py-1.5 text-xs rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Full Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!isInteractive}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Fatima Al-Mansoor"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Email Address <span className="text-primary">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        disabled={!isInteractive}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. fatima@example.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Phone <span className="text-primary">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      disabled={!isInteractive}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +971 50 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Message <span className="text-primary">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      disabled={!isInteractive}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we assist you with sizing, custom orders, or showroom visits?"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isInteractive}
                    className="w-full sm:w-auto px-8 py-3 rounded-md btn-luxury text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-md cursor-pointer transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send size={13} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqAccordionSection({
  data,
  items,
  isInteractive,
  isMobile,
  headingFontClass,
}: {
  data: any;
  items: any[];
  isInteractive: boolean;
  isMobile: boolean;
  headingFontClass: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    if (!isInteractive) return;
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className={`text-center ${isMobile ? 'mb-6' : 'mb-10'}`}>
        <h2 className={`${headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold mb-2`}>
          {data.title || 'Frequently Asked Questions'}
        </h2>
        {data.subtitle && <p className="text-xs sm:text-sm opacity-80">{data.subtitle}</p>}
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {items.map((item: any, idx: number) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-border/60 rounded-lg overflow-hidden bg-card/40 transition"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className={`w-full ${isMobile ? 'px-4 py-3' : 'px-5 py-4'} flex items-center justify-between text-left text-xs sm:text-sm font-semibold hover:bg-accent/30 transition cursor-pointer`}
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={15}
                  className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className={`${isMobile ? 'px-4 pb-3' : 'px-5 pb-4'} text-xs sm:text-sm opacity-80 leading-relaxed border-t border-border/30 pt-3 bg-background/20`}>
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
