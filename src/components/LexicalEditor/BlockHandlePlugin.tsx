'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $createParagraphNode,
  $insertNodes,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text';
import {
  Plus,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  Quote,
  Trash2,
  Copy,
  Table,
  Minus,
  Image as ImageIcon,
} from 'lucide-react';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $createTableNodeWithDimensions } from '@lexical/table';

interface BlockHandlePluginProps {
  onOpenMediaModal?: () => void;
}

export function BlockHandlePlugin({ onOpenMediaModal }: BlockHandlePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [targetBlockEl, setTargetBlockEl] = useState<HTMLElement | null>(null);
  const [targetNodeKey, setTargetNodeKey] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showGripMenu, setShowGripMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track mouse movement to locate block element
  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const onMouseMove = (e: MouseEvent) => {
      // Don't reposition if a popup menu is currently open
      if (showPlusMenu || showGripMenu) return;

      const target = e.target as HTMLElement;
      if (!rootEl.contains(target)) {
        // Leaving editor
        if (!containerRef.current?.contains(target)) {
          hideTimeoutRef.current = setTimeout(() => {
            setPosition(null);
            setTargetBlockEl(null);
            setTargetNodeKey(null);
          }, 300);
        }
        return;
      }

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Find top-level block child under rootEl
      let curr: HTMLElement | null = target;
      while (curr && curr.parentElement !== rootEl && curr !== rootEl) {
        curr = curr.parentElement;
      }

      if (curr && curr.parentElement === rootEl) {
        const rootRect = rootEl.getBoundingClientRect();
        const blockRect = curr.getBoundingClientRect();

        editor.read(() => {
          try {
            const nearestNode = $getNearestNodeFromDOMNode(curr!);
            if (nearestNode) {
              const topLevel = nearestNode.getTopLevelElement() || nearestNode;
              setTargetNodeKey(topLevel.getKey());
              setTargetBlockEl(curr);
              setPosition({
                top: blockRect.top - rootRect.top + rootEl.scrollTop,
                left: 4,
              });
            }
          } catch (_) {}
        });
      }
    };

    const onMouseLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (!containerRef.current?.contains(related)) {
        hideTimeoutRef.current = setTimeout(() => {
          if (!showPlusMenu && !showGripMenu) {
            setPosition(null);
          }
        }, 200);
      }
    };

    rootEl.addEventListener('mousemove', onMouseMove);
    rootEl.addEventListener('mouseleave', onMouseLeave);

    return () => {
      rootEl.removeEventListener('mousemove', onMouseMove);
      rootEl.removeEventListener('mouseleave', onMouseLeave);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [editor, showPlusMenu, showGripMenu]);

  // Insert element right below current block
  const insertBelow = useCallback(
    (action: (targetKey: string) => void) => {
      if (!targetNodeKey) return;
      setShowPlusMenu(false);
      setShowGripMenu(false);
      editor.update(() => {
        action(targetNodeKey);
      });
    },
    [editor, targetNodeKey]
  );

  const insertParagraph = () => {
    insertBelow((key) => {
      const node = $getNodeByKey(key);
      if (node) {
        const p = $createParagraphNode();
        node.insertAfter(p);
        p.select();
      }
    });
  };

  const insertHeading = (tag: 'h1' | 'h2' | 'h3') => {
    insertBelow((key) => {
      const node = $getNodeByKey(key);
      if (node) {
        const h = $createHeadingNode(tag);
        node.insertAfter(h);
        h.select();
      }
    });
  };

  const insertQuote = () => {
    insertBelow((key) => {
      const node = $getNodeByKey(key);
      if (node) {
        const q = $createQuoteNode();
        node.insertAfter(q);
        q.select();
      }
    });
  };

  const insertTable = () => {
    insertBelow((key) => {
      const node = $getNodeByKey(key);
      if (node) {
        const table = $createTableNodeWithDimensions(3, 3, true);
        node.insertAfter(table);
      }
    });
  };

  const insertDivider = () => {
    insertBelow((key) => {
      const node = $getNodeByKey(key);
      if (node) {
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
      }
    });
  };

  // Block Grip Actions (Delete, Duplicate)
  const deleteBlock = () => {
    if (!targetNodeKey) return;
    setShowGripMenu(false);
    editor.update(() => {
      const node = $getNodeByKey(targetNodeKey);
      if (node) {
        node.remove();
      }
    });
    setPosition(null);
  };

  const duplicateBlock = () => {
    if (!targetNodeKey) return;
    setShowGripMenu(false);
    editor.update(() => {
      const node = $getNodeByKey(targetNodeKey);
      if (node) {
        // Clone node and insert after
        // @ts-ignore
        if (typeof node.clone === 'function') {
          // @ts-ignore
          const clone = node.constructor.clone(node);
          node.insertAfter(clone);
        }
      }
    });
  };

  if (!position) return null;

  return (
    <div
      ref={containerRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="absolute flex items-center gap-0.5 z-20 select-none text-muted-foreground -translate-x-1 hover:text-foreground"
      onMouseEnter={() => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      }}
      onMouseLeave={() => {
        if (!showPlusMenu && !showGripMenu) {
          hideTimeoutRef.current = setTimeout(() => setPosition(null), 300);
        }
      }}
    >
      {/* 1. Quick Add (+) Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowPlusMenu(!showPlusMenu);
            setShowGripMenu(false);
          }}
          className="w-5 h-5 rounded-xs flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-primary transition cursor-pointer text-xs"
          title="Click to add a block below"
        >
          <Plus size={13} />
        </button>

        {showPlusMenu && (
          <div className="absolute left-0 top-full mt-1 w-44 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95">
            <button
              type="button"
              onClick={insertParagraph}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Pilcrow size={13} className="text-primary" />
              <span>Paragraph</span>
            </button>
            <button
              type="button"
              onClick={() => insertHeading('h1')}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Heading1 size={13} className="text-primary" />
              <span>Heading 1</span>
            </button>
            <button
              type="button"
              onClick={() => insertHeading('h2')}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Heading2 size={13} className="text-primary" />
              <span>Heading 2</span>
            </button>
            <button
              type="button"
              onClick={() => insertHeading('h3')}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Heading3 size={13} className="text-primary" />
              <span>Heading 3</span>
            </button>
            <button
              type="button"
              onClick={insertQuote}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Quote size={13} className="text-primary" />
              <span>Quote</span>
            </button>
            {onOpenMediaModal && (
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  onOpenMediaModal();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
              >
                <ImageIcon size={13} className="text-primary" />
                <span>Image</span>
              </button>
            )}
            <button
              type="button"
              onClick={insertTable}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Table size={13} className="text-primary" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={insertDivider}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Minus size={13} className="text-primary" />
              <span>Divider</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Drag / Block Grip (::) Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowGripMenu(!showGripMenu);
            setShowPlusMenu(false);
          }}
          className="w-5 h-5 rounded-xs flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-grab"
          title="Block options"
        >
          <GripVertical size={13} />
        </button>

        {showGripMenu && (
          <div className="absolute left-0 top-full mt-1 w-36 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in-50 zoom-in-95">
            <button
              type="button"
              onClick={duplicateBlock}
              className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 cursor-pointer"
            >
              <Copy size={13} className="text-primary" />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              onClick={deleteBlock}
              className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete Block</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
