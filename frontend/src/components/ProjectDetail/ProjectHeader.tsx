import { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectWithDetails } from '@/types';

interface ProjectHeaderProps {
  project: ProjectWithDetails;
  onUpdateProject: (data: Partial<ProjectWithDetails>) => void;
  onEditProject: () => void;
}

export function ProjectHeader({ project, onUpdateProject, onEditProject }: ProjectHeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempName, setTempName] = useState(project.name);
  const [tempDescription, setTempDescription] = useState(project.description || '');

  const saveName = () => {
    if (tempName.trim() && tempName !== project.name) {
      onUpdateProject({ name: tempName.trim() });
    }
    setEditingName(false);
  };

  const saveDescription = () => {
    if (tempDescription !== project.description) {
      onUpdateProject({ description: tempDescription.trim() });
    }
    setEditingDescription(false);
  };

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4">
        <div
          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: project.color || '#6366f1' }}
        />
        <div>
          {editingName ? (
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') setEditingName(false);
              }}
              className="text-3xl font-bold h-auto p-0 border-none shadow-none focus:ring-0"
              autoFocus
            />
          ) : (
            <h1 
              className="text-3xl font-bold cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors"
              onClick={() => {
                setTempName(project.name);
                setEditingName(true);
              }}
            >
              {project.name}
            </h1>
          )}
          {editingDescription ? (
            <Input
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              onBlur={saveDescription}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveDescription();
                if (e.key === 'Escape') setEditingDescription(false);
              }}
              className="text-muted-foreground mt-1 h-auto p-0 border-none shadow-none focus:ring-0"
              placeholder="Click to add description..."
              autoFocus
            />
          ) : (
            <p 
              className="text-muted-foreground mt-1 cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors"
              onClick={() => {
                setTempDescription(project.description || '');
                setEditingDescription(true);
              }}
            >
              {project.description || 'Click to add description...'}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm text-white bg-blue-500`}>
          {project.status}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditProject}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Project
        </Button>
      </div>
    </div>
  );
}
