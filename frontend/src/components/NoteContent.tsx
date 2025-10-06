import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteContentProps {
  content: string;
}

/**
 * Component to render note content with markdown support.
 * Always preserves newlines and supports GitHub Flavored Markdown.
 */
export function NoteContent({ content }: NoteContentProps) {
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
