import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Project } from '@/types';
import { apiRequest } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface ProjectDashboardProps {
  onProjectSelect: (projectId: number) => void;
  onNewProject: () => void;
}

export function ProjectDashboard({ onProjectSelect, onNewProject }: ProjectDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await apiRequest('/api/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'planning': return 'bg-blue-500';
      case 'on-hold': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="p-8">Loading projects...</div>;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Dashboard</h1>
          <p className="text-muted-foreground">Manage your Minecraft modding projects</p>
        </div>
        <Button onClick={onNewProject} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">Create your first Minecraft mod project to get started.</p>
            <Button onClick={onNewProject}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onProjectSelect(project.id!)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusBadgeColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.minecraft_version && (
                    <p className="text-sm text-muted-foreground">
                      Minecraft {project.minecraft_version}
                    </p>
                  )}
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{project.completed_tasks || 0}/{project.total_tasks || 0} tasks</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>

                  {project.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Last updated {formatDistanceToNow(new Date(project.updated_at))} ago
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}