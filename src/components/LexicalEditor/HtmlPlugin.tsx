'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  $getRoot,
  $createParagraphNode,
  $isElementNode,
  $isDecoratorNode,
  $isTextNode,
  ElementNode,
  DecoratorNode,
  ParagraphNode,
} from 'lexical';

interface HtmlPluginProps {
  value: string;
  onChange: (html: string) => void;
}

/**
 * Pre-processes HTML string to preserve all inline styles, images, and fonts
 * before passing to Lexical DOM parser.
 */
function preprocessHtml(html: string): string {
  if (!html || !html.trim()) return '<p><br></p>';

  if (typeof window === 'undefined') return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Convert legacy <font> tags to <span style="...">
    doc.querySelectorAll('font').forEach((font) => {
      const span = doc.createElement('span');
      const color = font.getAttribute('color');
      const face = font.getAttribute('face');
      const size = font.getAttribute('size');
      const existingStyle = font.getAttribute('style') || '';
      let styleStr = existingStyle ? (existingStyle.endsWith(';') ? existingStyle : existingStyle + '; ') : '';

      if (color && !styleStr.includes('color:')) styleStr += `color:${color}; `;
      if (face && !styleStr.includes('font-family:')) styleStr += `font-family:${face}; `;
      if (size && !styleStr.includes('font-size:')) {
        const px = [10, 13, 16, 18, 24, 32, 48][parseInt(size) - 1] || 16;
        styleStr += `font-size:${px}px; `;
      }
      if (styleStr) span.setAttribute('style', styleStr.trim());
      while (font.firstChild) span.appendChild(font.firstChild);
      font.parentNode?.replaceChild(span, font);
    });

    // Remove mso-* specific trash from Word pastes, keeping all real CSS
    doc.querySelectorAll('*').forEach((el) => {
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

        if (cleaned) {
          el.setAttribute('style', cleaned);
        }
      }
    });

    return doc.body.innerHTML || '<p><br></p>';
  } catch (err) {
    console.warn('Error preprocessing HTML:', err);
    return html;
  }
}

export function HtmlPlugin({ value, onChange }: HtmlPluginProps) {
  const [editor] = useLexicalComposerContext();
  const isInternalChangeRef = useRef(false);
  const lastHtmlRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Initialize content on mount or when value changes externally
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const currentVal = value || '';
    if (!isInitializedRef.current || currentVal !== lastHtmlRef.current) {
      lastHtmlRef.current = currentVal;
      isInitializedRef.current = true;

      editor.update(() => {
        const root = $getRoot();
        root.clear();

        if (!currentVal.trim()) {
          root.append($createParagraphNode());
          return;
        }

        try {
          const preprocessed = preprocessHtml(currentVal);
          const parser = new DOMParser();
          const dom = parser.parseFromString(preprocessed, 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);

          const validRootNodes: (ElementNode | DecoratorNode)[] = [];
          let currentParagraph: ParagraphNode | null = null;

          for (const node of nodes) {
            if (($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline()) {
              currentParagraph = null;
              validRootNodes.push(node);
            } else {
              // This is an inline node (TextNode, LineBreakNode, inline ElementNode, etc.)
              // If it's a pure whitespace text node and we don't have an active paragraph, skip formatting whitespace
              if ($isTextNode(node) && currentParagraph === null && !node.getTextContent().trim()) {
                continue;
              }

              if (!currentParagraph) {
                currentParagraph = $createParagraphNode();
                validRootNodes.push(currentParagraph);
              }
              currentParagraph.append(node);
            }
          }

          if (validRootNodes.length === 0) {
            root.append($createParagraphNode());
          } else {
            root.append(...validRootNodes);
          }
        } catch (err) {
          console.error('Error importing HTML into Lexical:', err);
          root.append($createParagraphNode());
        }
      });
    }
  }, [editor, value]);

  // Listen to editor updates and export HTML
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return;
      }

      editor.read(() => {
        try {
          let html = $generateHtmlFromNodes(editor);

          // Standardize empty paragraph
          if (html === '<p></p>' || html === '<p class="editor-paragraph"></p>') {
            html = '<p><br></p>';
          }

          if (html !== lastHtmlRef.current) {
            lastHtmlRef.current = html;
            isInternalChangeRef.current = true;
            onChange(html);
          }
        } catch (err) {
          console.error('Error exporting HTML from Lexical:', err);
        }
      });
    });
  }, [editor, onChange]);

  return null;
}
