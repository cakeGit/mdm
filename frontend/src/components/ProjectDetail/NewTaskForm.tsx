import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface NewTaskFormProps {
  // third parameter keepOpen: when true, parent should keep the form open after submit
  onAddTask: (title: string, description: string, keepOpen?: boolean) => void;
  onCancel: () => void;
}

export function NewTaskForm({ onAddTask, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');



  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50 animate-fadeIn">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className="border-gray-300 focus:border-gray-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Shift+Enter -> submit but keep form open
                  onAddTask(title.trim(), description.trim(), e.shiftKey);
                  // clear inputs after submit
                  setTitle('');
                  setDescription('');
                }
              }}
              autoFocus
            />
          </div>
          <div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)..."
              className="border-gray-300 focus:border-gray-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddTask(title.trim(), description.trim(), e.shiftKey);
                  setTitle('');
                  setDescription('');
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                onAddTask(title.trim(), description.trim(), false);
                setTitle('');
                setDescription('');
              }} 
              disabled={!title.trim()}
            >
              Save Task
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
