import { NoteContent } from '@/components/NoteContent';

export function MarkdownDemo() {
  const examples = [
    {
      title: 'Markdown Features',
      content: `# Task Note with Markdown

This note demonstrates **markdown support**:

- Item 1
- Item 2  
- Item 3

You can use *italic text* and **bold text**.

## Code Example
Inline \`code\` works too!

### Links
Check out [this link](https://example.com)`
    },
    {
      title: 'Newline Preservation',
      content: `Line 1
Line 2
Line 3

These newlines
should be
preserved!`
    },
    {
      title: 'Mixed Content',
      content: `**Bold line 1**
Regular line 2
*Italic line 3*

- Bullet 1
- Bullet 2`
    }
  ];

  return (
    <div style={{ padding: '40px', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Task Notes - Markdown Rendering Demo</h1>
      
      {examples.map((example, index) => (
        <div key={index} style={{ 
          background: 'white', 
          padding: '20px', 
          marginBottom: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#555', fontSize: '14px' }}>
            Example {index + 1}: {example.title}
          </div>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '15px' }}>
            <NoteContent content={example.content} />
          </div>
        </div>
      ))}
    </div>
  );
}
