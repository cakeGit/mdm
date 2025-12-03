import { useState, useEffect, useCallback } from 'react';
import { StickyNote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';

interface PersonalNoteProps {
  className?: string;
}

export function PersonalNote({ className = '' }: PersonalNoteProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNote();
  }, []);

  const fetchNote = async () => {
    try {
      const response = await apiRequest('/api/personal-note');
      const data = await response.json();
      setContent(data.content || '');
    } catch (error) {
      console.error('Failed to fetch personal note:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = useCallback(async (text: string) => {
    try {
      setIsSaving(true);
      await apiRequest('/api/personal-note', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text }),
      });
    } catch (error) {
      console.error('Failed to save personal note:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout to save after 1 second of no typing
    const timeout = setTimeout(() => {
      saveNote(newContent);
    }, 1000);

    setSaveTimeout(timeout);
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 ${className}`}>
        <CardContent className="p-4">
          <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-amber-700 flex items-center justify-between">
          <span className="flex items-center">
            <StickyNote className="w-4 h-4 mr-2" />
            Personal Note
          </span>
          {isSaving && (
            <span className="text-xs text-amber-600 animate-pulse">Saving...</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-4">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down your thoughts..."
          className="w-full h-24 p-2 text-sm bg-white/50 border border-yellow-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-amber-900 placeholder-amber-400"
        />
      </CardContent>
    </Card>
  );
}
