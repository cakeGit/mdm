import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface NewStageFormProps {
  onAddStage: (name: string, description: string, keepOpen?: boolean) => void;
  onCancel: () => void;
}

export function NewStageForm({ onAddStage, onCancel }: NewStageFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Card className="border-dashed border-2 border-blue-300 bg-blue-50 animate-fadeIn">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter stage name..."
              className="border-blue-300 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddStage(name.trim(), description.trim(), e.shiftKey);
                  setName('');
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
              placeholder="Enter stage description (optional)..."
              className="border-blue-300 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddStage(name.trim(), description.trim(), e.shiftKey);
                  setName('');
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
                onAddStage(name.trim(), description.trim(), false);
                setName('');
                setDescription('');
              }} 
              disabled={!name.trim()}
            >
              Save Stage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
