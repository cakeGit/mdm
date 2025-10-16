import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from '@/components/ui/textarea';

interface NoteContentProps {
  content: string;
  isEditing?: boolean;
  onSave?: (content: string) => void;
  onCancel?: () => void;
}

/**
 * Component to render note content with markdown support.
 * Always preserves newlines and supports GitHub Flavored Markdown.
 * Supports inline editing when isEditing is true.
 */
export function NoteContent({ content, isEditing = false, onSave, onCancel }: NoteContentProps) {
  const [editContent, setEditContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditContent(content);
      // Focus and select the textarea after a small delay to ensure DOM is ready
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, content]);

  const handleSave = () => {
    if (onSave && editContent.trim()) {
      onSave(editContent.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      }
    }
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className="text-sm min-h-[60px] w-full"
        placeholder="Enter note content..."
      />
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="text-sm text-gray-700 prose prose-sm max-w-none"
      components={{
        // Ensure paragraphs preserve whitespace
        p: ({ children }) => (
          <p className="whitespace-pre-wrap mb-2 last:mb-0">{children}</p>
        ),
        // Style for other markdown elements
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="ml-2">{children}</li>
        ),
        code: ({ inline, children }) => 
          inline ? (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>
          ) : (
            <code className="block bg-gray-100 p-2 rounded text-xs mb-2 last:mb-0 whitespace-pre-wrap">{children}</code>
          ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2 last:mb-0">{children}</blockquote>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 last:mb-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2 last:mb-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-2 last:mb-0">{children}</h3>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
