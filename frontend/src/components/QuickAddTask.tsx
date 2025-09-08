import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project, Stage } from '@/types';
import { apiRequest } from '@/lib/api';

interface QuickAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
}

export function QuickAddTask({ isOpen, onClose, onTaskAdded }: QuickAddTaskProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [priority, setPriority] = useState<string>('2');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProject) {
      fetchStages(parseInt(selectedProject));
    } else {
      setStages([]);
      setSelectedStage('');
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await apiRequest('/api/projects');
      const projectsData = await response.json();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchStages = async (projectId: number) => {
    try {
      const response = await apiRequest(`/api/projects/${projectId}`);
      const projectData = await response.json();
      setStages(projectData.stages || []);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage || !taskTitle.trim()) return;

    setLoading(true);
    try {
      await apiRequest('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage_id: parseInt(selectedStage),
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          priority: parseInt(priority)
        }),
      });

      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setPriority('2');
      setSelectedProject('');
      setSelectedStage('');
      
      onTaskAdded?.();
      onClose();
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTaskTitle('');
    setTaskDescription('');
    setPriority('2');
    setSelectedProject('');
    setSelectedStage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Add Task
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Ctrl+Shift+T</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id!.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Stage</label>
            <Select value={selectedStage} onValueChange={setSelectedStage} disabled={!selectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id!.toString()}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Task Title</label>
            <Input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Input
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Enter task description..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">🔴 High Priority</SelectItem>
                <SelectItem value="2">🟡 Medium Priority</SelectItem>
                <SelectItem value="3">🟢 Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStage || !taskTitle.trim()}>
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}