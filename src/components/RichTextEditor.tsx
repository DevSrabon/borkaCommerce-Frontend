'use client';

import React from 'react';
import LexicalEditor, { LexicalEditorProps } from './LexicalEditor';

export type RichTextEditorProps = LexicalEditorProps;

/**
 * Universal RichTextEditor powered by Lexical Editor.
 * Replaces old editors with modern Lexical Editor preserving inline styles and images.
 */
export default function RichTextEditor(props: RichTextEditorProps) {
  return <LexicalEditor {...props} />;
}
