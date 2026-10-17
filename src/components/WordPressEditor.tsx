'use client';

import React from 'react';
import LexicalEditor, { LexicalEditorProps } from './LexicalEditor';

export type WordPressEditorProps = LexicalEditorProps;

/**
 * WordPress Editor compatibility wrapper powered by Lexical Editor.
 * Delivers modern Lexical Editor UI and features while maintaining full prop compatibility.
 */
export default function WordPressEditor(props: WordPressEditorProps) {
  return <LexicalEditor {...props} />;
}
