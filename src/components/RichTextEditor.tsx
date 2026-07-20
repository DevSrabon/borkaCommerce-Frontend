'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type ToolbarButton = {
  type: 'button';
  title: string;
  label: React.ReactNode;
  action: () => void;
  active?: () => boolean;
};

type ToolbarSelect = {
  type: 'select';
  title: string;
  options: { label: string; value: string }[];
  action: (val: string) => void;
};

type ToolbarSeparator = { type: 'separator' };

type ToolbarItem = ToolbarButton | ToolbarSelect | ToolbarSeparator;

function ToolbarBtn({
  title,
  label,
  action,
  active,
}: Omit<ToolbarButton, 'type'>) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const check = () => setIsActive(active?.() ?? false);
    document.addEventListener('selectionchange', check);
    return () => document.removeEventListener('selectionchange', check);
  }, [active]);

  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
      className={`h-7 min-w-7 px-1.5 flex items-center justify-center rounded text-xs transition-all duration-150 cursor-pointer select-none ${
        isActive
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'hover:bg-accent text-foreground/80 hover:text-foreground border border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write product description...',
  minHeight = 200,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [focused, setFocused] = useState(false);

  // Sync initial value — don't override while editing
  useEffect(() => {
    const el = editorRef.current;
    if (el && !focused && el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
    }
  }, [value, focused]);

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg ?? undefined);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const isActive = (command: string) => () => {
    try { return document.queryCommandState(command); } catch { return false; }
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    exec('createLink', url);
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const toolbarRows: ToolbarItem[][] = [
    [
      {
        type: 'select',
        title: 'Text style',
        options: [
          { label: 'Paragraph', value: 'p' },
          { label: 'Heading 1', value: 'h1' },
          { label: 'Heading 2', value: 'h2' },
          { label: 'Heading 3', value: 'h3' },
          { label: 'Heading 4', value: 'h4' },
        ],
        action: (val) => exec('formatBlock', val),
      },
      { type: 'separator' },
      {
        type: 'button', title: 'Bold (Ctrl+B)',
        label: <strong>B</strong>,
        action: () => exec('bold'),
        active: isActive('bold'),
      },
      {
        type: 'button', title: 'Italic (Ctrl+I)',
        label: <em>I</em>,
        action: () => exec('italic'),
        active: isActive('italic'),
      },
      {
        type: 'button', title: 'Underline (Ctrl+U)',
        label: <span className="underline">U</span>,
        action: () => exec('underline'),
        active: isActive('underline'),
      },
      {
        type: 'button', title: 'Strikethrough',
        label: <span className="line-through">S</span>,
        action: () => exec('strikeThrough'),
        active: isActive('strikeThrough'),
      },
      { type: 'separator' },
      {
        type: 'button', title: 'Bullet list',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/>
            <line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        ),
        action: () => exec('insertUnorderedList'),
        active: isActive('insertUnorderedList'),
      },
      {
        type: 'button', title: 'Numbered list',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/>
            <line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M4 10h2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6 18H4l2-2a1 1 0 10-1.7-1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        ),
        action: () => exec('insertOrderedList'),
        active: isActive('insertOrderedList'),
      },
      {
        type: 'button', title: 'Blockquote',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
        ),
        action: () => exec('formatBlock', 'blockquote'),
      },
      { type: 'separator' },
      {
        type: 'button', title: 'Align left',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/>
            <line x1="17" y1="18" x2="3" y2="18"/>
          </svg>
        ),
        action: () => exec('justifyLeft'),
        active: isActive('justifyLeft'),
      },
      {
        type: 'button', title: 'Align center',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/>
            <line x1="19" y1="18" x2="5" y2="18"/>
          </svg>
        ),
        action: () => exec('justifyCenter'),
        active: isActive('justifyCenter'),
      },
      {
        type: 'button', title: 'Align right',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/>
            <line x1="21" y1="18" x2="7" y2="18"/>
          </svg>
        ),
        action: () => exec('justifyRight'),
        active: isActive('justifyRight'),
      },
      { type: 'separator' },
      {
        type: 'button', title: 'Insert link',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        ),
        action: () => setShowLinkInput((v) => !v),
      },
      {
        type: 'button', title: 'Remove link',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/>
            <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"/>
            <line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/>
            <line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/>
          </svg>
        ),
        action: () => exec('unlink'),
      },
      { type: 'separator' },
      {
        type: 'button', title: 'Undo (Ctrl+Z)',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/><path d="M3 13c0-4.97 4.03-9 9-9a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9.002 9.002 0 0 1-8.01-4.93"/>
          </svg>
        ),
        action: () => exec('undo'),
      },
      {
        type: 'button', title: 'Redo (Ctrl+Y)',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 10"/>
          </svg>
        ),
        action: () => exec('redo'),
      },
      {
        type: 'button', title: 'Clear formatting',
        label: (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4l-8 16"/>
            <line x1="18" y1="12" x2="22" y2="16"/><line x1="22" y1="12" x2="18" y2="16"/>
          </svg>
        ),
        action: () => exec('removeFormat'),
      },
    ],
  ];

  return (
    <div className={`border rounded-lg overflow-hidden transition-all duration-200 ${
      focused
        ? 'border-primary/50 shadow-sm shadow-primary/10 ring-1 ring-primary/20'
        : 'border-border'
    } bg-background`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 bg-accent/30 px-2 py-1.5 border-b border-border">
        {toolbarRows[0].map((item, i) => {
          if (item.type === 'separator') {
            return <div key={`sep-${i}`} className="w-px h-5 bg-border mx-1 self-center" />;
          }
          if (item.type === 'select') {
            return (
              <select
                key={`sel-${i}`}
                title={item.title}
                onMouseDown={(e) => e.preventDefault()}
                onChange={(e) => { item.action(e.target.value); editorRef.current?.focus(); }}
                className="h-7 text-[11px] font-medium bg-card border border-border rounded px-1.5 text-foreground cursor-pointer focus:outline-none focus:border-primary/50 hover:border-border transition-colors"
              >
                {item.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            );
          }
          return (
            <ToolbarBtn
              key={`btn-${i}`}
              title={item.title}
              label={item.label}
              action={item.action}
              active={item.active}
            />
          );
        })}
      </div>

      {/* Link input panel */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border">
          <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">Link URL:</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertLink(); } }}
            placeholder="https://example.com"
            className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted"
            autoFocus
          />
          <button
            type="button"
            onClick={insertLink}
            className="text-[11px] font-semibold px-3 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
            className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editable Content Area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onChange(e.currentTarget.innerHTML);
          }}
          onInput={(e: React.FormEvent<HTMLDivElement>) => onChange((e.target as HTMLDivElement).innerHTML)}
          className="px-4 py-3 text-sm focus:outline-none text-foreground leading-relaxed prose-editor"
          style={{
            minHeight,
            fontFamily: 'inherit',
          }}
          data-placeholder={placeholder}
        />
        {/* Placeholder when empty */}
        <style>{`
          .prose-editor:empty:before {
            content: attr(data-placeholder);
            color: var(--muted-foreground, #6b7280);
            opacity: 0.5;
            pointer-events: none;
            font-size: 0.875rem;
          }
          .prose-editor h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
          .prose-editor h2 { font-size: 1.3em; font-weight: 700; margin: 0.5em 0; }
          .prose-editor h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0; }
          .prose-editor h4 { font-size: 1em; font-weight: 600; margin: 0.4em 0; }
          .prose-editor ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
          .prose-editor ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
          .prose-editor blockquote {
            border-left: 3px solid var(--primary);
            padding-left: 1em;
            margin: 0.5em 0;
            opacity: 0.8;
            font-style: italic;
          }
          .prose-editor a { color: var(--primary); text-decoration: underline; }
          .prose-editor p { margin: 0.25em 0; }
        `}</style>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-border bg-accent/10 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Rich text · HTML formatting supported
        </span>
        <span className="text-[10px] text-muted-foreground">
          Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline
        </span>
      </div>
    </div>
  );
}
