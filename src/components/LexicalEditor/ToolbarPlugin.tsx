'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  ElementFormatType,
} from 'lexical';
import { $setBlocksType, $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text';
import { $createParagraphNode } from 'lexical';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createTableNodeWithDimensions } from '@lexical/table';
import { $insertNodes } from 'lexical';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  ChevronDown,
  Minus,
  Plus,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Image as ImageIcon,
  Minus as HrIcon,
  Check,
  Maximize2,
  Minimize2,
  FileCode2,
} from 'lucide-react';
import { $createImageNode } from './ImageNode';

const FONT_FAMILIES = [
  'Arial',
  'Courier New',
  'Georgia',
  'Impact',
  'Lucida Console',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

const TEXT_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Slate', hex: '#1e293b' },
  { name: 'Slate Gray', hex: '#64748b' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber Orange', hex: '#d97706' },
  { name: 'Royal Gold', hex: '#b89047' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Deep Indigo', hex: '#4338ca' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'White', hex: '#ffffff' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', hex: 'transparent' },
  { name: 'Yellow', hex: '#fef08a' },
  { name: 'Gold', hex: '#fde68a' },
  { name: 'Green', hex: '#bbf7d0' },
  { name: 'Blue', hex: '#bae6fd' },
  { name: 'Pink', hex: '#fbcfe8' },
  { name: 'Purple', hex: '#e9d5ff' },
  { name: 'Gray', hex: '#e2e8f0' },
];

interface ToolbarPluginProps {
  onOpenMediaModal?: () => void;
  isHtmlMode?: boolean;
  onToggleHtmlMode?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function ToolbarPlugin({
  onOpenMediaModal,
  isHtmlMode,
  onToggleHtmlMode,
  isFullscreen,
  onToggleFullscreen,
}: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();

  // Formatting state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState('Normal');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('16');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [alignment, setAlignment] = useState<ElementFormatType>('left');

  // Dropdown menus
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [showInsertDropdown, setShowInsertDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);

  // Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Close open popovers when clicking outside
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowBlockDropdown(false);
        setShowFontDropdown(false);
        setShowColorDropdown(false);
        setShowHighlightDropdown(false);
        setShowCaseDropdown(false);
        setShowInsertDropdown(false);
        setShowAlignDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Inline styles
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Check link
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      setIsLink($isLinkNode(parent) || $isLinkNode(node));

      // Font Family & Size & Colors
      const currentFont = $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial');
      setFontFamily(currentFont.replace(/['"]/g, ''));

      const currentSize = $getSelectionStyleValueForProperty(selection, 'font-size', '16px');
      const sizeNum = parseInt(currentSize, 10);
      setFontSize(isNaN(sizeNum) ? '16' : String(sizeNum));

      const currentColor = $getSelectionStyleValueForProperty(selection, 'color', '#000000');
      setTextColor(currentColor);

      const currentBg = $getSelectionStyleValueForProperty(selection, 'background-color', 'transparent');
      setHighlightColor(currentBg);

      // Block Type
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        const type = element.getType();
        if (type === 'heading') {
          // @ts-ignore
          const tag = element.getTag();
          if (tag === 'h1') setBlockType('Heading 1');
          else if (tag === 'h2') setBlockType('Heading 2');
          else if (tag === 'h3') setBlockType('Heading 3');
          else setBlockType('Heading');
        } else if (type === 'quote') {
          setBlockType('Quote');
        } else if (type === 'list') {
          // @ts-ignore
          const listType = element.getListType();
          setBlockType(listType === 'number' ? 'Numbered List' : 'Bullet List');
        } else if (type === 'code') {
          setBlockType('Code Block');
        } else {
          setBlockType('Normal');
        }

        // Alignment
        const format = element.getFormatType();
        setAlignment(format || 'left');
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  useEffect(() => {
    const unregisterUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    const unregisterRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    return () => {
      unregisterUndo();
      unregisterRedo();
    };
  }, [editor]);

  // Actions
  const applyBlockFormat = (type: string) => {
    setShowBlockDropdown(false);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (type === 'Normal') {
          $setBlocksType(selection, () => $createParagraphNode());
        } else if (type === 'Heading 1') {
          $setBlocksType(selection, () => $createHeadingNode('h1'));
        } else if (type === 'Heading 2') {
          $setBlocksType(selection, () => $createHeadingNode('h2'));
        } else if (type === 'Heading 3') {
          $setBlocksType(selection, () => $createHeadingNode('h3'));
        } else if (type === 'Quote') {
          $setBlocksType(selection, () => $createQuoteNode());
        } else if (type === 'Code Block') {
          $setBlocksType(selection, () => $createCodeNode());
        } else if (type === 'Bullet List') {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else if (type === 'Numbered List') {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
      }
    });
  };

  const applyFontFamily = (family: string) => {
    setFontFamily(family);
    setShowFontDropdown(false);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { 'font-family': family });
      }
    });
  };

  const applyFontSize = (newSize: number) => {
    const clamped = Math.max(8, Math.min(72, newSize));
    setFontSize(String(clamped));
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { 'font-size': `${clamped}px` });
      }
    });
  };

  const applyTextColor = (color: string) => {
    setTextColor(color);
    setShowColorDropdown(false);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color });
      }
    });
  };

  const applyHighlightColor = (hex: string) => {
    setHighlightColor(hex);
    setShowHighlightDropdown(false);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { 'background-color': hex });
      }
    });
  };

  const applyAlignment = (align: ElementFormatType) => {
    setAlignment(align);
    setShowAlignDropdown(false);
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);

    editor.update(() => {
      const selection = $getSelection();
      if ($isNodeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if (node instanceof ImageNode) {
            node.setAlignment(align as any);
          }
        });
      }
    });
  };

  const applyCase = (c: 'uppercase' | 'lowercase' | 'capitalize' | 'clear') => {
    setShowCaseDropdown(false);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (c === 'clear') {
          $patchStyleText(selection, {
            color: '',
            'background-color': '',
            'font-family': '',
            'font-size': '',
          });
        } else {
          // Transform selected text
          const nodes = selection.extract();
          nodes.forEach((n) => {
            if (n.getType() === 'text') {
              // @ts-ignore
              const text = n.getTextContent();
              let transformed = text;
              if (c === 'uppercase') transformed = text.toUpperCase();
              else if (c === 'lowercase') transformed = text.toLowerCase();
              else if (c === 'capitalize') {
                transformed = text.replace(/\b\w/g, (char) => char.toUpperCase());
              }
              // @ts-ignore
              n.setTextContent(transformed);
            }
          });
        }
      }
    });
  };

  const insertLink = () => {
    if (!linkUrl) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/') && !url.startsWith('#') && !url.startsWith('mailto:')) {
      url = `https://${url}`;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const insertTable = () => {
    setShowInsertDropdown(false);
    editor.update(() => {
      const table = $createTableNodeWithDimensions(3, 3, true);
      $insertNodes([table]);
    });
  };

  const insertHorizontalRule = () => {
    setShowInsertDropdown(false);
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
  };

  return (
    <div
      ref={toolbarRef}
      className="bg-card border-b border-border/80 px-2 py-1.5 flex flex-wrap items-center gap-1 text-foreground text-xs select-none sticky top-0 z-30 shadow-2xs backdrop-blur-md"
    >
      {/* 1. Undo / Redo */}
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="p-1.5 rounded hover:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={15} />
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="p-1.5 rounded hover:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={15} />
      </button>

      <div className="w-px h-4 bg-border/80 mx-1" />

      {/* 2. Format Dropdown (≡ Normal ⌵) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowBlockDropdown(!showBlockDropdown);
            setShowFontDropdown(false);
            setShowColorDropdown(false);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-muted font-medium text-foreground transition border border-transparent hover:border-border/60 cursor-pointer min-w-[85px] justify-between"
          title="Format Block"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">≡</span>
            <span className="truncate">{blockType}</span>
          </span>
          <ChevronDown size={11} className="text-muted-foreground shrink-0" />
        </button>

        {showBlockDropdown && (
          <div className="absolute left-0 top-full mt-1 w-44 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95">
            {[
              { label: 'Normal', desc: 'Paragraph' },
              { label: 'Heading 1', desc: 'Large heading' },
              { label: 'Heading 2', desc: 'Medium heading' },
              { label: 'Heading 3', desc: 'Small heading' },
              { label: 'Bullet List', desc: 'Unordered list' },
              { label: 'Numbered List', desc: 'Ordered list' },
              { label: 'Quote', desc: 'Blockquote' },
              { label: 'Code Block', desc: 'Formatted code' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => applyBlockFormat(item.label)}
                className={`w-full text-left px-3 py-1.5 hover:bg-muted flex items-center justify-between transition cursor-pointer ${
                  blockType === item.label ? 'bg-primary/10 text-primary font-medium' : ''
                }`}
              >
                <span>{item.label}</span>
                {blockType === item.label && <Check size={12} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Font Family Dropdown (T Arial ⌵) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowFontDropdown(!showFontDropdown);
            setShowBlockDropdown(false);
            setShowColorDropdown(false);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-muted font-medium text-foreground transition border border-transparent hover:border-border/60 cursor-pointer min-w-[80px] justify-between"
          title="Font Family"
        >
          <span className="flex items-center gap-1.5">
            <span className="font-serif font-bold text-[12px] text-muted-foreground">T</span>
            <span className="truncate max-w-[75px]">{fontFamily}</span>
          </span>
          <ChevronDown size={11} className="text-muted-foreground shrink-0" />
        </button>

        {showFontDropdown && (
          <div className="absolute left-0 top-full mt-1 w-44 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl py-1 z-50 text-xs max-h-60 overflow-y-auto animate-in fade-in-50 zoom-in-95">
            {FONT_FAMILIES.map((fam) => (
              <button
                key={fam}
                type="button"
                style={{ fontFamily: fam }}
                onClick={() => applyFontFamily(fam)}
                className={`w-full text-left px-3 py-1.5 hover:bg-muted flex items-center justify-between transition cursor-pointer ${
                  fontFamily.toLowerCase() === fam.toLowerCase() ? 'bg-primary/10 text-primary font-bold' : ''
                }`}
              >
                <span>{fam}</span>
                {fontFamily.toLowerCase() === fam.toLowerCase() && <Check size={12} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Font Size Control (- 16 +) */}
      <div className="flex items-center border border-border/70 rounded-md overflow-hidden bg-background">
        <button
          type="button"
          onClick={() => applyFontSize(parseInt(fontSize, 10) - 1)}
          className="px-1.5 py-1 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
          title="Decrease font size"
        >
          <Minus size={11} />
        </button>
        <span className="px-1.5 py-0.5 text-xs font-semibold min-w-[24px] text-center select-none">
          {fontSize}
        </span>
        <button
          type="button"
          onClick={() => applyFontSize(parseInt(fontSize, 10) + 1)}
          className="px-1.5 py-1 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
          title="Increase font size"
        >
          <Plus size={11} />
        </button>
      </div>

      <div className="w-px h-4 bg-border/80 mx-1" />

      {/* 5. B, I, U, <>, Link, T̶ */}
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={`p-1.5 rounded hover:bg-muted transition font-bold cursor-pointer ${
          isBold ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:text-foreground'
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={`p-1.5 rounded hover:bg-muted transition italic cursor-pointer ${
          isItalic ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:text-foreground'
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={`p-1.5 rounded hover:bg-muted transition cursor-pointer ${
          isUnderline ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:text-foreground'
        }`}
        title="Underline (Ctrl+U)"
      >
        <Underline size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
        className={`p-1.5 rounded hover:bg-muted transition cursor-pointer ${
          isCode ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:text-foreground'
        }`}
        title="Inline Code"
      >
        <span className="text-[12px] font-mono font-bold leading-none">&lt;&gt;</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
          } else {
            setShowLinkModal(true);
          }
        }}
        className={`p-1.5 rounded hover:bg-muted transition cursor-pointer ${
          isLink ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:text-foreground'
        }`}
        title={isLink ? 'Remove Link' : 'Insert Link (Ctrl+K)'}
      >
        <Link2 size={14} />
      </button>

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        className={`p-1.5 rounded hover:bg-muted transition cursor-pointer ${
          isStrikethrough ? 'bg-primary/15 text-primary' : 'text-foreground/80 hover:text-foreground'
        }`}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </button>

      {/* 6. Text Color (A ⌵ with color bar) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowColorDropdown(!showColorDropdown);
            setShowHighlightDropdown(false);
            setShowFontDropdown(false);
          }}
          className="inline-flex items-center gap-0.5 p-1 rounded hover:bg-muted transition cursor-pointer flex-col"
          title="Text Color"
        >
          <div className="flex items-center gap-0.5">
            <span className="font-bold text-[13px] leading-tight px-0.5">A</span>
            <ChevronDown size={9} className="text-muted-foreground" />
          </div>
          <span
            className="w-4 h-1 rounded-xs block -mt-0.5"
            style={{ backgroundColor: textColor || '#000000' }}
          />
        </button>

        {showColorDropdown && (
          <div className="absolute left-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-xl z-50 w-48 animate-in fade-in-50 zoom-in-95">
            <div className="text-[11px] font-medium text-muted-foreground mb-1.5">Text Color</div>
            <div className="grid grid-cols-7 gap-1">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => applyTextColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className="w-5 h-5 rounded-xs border border-border/80 hover:scale-125 transition-transform cursor-pointer relative"
                  title={c.name}
                >
                  {textColor.toLowerCase() === c.hex.toLowerCase() && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] drop-shadow">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 7. Highlight / Background Color (🖌 ⌵) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowHighlightDropdown(!showHighlightDropdown);
            setShowColorDropdown(false);
            setShowFontDropdown(false);
          }}
          className="inline-flex items-center gap-0.5 p-1 rounded hover:bg-muted transition cursor-pointer"
          title="Background Highlight"
        >
          <Highlighter size={14} className="text-foreground/80" />
          <ChevronDown size={9} className="text-muted-foreground" />
        </button>

        {showHighlightDropdown && (
          <div className="absolute left-0 top-full mt-1 p-2 bg-popover border border-border rounded-lg shadow-xl z-50 w-44 animate-in fade-in-50 zoom-in-95">
            <div className="text-[11px] font-medium text-muted-foreground mb-1.5">Highlight Color</div>
            <div className="grid grid-cols-4 gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => applyHighlightColor(c.hex)}
                  style={{ backgroundColor: c.hex === 'transparent' ? '#ffffff' : c.hex }}
                  className={`h-6 rounded-md border border-border text-[10px] font-medium flex items-center justify-center hover:scale-105 transition cursor-pointer ${
                    c.hex === 'transparent' ? 'text-muted-foreground' : 'text-slate-900'
                  }`}
                  title={c.name}
                >
                  {c.hex === 'transparent' ? 'None' : c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 8. Text Case Transform (Aa ⌵) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowCaseDropdown(!showCaseDropdown);
            setShowColorDropdown(false);
          }}
          className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded hover:bg-muted transition cursor-pointer"
          title="Transform Text Case"
        >
          <span className="font-semibold text-xs text-foreground/80">Aa</span>
          <ChevronDown size={9} className="text-muted-foreground" />
        </button>

        {showCaseDropdown && (
          <div className="absolute left-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95">
            <button
              type="button"
              onClick={() => applyCase('uppercase')}
              className="w-full text-left px-3 py-1.5 hover:bg-muted cursor-pointer"
            >
              UPPERCASE
            </button>
            <button
              type="button"
              onClick={() => applyCase('lowercase')}
              className="w-full text-left px-3 py-1.5 hover:bg-muted cursor-pointer"
            >
              lowercase
            </button>
            <button
              type="button"
              onClick={() => applyCase('capitalize')}
              className="w-full text-left px-3 py-1.5 hover:bg-muted cursor-pointer"
            >
              Capitalize Words
            </button>
            <div className="w-full h-px bg-border my-1" />
            <button
              type="button"
              onClick={() => applyCase('clear')}
              className="w-full text-left px-3 py-1.5 hover:bg-muted text-muted-foreground hover:text-destructive cursor-pointer"
            >
              Clear Formatting
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border/80 mx-1" />

      {/* 9. Insert (+ Insert ⌵) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowInsertDropdown(!showInsertDropdown);
            setShowAlignDropdown(false);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/60 hover:bg-muted font-medium text-foreground transition cursor-pointer border border-border/50"
          title="Insert Element"
        >
          <span className="text-primary font-bold">+</span>
          <span>Insert</span>
          <ChevronDown size={11} className="text-muted-foreground" />
        </button>

        {showInsertDropdown && (
          <div className="absolute left-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95">
            {onOpenMediaModal && (
              <button
                type="button"
                onClick={() => {
                  setShowInsertDropdown(false);
                  onOpenMediaModal();
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 cursor-pointer font-medium"
              >
                <ImageIcon size={14} className="text-primary" />
                <span>Media / Image</span>
              </button>
            )}

            <button
              type="button"
              onClick={insertTable}
              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <TableIcon size={14} className="text-primary" />
              <span>Table (3x3)</span>
            </button>

            <button
              type="button"
              onClick={insertHorizontalRule}
              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <HrIcon size={14} className="text-primary" />
              <span>Horizontal Rule</span>
            </button>
          </div>
        )}
      </div>

      {/* 10. Alignment (≡ Start Align ⌵) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowAlignDropdown(!showAlignDropdown);
            setShowInsertDropdown(false);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-muted font-medium text-foreground transition cursor-pointer"
          title="Text Alignment"
        >
          {alignment === 'center' ? (
            <AlignCenter size={14} />
          ) : alignment === 'right' ? (
            <AlignRight size={14} />
          ) : alignment === 'justify' ? (
            <AlignJustify size={14} />
          ) : (
            <AlignLeft size={14} />
          )}
          <span className="capitalize">{alignment === 'left' ? 'Start' : alignment} Align</span>
          <ChevronDown size={10} className="text-muted-foreground" />
        </button>

        {showAlignDropdown && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95">
            <button
              type="button"
              onClick={() => applyAlignment('left')}
              className={`w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer ${
                alignment === 'left' ? 'text-primary font-bold' : ''
              }`}
            >
              <AlignLeft size={13} />
              <span>Left (Start)</span>
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('center')}
              className={`w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer ${
                alignment === 'center' ? 'text-primary font-bold' : ''
              }`}
            >
              <AlignCenter size={13} />
              <span>Center</span>
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('right')}
              className={`w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer ${
                alignment === 'right' ? 'text-primary font-bold' : ''
              }`}
            >
              <AlignRight size={13} />
              <span>Right</span>
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('justify')}
              className={`w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer ${
                alignment === 'justify' ? 'text-primary font-bold' : ''
              }`}
            >
              <AlignJustify size={13} />
              <span>Justify</span>
            </button>
          </div>
        )}
      </div>

      {/* Right controls: HTML View & Fullscreen */}
      <div className="ml-auto flex items-center gap-1">
        {onToggleHtmlMode && (
          <button
            type="button"
            onClick={onToggleHtmlMode}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              isHtmlMode
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title="Toggle HTML Source"
          >
            <FileCode2 size={13} />
            <span>HTML</span>
          </button>
        )}

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        )}
      </div>

      {/* Link Input Modal */}
      {showLinkModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowLinkModal(false)}
        >
          <div
            className="bg-card text-foreground border border-border rounded-xl shadow-2xl p-4 w-full max-w-md animate-in fade-in-50 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Link2 size={16} className="text-primary" />
              <span>Insert Link</span>
            </h3>
            <input
              type="text"
              placeholder="https://example.com or /page-path"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertLink();
                } else if (e.key === 'Escape') {
                  setShowLinkModal(false);
                }
              }}
              autoFocus
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary mb-3"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition cursor-pointer shadow-xs"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
