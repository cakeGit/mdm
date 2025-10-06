import React from 'react';

interface NoteContentProps {
  content: string;
}

export function NoteContent({ content }: NoteContentProps) {
  return <div data-testid="note-content">{content}</div>;
}
