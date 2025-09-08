import { useState, useEffect } from 'react';
import { Eye, EyeOff, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Project, Task, Stage } from '@/types';
import { apiRequest } from '@/lib/api';

interface FocusModeProps {
  projectId: number | null;
  isActive: boolean;
  onToggle: () => void;
  onExit: () => void;
}

export function FocusMode({ projectId, isActive, onToggle, onExit }: FocusModeProps) {
  const [currentTask, setCurrentTask] = useState<Task & { stage_name: string; project_name: string; project_color: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isActive && projectId) {
      fetchCurrentTask();
      fetchProjects();
    }
  }, [isActive, projectId]);

  const fetchProjects = async () => {
    try {
      const response = await apiRequest('/api/projects');
      const projectsData = await response.json();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchCurrentTask = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response = await apiRequest(`/api/projects/${projectId}`);
      const project = await response.json();
      
      // Find the highest priority incomplete task
      let bestTask = null;
      let bestPriority = 4; // Lower number = higher priority
      
      project.stages?.forEach((stage: Stage) => {
        stage.tasks?.forEach((task: Task) => {
          if (task.status !== 'completed' && task.priority < bestPriority) {
            bestTask = {
              ...task,
              stage_name: stage.name,
              project_name: project.name,
              project_color: project.color
            };
            bestPriority = task.priority;
          }
        });
      });
      
      setCurrentTask(bestTask);
    } catch (error) {
      console.error('Failed to fetch current task:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeCurrentTask = async () => {
    if (!currentTask?.id) return;
    
    try {
      await apiRequest(`/api/tasks/${currentTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      
      await fetchCurrentTask(); // Fetch next task
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const markInProgress = async () => {
    if (!currentTask?.id) return;
    
    try {
      await apiRequest(`/api/tasks/${currentTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'in-progress' }),
      });
      
      await fetchCurrentTask();
    } catch (error) {
      console.error('Failed to mark task in progress:', error);
    }
  };

  if (!isActive) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-12 h-12 p-0 shadow-lg"
        title="Enter Focus Mode"
      >
        <Target className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 z-50 overflow-auto">
      {/* Exit Button */}
      <Button
        onClick={onExit}
        variant="ghost"
        className="absolute top-4 right-4 text-white hover:bg-white/10"
      >
        <EyeOff className="w-5 h-5 mr-2" />
        Exit Focus Mode
      </Button>

      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        {/* Focus Mode Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
            <h1 className="text-4xl font-bold text-white">Focus Mode</h1>
            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-xl text-indigo-200">Deep work time - eliminate distractions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {/* Current Task */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Current Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="bg-white/20 h-6 w-3/4 rounded mb-4"></div>
                  <div className="bg-white/20 h-4 w-full rounded"></div>
                </div>
              ) : currentTask ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-indigo-200">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentTask.project_color }}
                    />
                    {currentTask.project_name} › {currentTask.stage_name}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white">{currentTask.title}</h3>
                  
                  {currentTask.description && (
                    <p className="text-indigo-200">{currentTask.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/20 text-white">
                      Priority: {currentTask.priority === 1 ? 'High' : currentTask.priority === 2 ? 'Medium' : 'Low'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      currentTask.status === 'todo' ? 'bg-gray-500/20 text-gray-300' :
                      currentTask.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {currentTask.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    {currentTask.status === 'todo' && (
                      <Button
                        onClick={markInProgress}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Start Working
                      </Button>
                    )}
                    {currentTask.status !== 'completed' && (
                      <Button
                        onClick={completeCurrentTask}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Complete Task
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-white text-lg">All tasks completed!</p>
                  <p className="text-indigo-200">Time for a well-deserved break.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pomodoro Timer */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              {projectId && (
                <PomodoroTimer
                  projects={projects}
                  currentProjectId={projectId}
                  isMinimal={true}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Zen Quote */}
        <div className="mt-12 text-center max-w-2xl">
          <blockquote className="text-xl text-indigo-200 italic">
            "The successful warrior is the average person with laser-like focus."
          </blockquote>
          <cite className="text-indigo-300 text-sm block mt-2">- Bruce Lee</cite>
        </div>

        {/* Breathing Animation */}
        <div className="mt-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-50 animate-ping"></div>
        </div>
      </div>
    </div>
  );
}