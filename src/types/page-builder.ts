export type BlockType =
  | 'HERO'
  | 'TWO_COLUMN'
  | 'RICH_TEXT'
  | 'FEATURES_GRID'
  | 'STATS_COUNTER'
  | 'TESTIMONIALS'
  | 'FAQ_ACCORDION'
  | 'CTA_BANNER'
  | 'SPACER';

export interface PageBlock {
  id: string;
  type: BlockType;
  data: Record<string, any>;
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
