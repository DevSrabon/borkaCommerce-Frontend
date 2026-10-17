'use client';

import React, { Suspense, useRef, useState, useCallback, useEffect } from 'react';
import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $getNodeByKey,
} from 'lexical';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { AlignLeft, AlignCenter, AlignRight, Trash2, Maximize2 } from 'lucide-react';

export type ImageAlignment = 'left' | 'center' | 'right' | 'inline';

export interface ImagePayload {
  altText?: string;
  caption?: string;
  height?: number | 'auto';
  key?: NodeKey;
  maxWidth?: number;
  src: string;
  width?: number | string;
  alignment?: ImageAlignment;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: string;
    height: number | 'auto';
    maxWidth: number;
    src: string;
    width: number | string;
    alignment: ImageAlignment;
  },
  SerializedLexicalNode
>;

function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  alignment,
}: {
  src: string;
  altText: string;
  nodeKey: NodeKey;
  width: number | string;
  height: number | 'auto';
  alignment: ImageAlignment;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const onDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.remove();
        }
      });
    },
    [editor, nodeKey]
  );

  const setAlignment = useCallback(
    (align: ImageAlignment) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ImageNode) {
          node.setAlignment(align);
        }
      });
    },
    [editor, nodeKey]
  );

  const setWidthPreset = useCallback(
    (preset: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ImageNode) {
          node.setWidth(preset);
          node.setHeight('auto');
        }
      });
    },
    [editor, nodeKey]
  );

  // Drag resize handle
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = imageRef.current ? imageRef.current.clientWidth : 300;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(80, startWidth + deltaX);
      if (imageRef.current) {
        imageRef.current.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      const deltaX = upEvent.clientX - startX;
      const finalWidth = Math.max(80, startWidth + deltaX);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ImageNode) {
          node.setWidth(`${finalWidth}px`);
          node.setHeight('auto');
        }
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const flexJustify =
    alignment === 'left' ? 'justify-start text-left' : alignment === 'right' ? 'justify-end text-right' : 'justify-center text-center';

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`w-full flex ${flexJustify} my-3 select-none clear-both`}
      style={{ width: '100%' }}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(true);
      }}
    >
      <div
        className={`relative inline-block rounded-lg transition-all ${
          isSelected
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md'
            : 'hover:ring-1 hover:ring-border'
        }`}
        style={{
          width: widthStyle || '100%',
          maxWidth: '100%',
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={altText || 'Image'}
          style={{
            width: '100%',
            height: heightStyle || 'auto',
            maxWidth: '100%',
            display: 'block',
            borderRadius: '0.5rem',
          }}
          className="block"
          draggable={false}
        />

        {/* Selected Controls Overlay */}
        {isSelected && (
          <div
            className="absolute -top-11 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-2 py-1 flex items-center gap-1 z-30 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Alignment */}
            <button
              type="button"
              onClick={() => setAlignment('left')}
              className={`p-1 rounded hover:bg-muted transition ${
                alignment === 'left' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => setAlignment('center')}
              className={`p-1 rounded hover:bg-muted transition ${
                alignment === 'center' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={() => setAlignment('right')}
              className={`p-1 rounded hover:bg-muted transition ${
                alignment === 'right' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>

            <span className="w-px h-3.5 bg-border mx-1" />

            {/* Width Presets */}
            <button
              type="button"
              onClick={() => setWidthPreset('25%')}
              className="px-1.5 py-0.5 rounded hover:bg-muted text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setWidthPreset('50%')}
              className="px-1.5 py-0.5 rounded hover:bg-muted text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setWidthPreset('75%')}
              className="px-1.5 py-0.5 rounded hover:bg-muted text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setWidthPreset('100%')}
              className="px-1.5 py-0.5 rounded hover:bg-muted text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              100%
            </button>

            <span className="w-px h-3.5 bg-border mx-1" />

            {/* Delete */}
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded hover:bg-destructive/10 text-destructive transition"
              title="Delete Image"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* Interactive Resize Handle on Bottom Right */}
        {isSelected && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-primary border-2 border-background rounded-xs cursor-se-resize shadow-xs hover:scale-110 transition-transform"
            title="Drag to resize"
          />
        )}
      </div>
    </div>
  );
}

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width: number | string;
  __height: number | 'auto';
  __maxWidth: number;
  __alignment: ImageAlignment;
  __caption: string;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__caption,
      node.__alignment,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, maxWidth, src, alignment, caption } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      src,
      width,
      alignment,
      caption,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText || '');

    let style = '';
    const widthVal = typeof this.__width === 'number' ? `${this.__width}px` : this.__width;
    if (widthVal) {
      style += `width: ${widthVal}; max-width: 100%; height: auto; `;
    }

    if (this.__alignment === 'center') {
      style += 'display: block; margin-left: auto; margin-right: auto; clear: both; ';
    } else if (this.__alignment === 'left') {
      style += 'display: block; margin-right: auto; margin-left: 0; clear: both; ';
    } else if (this.__alignment === 'right') {
      style += 'display: block; margin-left: auto; margin-right: 0; clear: both; ';
    }

    if (style) {
      element.setAttribute('style', style.trim());
    }

    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText?: string,
    maxWidth?: number,
    width?: number | string,
    height?: number | 'auto',
    caption?: string,
    alignment?: ImageAlignment,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText || '';
    this.__maxWidth = maxWidth || 1200;
    this.__width = width || '100%';
    this.__height = height || 'auto';
    this.__caption = caption || '';
    this.__alignment = alignment || 'center';
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      caption: this.__caption,
      height: this.__height,
      maxWidth: this.__maxWidth,
      src: this.__src,
      type: 'image',
      version: 1,
      width: this.__width,
      alignment: this.__alignment,
    };
  }

  setWidth(width: number | string): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setHeight(height: number | 'auto'): void {
    const writable = this.getWritable();
    writable.__height = height;
  }

  setAlignment(alignment: ImageAlignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'block';
    span.style.width = '100%';
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          alignment={this.__alignment}
          nodeKey={this.getKey()}
        />
      </Suspense>
    );
  }
}

function convertImageElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const src = domNode.getAttribute('src');
    if (!src) return null;

    const altText = domNode.getAttribute('alt') || '';
    const style = domNode.getAttribute('style') || '';
    const widthAttr = domNode.getAttribute('width');
    const heightAttr = domNode.getAttribute('height');

    let width: string | number = '100%';
    let alignment: ImageAlignment = 'center';

    if (style.includes('float: left') || style.includes('float:left')) {
      alignment = 'left';
    } else if (style.includes('float: right') || style.includes('float:right')) {
      alignment = 'right';
    } else if (style.includes('margin-left: auto') || style.includes('text-align: center')) {
      alignment = 'center';
    }

    const widthMatch = style.match(/width:\s*([^;]+)/i);
    if (widthMatch && widthMatch[1]) {
      width = widthMatch[1].trim();
    } else if (widthAttr) {
      width = isNaN(Number(widthAttr)) ? widthAttr : `${widthAttr}px`;
    }

    const node = $createImageNode({
      src,
      altText,
      width,
      alignment,
    });
    return { node };
  }
  return null;
}

export function $createImageNode({
  altText,
  height,
  maxWidth,
  src,
  width,
  alignment,
  caption,
  key,
}: ImagePayload): ImageNode {
  return new ImageNode(
    src,
    altText,
    maxWidth,
    width,
    height,
    caption,
    alignment,
    key
  );
}

export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}
