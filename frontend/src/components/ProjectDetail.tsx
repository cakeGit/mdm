import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProjectWithDetails, Stage } from '@/types';

interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
      try {
        const response = await apiRequest(`/api/projects/${projectId}`);
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

  const toggleStage = (stageId: number) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600';
      case 2: return 'text-yellow-600';
      case 3: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
      try {
        await apiRequest(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        });
        fetchProject(); // Refresh the project data
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    };

  const renderStage = (stage: Stage) => {
    const isExpanded = expandedStages.has(stage.id!);
    const completedTasks = stage.tasks?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = stage.tasks?.length || 0;

    return (
      <div key={stage.id} className="border rounded-lg p-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleStage(stage.id!)}
        >
          <div>
            <h3 className="font-semibold">{stage.name}</h3>
            {stage.description && (
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            )}
            {totalTasks > 0 && (
              <p className="text-xs text-muted-foreground">
                {completedTasks}/{totalTasks} tasks completed
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalTasks > 0 && (
              <Progress value={(completedTasks / totalTasks) * 100} className="w-20 h-2" />
            )}
            <Button variant="ghost" size="sm">
              {isExpanded ? '−' : '+'}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {stage.tasks && stage.tasks.length > 0 ? (
              <div className="space-y-2">
                {stage.tasks.map((task) => (
                  <div key={task.id} className={`p-3 rounded border ${getTaskStatusColor(task.status)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                            Priority: {task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {task.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateTaskStatus(task.id!, 'completed')}
                          >
                            ✓
                          </Button>
                        )}
                        {task.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateTaskStatus(task.id!, 'todo')}
                          >
                            ↺
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            )}
            
            <Button size="sm" variant="outline" className="w-full">
              <Plus className="mr-2 h-3 w-3" />
              Add Task
            </Button>

            {stage.substages && stage.substages.length > 0 && (
              <div className="pl-4 border-l-2 border-gray-200 space-y-3">
                {stage.substages.map(renderStage)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8">Loading project...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
            {/* Removed minecraft_version display as it should not exist */}
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-sm text-white bg-blue-500`}>
              {project.status}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{project.completed_tasks}/{project.total_tasks} tasks</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Project Stages</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Stage
            </Button>
          </div>

          <div className="space-y-4">
            {project.stages && project.stages.length > 0 ? (
              project.stages.map(renderStage)
            ) : (
              <Card>
                <CardContent className="text-center p-8">
                  <h3 className="font-semibold mb-2">No stages yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first stage to organize your mod development.</p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Stage
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent work sessions</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}