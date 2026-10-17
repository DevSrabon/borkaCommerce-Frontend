import { EditorThemeClasses } from 'lexical';

export const theme: EditorThemeClasses = {
  ltr: 'ltr text-left',
  rtl: 'rtl text-right',
  placeholder: 'editor-placeholder absolute top-3 left-4 text-muted-foreground pointer-events-none select-none text-sm',
  paragraph: 'editor-paragraph mb-3 leading-relaxed text-foreground text-sm',
  quote: 'editor-quote border-l-4 border-primary/60 pl-4 py-1.5 my-3 italic text-muted-foreground bg-muted/20 rounded-r text-sm',
  heading: {
    h1: 'editor-h1 text-2xl font-bold tracking-tight mb-3 text-foreground',
    h2: 'editor-h2 text-xl font-semibold tracking-tight mb-2.5 text-foreground',
    h3: 'editor-h3 text-lg font-semibold tracking-tight mb-2 text-foreground',
    h4: 'editor-h4 text-base font-semibold mb-1.5 text-foreground',
    h5: 'editor-h5 text-sm font-semibold mb-1 text-foreground',
    h6: 'editor-h6 text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem ml-4',
    },
    ol: 'editor-list-ol list-decimal list-inside my-2 space-y-1 text-sm text-foreground',
    ul: 'editor-list-ul list-disc list-inside my-2 space-y-1 text-sm text-foreground',
    listitem: 'editor-listitem leading-relaxed',
    listitemChecked: 'editor-listitem-checked line-through text-muted-foreground',
    listitemUnchecked: 'editor-listitem-unchecked',
  },
  image: 'editor-image block w-full relative my-2',
  link: 'editor-link text-primary underline hover:text-primary/80 transition-colors cursor-pointer',
  text: {
    bold: 'editor-text-bold font-bold',
    italic: 'editor-text-italic italic',
    underline: 'editor-text-underline underline',
    strikethrough: 'editor-text-strikethrough line-through',
    underlineStrikethrough: 'editor-text-underlineStrikethrough underline line-through',
    code: 'editor-text-code font-mono bg-muted/80 text-primary px-1.5 py-0.5 rounded text-xs font-medium border border-border/60',
  },
  code: 'editor-code font-mono bg-muted/50 text-foreground p-3 rounded-lg my-3 block text-xs border border-border overflow-x-auto whitespace-pre',
  codeHighlight: {},
  table: 'editor-table border-collapse border border-border w-full my-3 text-sm shadow-2xs rounded overflow-hidden',
  tableCell: 'editor-table-cell border border-border/80 p-2 min-w-[70px] align-top',
  tableCellHeader: 'editor-table-cell-header bg-muted/50 font-semibold text-foreground text-left',
  hr: 'editor-hr my-4 border-t border-border/80',
};
