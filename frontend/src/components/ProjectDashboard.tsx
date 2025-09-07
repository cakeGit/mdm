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
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            ✨ Project Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">Manage your creative modding projects</p>
        </div>
        <Button 
          onClick={onNewProject} 
          className="button-bubbly bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 text-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="card-bubbly text-center p-12 animate-fadeIn">
          <CardContent className="space-y-6">
            <div className="text-6xl animate-bounce-gentle">🚀</div>
            <h3 className="text-2xl font-bold text-gray-800">Ready to create something amazing?</h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Start your first modding project and bring your creative ideas to life!
            </p>
            <Button 
              onClick={onNewProject}
              className="button-bubbly bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 text-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card 
              key={project.id} 
              className="card-bubbly cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 group animate-fadeIn overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onProjectSelect(project.id!)}
            >
              <CardHeader className="relative">
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full shadow-lg border-2 border-white" 
                      style={{ backgroundColor: project.color || '#6366f1' }}
                      title="Project Color"
                    ></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${getStatusBadgeColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="pr-24">
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription className="text-base mt-2 text-gray-600">
                      {project.description}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-gray-700">Progress</span>
                    <span className="text-gray-600">{project.completed_tasks || 0}/{project.total_tasks || 0} tasks</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={project.progress || 0} 
                      className="h-3 bg-gray-200 rounded-full overflow-hidden"
                    />
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full opacity-20 transition-all duration-300"
                      style={{ 
                        backgroundColor: project.color || '#6366f1',
                        width: `${project.progress || 0}%`
                      }}
                    ></div>
                  </div>
                </div>

                {project.updated_at && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <span className="mr-1">🕒</span>
                    Last updated {formatDistanceToNow(new Date(project.updated_at))} ago
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}