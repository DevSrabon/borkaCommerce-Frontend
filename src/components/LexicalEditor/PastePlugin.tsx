'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_CRITICAL,
  PASTE_COMMAND,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
} from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { $createImageNode } from './ImageNode';

export function PastePlugin({
  onUploadImage,
}: {
  onUploadImage?: (file: File) => Promise<string | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // 1. Direct Image Paste (Screenshot or copied image file)
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();

              // If async upload function provided, try it first
              if (onUploadImage) {
                onUploadImage(file).then((url) => {
                  const finalUrl = url || URL.createObjectURL(file);
                  editor.update(() => {
                    const node = $createImageNode({
                      src: finalUrl,
                      altText: file.name || 'Pasted image',
                      width: '75%',
                      alignment: 'center',
                    });
                    $insertNodes([node]);
                  });
                });
              } else {
                // Base64 fallback
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = reader.result as string;
                  if (dataUrl) {
                    editor.update(() => {
                      const node = $createImageNode({
                        src: dataUrl,
                        altText: file.name || 'Pasted image',
                        width: '75%',
                        alignment: 'center',
                      });
                      $insertNodes([node]);
                    });
                  }
                };
                reader.readAsDataURL(file);
              }
              return true;
            }
          }
        }

        // 2. HTML Paste with inline styles and images preserved
        const rawHtml = clipboardData.getData('text/html');
        if (rawHtml) {
          event.preventDefault();

          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawHtml, 'text/html');

            // Convert <font> to spans with inline styles
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

            // Unwrap any XML/Office namespaced tags (e.g. o:p, w:r, v:shape) so children/images are NEVER deleted
            doc.querySelectorAll('*').forEach((el) => {
              if (el.tagName.includes(':')) {
                const parent = el.parentNode;
                if (parent) {
                  while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                  }
                  parent.removeChild(el);
                }
                return;
              }

              // Preserve all valid CSS, strip only mso-* internal properties
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
                } else {
                  el.removeAttribute('style');
                }
              }
            });

            // Ensure images have proper dimensions and responsiveness
            doc.querySelectorAll('img').forEach((img) => {
              if (!img.style.maxWidth) img.style.maxWidth = '100%';
              if (!img.style.height) img.style.height = 'auto';
            });

            editor.update(() => {
              const nodes = $generateNodesFromDOM(editor, doc);
              if (nodes.length > 0) {
                $insertNodes(nodes);
              }
            });

            return true;
          } catch (err) {
            console.error('Error handling pasted HTML in Lexical:', err);
            return false;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, onUploadImage]);

  return null;
}
