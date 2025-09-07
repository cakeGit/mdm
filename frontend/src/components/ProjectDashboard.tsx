import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ProjectDashboardProps {
  projects: Project[];
  onProjectSelect: (projectId: number) => void;
  onNewProject: () => void;
  onRefresh: () => void;
}

export function ProjectDashboard({ projects, onProjectSelect, onNewProject, onRefresh }: ProjectDashboardProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Trigger refresh when component mounts to ensure we have latest data
    onRefresh();
  }, []);

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2 animate-fadeIn">
            🚀 Your Projects
          </h1>
          <p className="text-lg text-muted-foreground animate-fadeIn">
            Manage and track your mod development journey
          </p>
        </div>
        <Button 
          onClick={onNewProject}
          className="button-bubbly bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 text-base font-medium shadow-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="card-bubbly text-center py-16 animate-fadeIn">
          <CardContent>
            <div className="space-y-4">
              <div className="text-6xl animate-bounce">🎯</div>
              <h2 className="text-2xl font-bold text-foreground">Ready to build something amazing?</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Create your first project and start bringing your mod ideas to life! 
                Every great journey begins with a single step. ✨
              </p>
              <Button 
                onClick={onNewProject}
                className="button-bubbly mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 text-lg font-medium shadow-lg animate-gentleBounce"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <Card 
              key={project.id} 
              className="card-bubbly cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn group"
              style={{ 
                animationDelay: `${index * 100}ms`,
                background: `linear-gradient(135deg, ${project.color}15 0%, ${project.color}05 100%)`
              }}
              onClick={() => onProjectSelect(project.id)}
            >
              <CardHeader className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: project.color }}
                    />
                    <CardTitle className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors duration-200">
                      {project.name}
                    </CardTitle>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs text-white ${getStatusBadgeColor(project.status)} group-hover:scale-105 transition-transform duration-200`}>
                    {project.status}
                  </span>
                </div>
                <CardDescription className="text-muted-foreground line-clamp-2">
                  {project.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Progress</span>
                    <span className="text-muted-foreground">{project.completed_tasks || 0}/{project.total_tasks || 0} tasks</span>
                  </div>
                  <Progress 
                    value={project.progress || 0} 
                    className="h-2 group-hover:h-3 transition-all duration-200"
                    style={{
                      backgroundColor: `${project.color}20`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Last updated</span>
                  <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}