'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
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
} from 'lucide-react';
import { PageBlock } from '@/types/page-builder';

const ICON_MAP: Record<string, React.ElementType> = {
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
}

/**
 * Computes custom layout, styling, backgrounds, and responsive visibility
 * for any block based on the custom options configured in BlockSettingsModal.
 */
function getBlockLayoutAndStyle(data: Record<string, any>, isMobile: boolean) {
  // ─── Visibility ──────────────────────────────────────────────────────────
  const hideOnMobile = Boolean(data.hide_on_mobile);
  const hideOnDesktop = Boolean(data.hide_on_desktop);
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
  if (data.alignment === 'center') alignClass = 'text-center';
  else if (data.alignment === 'left') alignClass = 'text-left';
  else if (data.alignment === 'right') alignClass = 'text-right';

  if (isMobile && data.mobile_align === 'center') alignClass = 'text-center';
  if (isMobile && data.mobile_align === 'left') alignClass = 'text-left';

  // ─── Heading Font ────────────────────────────────────────────────────────
  const headingFontClass = data.heading_font === 'sans' ? 'font-sans' : 'font-serif';

  // ─── Custom Styles Object ────────────────────────────────────────────────
  const style: React.CSSProperties = {};

  if (data.bg_type === 'solid' && data.bg_color) {
    style.backgroundColor = data.bg_color;
  } else if (data.bg_type === 'gradient' && data.bg_gradient) {
    style.background = data.bg_gradient;
  }

  if (data.text_color) {
    style.color = data.text_color;
  }

  if (data.border_color) {
    style.borderColor = data.border_color;
  }

  if (data.padding_y_custom) {
    style.paddingTop = `${data.padding_y_custom}px`;
    style.paddingBottom = `${data.padding_y_custom}px`;
  }

  // Parse arbitrary custom inline css (e.g. "letter-spacing: 0.1em; opacity: 0.95")
  if (data.custom_css && typeof data.custom_css === 'string') {
    try {
      const declarations = data.custom_css.split(';').map((s: string) => s.trim()).filter(Boolean);
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
  const sectionClass = `relative overflow-hidden ${paddingYClass} ${marginYClass} ${roundedClass} ${borderClass} ${shadowClass} ${visibilityClass} ${data.custom_classes || ''}`.trim();
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
  };
}

export default function BlockRenderer({
  block,
  isInteractive = true,
  deviceView,
}: BlockRendererProps) {
  const { type, data } = block;

  const isMobile = deviceView === 'mobile';
  const isTablet = deviceView === 'tablet';

  const layout = getBlockLayoutAndStyle(data, isMobile);

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
    case 'HERO': {
      const isCenter = layout.alignClass.includes('text-center') || (!layout.alignClass && data.alignment !== 'left');
      const defaultBg = !data.bg_type || data.bg_type === 'default'
        ? 'bg-gradient-to-b from-card/80 via-background to-background'
        : '';

      return (
        <section className={`${layout.sectionClass} ${defaultBg}`} style={layout.style}>
          {bgImageLayer}
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
            <h1 className={`${layout.headingFontClass} ${isMobile ? 'text-2xl leading-tight' : 'text-3xl sm:text-5xl md:text-6xl'} font-bold tracking-tight leading-[1.15] mb-4 sm:mb-6`}>
              {data.title || 'Welcome to our Atelier'}
            </h1>
            {data.subtitle && (
              <p className={`${isMobile ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'} opacity-85 leading-relaxed max-w-3xl mb-6 sm:mb-8 ${isCenter ? 'mx-auto' : ''}`}>
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
              {/* Image Column */}
              <div className={`relative ${isMobile && reverseOnMobile ? 'order-last' : ''} ${!isMobile && !isImgLeft ? 'lg:col-start-2' : ''}`}>
                <div className={`relative ${isMobile ? 'aspect-[16/10] max-h-[280px]' : 'aspect-[4/3]'} rounded-2xl overflow-hidden border border-border/60 shadow-xl bg-card`}>
                  {data.image_url ? (
                    <img
                      src={data.image_url}
                      alt={data.heading || 'Story Image'}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image uploaded
                    </div>
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
                </div>
              </div>

              {/* Text Column */}
              <div className={`space-y-4 sm:space-y-6 ${isMobile && reverseOnMobile ? 'order-first' : ''} ${!isMobile && !isImgLeft ? 'lg:col-start-1' : ''}`}>
                {data.subheading && (
                  <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-primary block">
                    {data.subheading}
                  </span>
                )}
                <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-4xl'} font-bold tracking-tight leading-snug`}>
                  {data.heading || 'Our Heritage & Design Philosophy'}
                </h2>
                {data.content && (
                  <div className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} opacity-85 leading-relaxed whitespace-pre-line space-y-2.5`}>
                    {data.content}
                  </div>
                )}
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
                      className={`${isMobile ? 'w-full justify-center text-center' : ''} px-5 py-2.5 rounded btn-luxury text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2`}
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
        <section className={`${layout.sectionClass} bg-card/40`} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            {data.title && (
              <h3 className={`${layout.headingFontClass} ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold text-center mb-6 sm:mb-10`}>
                {data.title}
              </h3>
            )}
            <div className={gridClass}>
              {stats.map((st: any, idx: number) => (
                <div key={idx} className={`${isMobile ? 'p-3.5' : 'p-6'} rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:border-primary/40 transition`}>
                  <div className={`font-serif ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl md:text-5xl'} font-extrabold text-primary mb-1 tracking-tight`}>
                    {st.number}
                  </div>
                  <div className="text-[11px] sm:text-xs opacity-75 font-medium uppercase tracking-wider">
                    {st.label}
                  </div>
                </div>
              ))}
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
              <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-4xl'} font-bold tracking-tight mb-2 sm:mb-3`}>
                {data.heading || 'Crafted with Integrity'}
              </h2>
              {data.subtitle && (
                <p className="text-xs sm:text-sm opacity-80">{data.subtitle}</p>
              )}
            </div>
            <div className={gridClass}>
              {items.map((item: any, idx: number) => {
                const IconComponent = ICON_MAP[item.icon] || Sparkles;
                return (
                  <div
                    key={idx}
                    className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-border/60 bg-card/40 hover:bg-card hover:border-primary/40 transition duration-300 space-y-2.5`}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <IconComponent size={18} />
                    </div>
                    <h3 className={`${layout.headingFontClass} text-sm sm:text-base font-bold`}>
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
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
        <section className={`${layout.sectionClass} bg-background/60`} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            <div className={`text-center max-w-xl mx-auto ${isMobile ? 'mb-8' : 'mb-12'}`}>
              <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold mb-2`}>
                {data.title || 'Client Expressions'}
              </h2>
              {data.subtitle && <p className="text-xs sm:text-sm opacity-80">{data.subtitle}</p>}
            </div>
            <div className={gridClass}>
              {items.map((item: any, idx: number) => (
                <div key={idx} className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-border/60 bg-card/60 flex flex-col justify-between space-y-4`}>
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: item.rating || 5 }).map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm opacity-90 italic leading-relaxed">
                    "{item.quote}"
                  </p>
                  <div className="pt-2 border-t border-border/40">
                    <div className="text-xs font-bold">{item.author}</div>
                    <div className="text-[11px] opacity-70">{item.role}</div>
                  </div>
                </div>
              ))}
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
      const defaultBg = !data.bg_type || data.bg_type === 'default'
        ? 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950'
        : '';

      return (
        <section className={`${layout.sectionClass} ${defaultBg}`} style={layout.style}>
          {bgImageLayer}
          {!layout.hasBgImage && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent pointer-events-none" />
          )}
          <div className={`${layout.innerClass} text-center space-y-4 sm:space-y-6`}>
            <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-xl' : 'text-2xl sm:text-4xl'} font-bold`}>
              {data.title || 'Experience Bespoke Modesty'}
            </h2>
            {data.subtitle && (
              <p className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} opacity-85 max-w-2xl mx-auto`}>
                {data.subtitle}
              </p>
            )}
            {data.button_text && (
              <div className="pt-2">
                <Link
                  href={data.button_link || '/catalog'}
                  className={`${isMobile ? 'w-full justify-center text-center' : ''} px-7 py-3 rounded-md btn-luxury text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 shadow-xl`}
                >
                  {data.button_text}
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>
      );
    }

    case 'RICH_TEXT': {
      return (
        <section className={layout.sectionClass} style={layout.style}>
          {bgImageLayer}
          <div className={layout.innerClass}>
            {data.title && (
              <h2 className={`${layout.headingFontClass} ${isMobile ? 'text-xl mb-4' : 'text-2xl sm:text-3xl mb-6'} font-bold`}>
                {data.title}
              </h2>
            )}
            <div
              className={`prose prose-invert ${isMobile ? 'prose-xs' : 'prose-sm sm:prose-base'} max-w-none opacity-90 leading-relaxed`}
              dangerouslySetInnerHTML={{ __html: data.html_content || '<p>Start writing your content...</p>' }}
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
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold mb-3">
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

    default:
      return (
        <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border my-4 rounded">
          Unknown block type: {type}
        </div>
      );
  }
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
