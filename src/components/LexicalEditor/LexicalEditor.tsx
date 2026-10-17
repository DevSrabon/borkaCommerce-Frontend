'use client';

import React, { useState, useRef, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes } from 'lexical';

import { theme } from './theme';
import { EditorNodes } from './nodes';
import { ToolbarPlugin } from './ToolbarPlugin';
import { BlockHandlePlugin } from './BlockHandlePlugin';
import { HtmlPlugin } from './HtmlPlugin';
import { PastePlugin } from './PastePlugin';
import { MediaModal } from './MediaModal';
import { $createImageNode } from './ImageNode';

export interface LexicalEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

/**
 * Helper component inside LexicalComposer to receive media insertion triggers
 */
function EditorInner({
  value,
  onChange,
  placeholder,
  minHeight,
  isFullscreen,
  setIsFullscreen,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  minHeight: number;
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [editor] = useLexicalComposerContext();
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  const handleInsertImage = (data: {
    src: string;
    altText?: string;
    width?: string;
    alignment?: 'left' | 'center' | 'right';
  }) => {
    editor.update(() => {
      const node = $createImageNode({
        src: data.src,
        altText: data.altText || 'Image',
        width: data.width || '100%',
        alignment: data.alignment || 'center',
      });
      $insertNodes([node]);
    });
  };

  return (
    <>
      {/* Top Toolbar matching screenshot */}
      <ToolbarPlugin
        onOpenMediaModal={() => setShowMediaModal(true)}
        isHtmlMode={isHtmlMode}
        onToggleHtmlMode={() => setIsHtmlMode(!isHtmlMode)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* Editor Content Area */}
      <div className="relative flex-1 bg-background flex flex-col overflow-hidden">
        {isHtmlMode ? (
          /* Raw HTML Source Editing Mode */
          <div className="p-4 flex-1 flex flex-col bg-muted/20">
            <div className="text-[11px] font-mono text-muted-foreground mb-2 flex items-center justify-between">
              <span>Raw HTML Source</span>
              <span>Edits will immediately reflect upon switching back</span>
            </div>
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full flex-1 p-3 font-mono text-xs bg-background text-foreground border border-border rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-primary leading-relaxed"
              style={{ minHeight: `${minHeight}px` }}
              spellCheck={false}
            />
          </div>
        ) : (
          /* Visual Lexical Mode */
          <div className="relative flex-1 overflow-y-auto">
            {/* Left Gutter Floating Block Handle (+ and ::) */}
            <BlockHandlePlugin onOpenMediaModal={() => setShowMediaModal(true)} />

            {/* Content Editable Area */}
            <div
              className="px-8 py-5 min-h-[300px]"
              style={{ minHeight: `${minHeight}px` }}
            >
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="outline-hidden leading-relaxed text-foreground text-sm selection:bg-primary/20"
                    style={{ minHeight: `${minHeight - 40}px` }}
                  />
                }
                placeholder={
                  <div className="editor-placeholder absolute top-5 left-8 text-muted-foreground/60 pointer-events-none select-none text-sm italic">
                    {placeholder}
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </div>
        )}
      </div>

      {/* Core Plugins */}
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <TablePlugin />
      <HorizontalRulePlugin />
      <HtmlPlugin value={value} onChange={onChange} />
      <PastePlugin />

      {/* Media Modal */}
      <MediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onInsert={handleInsertImage}
      />
    </>
  );
}

export default function LexicalEditor({
  value,
  onChange,
  placeholder = 'Start writing your content or paste from Word / web...',
  minHeight = 360,
  className = '',
}: LexicalEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initialConfig = {
    namespace: 'BorkaLexicalEditor',
    theme,
    nodes: EditorNodes,
    onError(error: Error) {
      console.error('Lexical Error:', error);
    },
  };

  return (
    <div
      className={`border border-border/80 rounded-xl bg-card text-foreground flex flex-col shadow-xs transition overflow-hidden relative ${
        isFullscreen ? 'fixed inset-0 z-9999 rounded-none h-screen w-screen bg-background' : ''
      } ${className}`}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <EditorInner
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      </LexicalComposer>
    </div>
  );
}
