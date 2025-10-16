import React, { useState } from 'react';

interface NoteContentProps {
  content: string;
  isEditing?: boolean;
  onSave?: (content: string) => void;
  onCancel?: () => void;
}

export function NoteContent({ content, isEditing, onSave, onCancel }: NoteContentProps) {
  const [value, setValue] = useState(content);
  
  if (isEditing) {
    return (
      <textarea
        data-testid="note-content-editor"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => onSave?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onCancel?.();
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave?.(value);
          }
        }}
      />
    );
  }
  return <div data-testid="note-content">{content}</div>;
}
