import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, Project } from '@/types';
import { apiRequest } from '@/lib/api';

interface AutoRolloverTasksProps {
  onTaskComplete?: () => void;
}

export function AutoRolloverTasks({ onTaskComplete }: AutoRolloverTasksProps) {
  const [inProgressTasks, setInProgressTasks] = useState<(Task & { project_name: string; project_color: string; stage_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInProgressTasks();
  }, []);

  const fetchInProgressTasks = async () => {
    try {
      // Get all projects with their tasks
      const response = await apiRequest('/api/projects');
      const projects = await response.json();
      
      const allInProgressTasks: any[] = [];
      
      for (const project of projects) {
        const projectResponse = await apiRequest(`/api/projects/${project.id}`);
        const projectData = await projectResponse.json();
        
        projectData.stages?.forEach((stage: any) => {
          stage.tasks?.forEach((task: any) => {
            if (task.status === 'in-progress') {
              allInProgressTasks.push({
                ...task,
                project_name: project.name,
                project_color: project.color,
                stage_name: stage.name
              });
            }
          });
        });
      }
      
      setInProgressTasks(allInProgressTasks);
    } catch (error) {
      console.error('Failed to fetch in-progress tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: number) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      
      await fetchInProgressTasks();
      onTaskComplete?.();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const resetTask = async (taskId: number) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'todo' }),
      });
      
      await fetchInProgressTasks();
    } catch (error) {
      console.error('Failed to reset task:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse bg-gray-200 h-6 w-32 rounded mb-4"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (inProgressTasks.length === 0) {
    return null; // Don't show if no in-progress tasks
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <Clock className="w-5 h-5" />
          In-Progress Tasks
          <span className="text-sm font-normal text-amber-600">({inProgressTasks.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-amber-700 mb-4">
            📝 You have tasks that were started but not completed. Time to finish them up?
          </p>
          
          {inProgressTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 bg-white rounded-lg border border-amber-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: task.project_color }}
                    />
                    <span className="text-xs text-gray-600">
                      {task.project_name} › {task.stage_name}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                  
                  {/* Time since started (if we had that data) */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>In progress - ready to complete?</span>
                  </div>
                </div>
                
                <div className="flex gap-1 ml-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resetTask(task.id!)}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => completeTask(task.id!)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Complete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {inProgressTasks.length > 2 && (
            <div className="text-center pt-2">
              <p className="text-xs text-amber-600">
                🎯 {inProgressTasks.length} tasks waiting for completion - you're almost there!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}