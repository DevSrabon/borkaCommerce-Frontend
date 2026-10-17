export type BlockType =
  // Elementor Layout
  | 'CONTAINER'
  | 'GRID'
  // Elementor Basic Widgets
  | 'HEADING'
  | 'TEXT_EDITOR'
  | 'IMAGE'
  | 'VIDEO'
  | 'BUTTON'
  | 'DIVIDER'
  | 'SPACER'
  | 'MAP'
  | 'ICON'
  // Elementor General & eCommerce Widgets
  | 'PRODUCTS_GRID'
  | 'HERO'
  | 'TWO_COLUMN'
  | 'RICH_TEXT'
  | 'FEATURES_GRID'
  | 'STATS_COUNTER'
  | 'TESTIMONIALS'
  | 'FAQ_ACCORDION'
  | 'CTA_BANNER'
  | 'CARDS_GRID'
  | 'GALLERY'
  | 'CONTACT_FORM';

export interface ElementorTypography {
  family?: string;
  size?: number; // in px
  weight?: string | number; // '100' .. '900', 'bold', 'normal'
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  style?: 'normal' | 'italic' | 'oblique';
  decoration?: 'none' | 'underline' | 'overline' | 'line-through';
  lineHeight?: number; // e.g. 1.5 or px
  letterSpacing?: number; // in px
  wordSpacing?: number; // in px
}

export interface ElementorBoxModel {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  isLinked?: boolean;
}

export interface ElementorStyleSettings {
  alignment?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  typography?: ElementorTypography;
  borderType?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  boxShadow?: 'none' | 'sm' | 'md' | 'lg' | 'glow';
}

export interface ElementorAdvancedSettings {
  margin?: ElementorBoxModel;
  padding?: ElementorBoxModel;
  zIndex?: number;
  cssId?: string;
  cssClasses?: string;
  animation?: 'none' | 'fadeIn' | 'slideUp' | 'zoomIn' | 'bounce';
  hideOnDesktop?: boolean;
  hideOnTablet?: boolean;
  hideOnMobile?: boolean;
  customCss?: string;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  data: Record<string, any>;
  style?: ElementorStyleSettings;
  advanced?: ElementorAdvancedSettings;
  children?: PageBlock[]; // For Container / Grid nesting
}

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string; // JSON serialized PageBlock[]
  html_cache?: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
