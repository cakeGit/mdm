import { useState, useEffect } from 'react';
import { Plus, Edit, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { EditProjectModal } from '@/components/EditProjectModal';
import { MomentumMeter } from '@/components/MomentumMeter';
import { AutoRolloverTasks } from '@/components/AutoRolloverTasks';
import { ReviveProjectPrompt } from '@/components/ReviveProjectPrompt';
import { ProgressiveCelebrations } from '@/components/ProgressiveCelebrations';

// Utility to darken a hex color by a given percent
function darkenColor(hex: string, percent: number) {
  // Remove # if present
  hex = hex.replace('#', '');
  // Parse r, g, b
  let r = parseInt(hex.substring(0,2), 16);
  let g = parseInt(hex.substring(2,4), 16);
  let b = parseInt(hex.substring(4,6), 16);
  r = Math.floor(r * (1 - percent));
  g = Math.floor(g * (1 - percent));
  b = Math.floor(b * (1 - percent));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
import { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ProjectDashboardProps {
  projects: Project[];
  onProjectSelect: (projectId: number | undefined) => void;
  onNewProject: () => void;
  onRefresh: () => void;
}

export function ProjectDashboard({ projects, onProjectSelect, onNewProject, onRefresh }: ProjectDashboardProps) {
  const [loading] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [celebration, setCelebration] = useState<{
    trigger: 'task' | 'stage' | 'project' | 'streak' | null;
    data?: any;
  }>({ trigger: null });

  // Remove the automatic refresh as it can interfere with navigation
  // useEffect(() => {
  //   // Trigger refresh when component mounts to ensure we have latest data
  //   onRefresh();
  // }, [onRefresh]);

  // Removed status badge logic

  const handleEditProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
  };

  const handleEditComplete = () => {
    setEditingProject(null);
    onRefresh();
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
        <div className="space-y-6">
          {/* Momentum Meter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MomentumMeter />
            <AutoRolloverTasks onTaskComplete={onRefresh} />
            <ReviveProjectPrompt onProjectSelect={onProjectSelect} onRefresh={onRefresh} />
          </div>
          
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const progressPct = typeof project.progress === 'number'
                ? project.progress
                : (project.total_tasks && project.total_tasks > 0)
                  ? ( (project.completed_tasks || 0) / project.total_tasks ) * 100
                  : 0;

              return (
            <Card 
              key={project.id} 
              className="card-bubbly cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fadeIn group"
              style={{ 
                animationDelay: `${index * 100}ms`,
                background: `linear-gradient(135deg, ${project.color}80 0%, ${project.color}40 100%)` // more prominent gradient
              }}
              onClick={() => onProjectSelect(project.id)}
            >
              <CardHeader className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <CardTitle 
                      className="text-xl font-bold group-hover:text-blue-600 transition-colors duration-200"
                      style={{ color: darkenColor(project.color || '#333333', 0.4) }}
                    >
                      {project.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => handleEditProject(e, project)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription 
                  className="line-clamp-2"
                  style={{ color: darkenColor(project.color || '#333333', 0.4) }}
                >
                  {project.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                      <span className="font-medium" style={{ color: darkenColor(project.color || '#333333', 0.4) }}>Progress</span>
                      <span style={{ color: darkenColor(project.color || '#333333', 0.4) }}>{Math.round(progressPct)}%</span>
                    </div>
                  {project.stageProgress && project.stageProgress.length > 0 ? (
                    <SegmentedProgressBar 
                      stageProgress={project.stageProgress} 
                      className="h-3"
                    />
                  ) : (
                    <Progress 
                      value={project.progress || 0} 
                      className="h-2 group-hover:h-3 transition-all duration-200"
                      style={{
                        backgroundColor: `${project.color}20`,
                      }}
                    />
                  )}
                </div>
                
                {/* Suggested Next Task */}
                {project.suggested_task && (
                  <div className="space-y-2 border-t pt-3">
                    <div className="text-xs font-medium" style={{ color: darkenColor(project.color || '#333333', 0.4) }}>Suggested Next Task</div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium line-clamp-1" style={{ color: darkenColor(project.color || '#333333', 0.4) }}>
                        {project.suggested_task.title}
                      </div>
                      <div className="text-xs opacity-80 mt-1" style={{ color: darkenColor(project.color || '#333333', 0.4) }}>
                        Priority: {project.suggested_task.priority === 1 ? 'High' : project.suggested_task.priority === 2 ? 'Medium' : 'Low'}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onProjectSelect(project.id);
                        }}
                        className="text-xs font-medium mt-2 hover:underline"
                        style={{ color: darkenColor(project.color || '#333333', 0.4) }}
                      >
                        🚀 Start Working
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs" style={{ color: darkenColor(project.color || '#333333', 0.4) }}>
                  <span>Last updated</span>
                  <span>{formatDistanceToNow(new Date(project.updated_at || 0), { addSuffix: true })}</span>
                </div>
              </CardContent>
            </Card>
          );
          })}
          </div>
        </div>
      )}

      <EditProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onProjectUpdated={handleEditComplete}
        project={editingProject}
      />
      
      <ProgressiveCelebrations
        trigger={celebration.trigger}
        data={celebration.data}
        onClose={() => setCelebration({ trigger: null })}
      />
    </div>
  );
}