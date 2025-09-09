import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProjectModal } from '@/components/EditProjectModal';
import { TaskNotes } from '@/components/TaskNotes';
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { ProjectWithDetails, Stage, Task } from '@/types';
import { apiRequest } from '@/lib/api';

interface ProjectDetailProps {
  projectId: number;
  onBack: () => void;
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showNewStageForm, setShowNewStageForm] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState<number | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDescription, setNewStageDescription] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showCompactView, setShowCompactView] = useState(false);
  
  // Inline editing states
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [editingProjectDescription, setEditingProjectDescription] = useState(false);
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [tempProjectName, setTempProjectName] = useState('');
  const [tempProjectDescription, setTempProjectDescription] = useState('');
  const [tempStageName, setTempStageName] = useState('');
  const [tempTaskTitle, setTempTaskTitle] = useState('');

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

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    
    try {
      await apiRequest('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: newStageName,
          description: newStageDescription
        })
      });
      
      setNewStageName('');
      setNewStageDescription('');
      setShowNewStageForm(false);
      fetchProject(); // Refresh project data
    } catch (error) {
      console.error('Failed to add stage:', error);
    }
  };

  const handleAddTask = async (stageId: number) => {
    if (!newTaskTitle.trim() || !stageId) return;
    
    try {
      await apiRequest('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_id: stageId,
          title: newTaskTitle,
          description: newTaskDescription,
          priority: 2 // Default to medium priority
        })
      });
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowNewTaskForm(null);
      fetchProject(); // Refresh project data
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  // Inline editing handlers
  const startEditingProjectName = () => {
    setTempProjectName(project?.name || '');
    setEditingProjectName(true);
  };

  const startEditingProjectDescription = () => {
    setTempProjectDescription(project?.description || '');
    setEditingProjectDescription(true);
  };

  const saveProjectName = async () => {
    if (!tempProjectName.trim() || tempProjectName === project?.name) {
      setEditingProjectName(false);
      return;
    }

    try {
      await apiRequest(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempProjectName.trim() })
      });
      
      setEditingProjectName(false);
      fetchProject();
    } catch (error) {
      console.error('Failed to update project name:', error);
    }
  };

  const saveProjectDescription = async () => {
    if (tempProjectDescription === project?.description) {
      setEditingProjectDescription(false);
      return;
    }

    try {
      await apiRequest(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: tempProjectDescription.trim() })
      });
      
      setEditingProjectDescription(false);
      fetchProject();
    } catch (error) {
      console.error('Failed to update project description:', error);
    }
  };

  // Stage inline editing functions
  const startEditingStageName = (stage: Stage) => {
    setEditingStage(stage.id!);
    setTempStageName(stage.name);
  };

  const saveStageName = async () => {
    if (!editingStage || tempStageName === project?.stages?.find(s => s.id === editingStage)?.name) {
      setEditingStage(null);
      return;
    }

    try {
      await apiRequest(`/api/stages/${editingStage}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempStageName.trim() })
      });
      
      setEditingStage(null);
      fetchProject();
    } catch (error) {
      console.error('Failed to update stage name:', error);
    }
  };

  // Task inline editing functions
  const startEditingTaskTitle = (task: Task) => {
    setEditingTask(task.id!);
    setTempTaskTitle(task.title);
  };

  const saveTaskTitle = async () => {
    if (!editingTask) {
      return;
    }

    // Find the current task
    let currentTask: Task | undefined;
    project?.stages?.forEach(stage => {
      const task = stage.tasks?.find(t => t.id === editingTask);
      if (task) currentTask = task;
    });

    if (tempTaskTitle === currentTask?.title) {
      setEditingTask(null);
      return;
    }

    try {
      await apiRequest(`/api/tasks/${editingTask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: tempTaskTitle.trim() })
      });
      
      setEditingTask(null);
      fetchProject();
    } catch (error) {
      console.error('Failed to update task title:', error);
    }
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

  const toggleTaskPin = async (taskId: number, isPinned: boolean) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_pinned: !isPinned }),
      });
      fetchProject(); // Refresh project data
    } catch (error) {
      console.error('Failed to toggle task pin:', error);
    }
  };

  const renderStage = (stage: Stage) => {
    const isExpanded = expandedStages.has(stage.id!) && !showCompactView;
    const completedTasks = stage.tasks?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = stage.tasks?.length || 0;
    const stageProgress = stage.progress || 0;

    return (
      <div key={stage.id} className="border rounded-lg p-4 bg-white shadow-sm">
        <div 
          className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded p-2"
          onClick={() => toggleStage(stage.id!)}
        >
          <div>
            {editingStage === stage.id ? (
              <Input
                value={tempStageName}
                onChange={(e) => setTempStageName(e.target.value)}
                onBlur={saveStageName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveStageName();
                  if (e.key === 'Escape') setEditingStage(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-lg font-semibold border-blue-300 focus:border-blue-500"
                autoFocus
              />
            ) : (
              <h3 
                className="font-semibold text-lg cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditingStageName(stage);
                }}
              >
                {stage.name}
              </h3>
            )}
            {stage.description && (
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            )}
            {totalTasks > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {completedTasks}/{totalTasks} tasks completed ({stageProgress.toFixed(1)}%)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalTasks > 0 && (
              <Progress value={stageProgress} className="w-20 h-2 border border-gray-300" />
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
                  <div key={task.id} className={`p-3 rounded border ${getTaskStatusColor(task.status)} ${task.is_pinned ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        {task.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task.id!, 'completed');
                            }}
                          >
                            ✓
                          </Button>
                        )}
                        {task.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskStatus(task.id!, 'todo');
                            }}
                          >
                            ↺
                          </Button>
                        )}
                      </div>
                      <div className="flex-1 px-3">
                        <div className="flex items-center gap-2">
                          {editingTask === task.id ? (
                            <Input
                              value={tempTaskTitle}
                              onChange={(e) => setTempTaskTitle(e.target.value)}
                              onBlur={saveTaskTitle}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTaskTitle();
                                if (e.key === 'Escape') setEditingTask(null);
                              }}
                              className="font-medium border-green-300 focus:border-green-500"
                              autoFocus
                            />
                          ) : (
                            <h4 
                              className="font-medium cursor-pointer hover:bg-white rounded px-1 transition-colors"
                              onClick={() => startEditingTaskTitle(task)}
                            >
                              {task.title}
                            </h4>
                          )}
                          {task.is_pinned && (
                            <Pin className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                            Priority: {task.priority === 1 ? 'High' : task.priority === 2 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                        
                        {/* Task Notes */}
                        <div className="mt-3">
                          <TaskNotes taskId={task.id!} />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskPin(task.id!, task.is_pinned || false);
                          }}
                          title={task.is_pinned ? 'Unpin task' : 'Pin task'}
                        >
                          {task.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            )}
            
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowNewTaskForm(stage.id!);
              }}
            >
              <Plus className="mr-2 h-3 w-3" />
              Add Task
            </Button>

            {/* Inline New Task Form */}
            {showNewTaskForm === stage.id && (
              <Card className="border-dashed border-2 border-green-300 bg-green-50 animate-fadeIn">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title..."
                        className="border-green-300 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newTaskTitle.trim()) {
                              handleAddTask(stage.id!);
                            }
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Input
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Enter task description (optional)..."
                        className="border-green-300 focus:border-green-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newTaskTitle.trim()) {
                              handleAddTask(stage.id!);
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setShowNewTaskForm(null);
                          setNewTaskTitle('');
                          setNewTaskDescription('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleAddTask(stage.id!)} 
                        disabled={!newTaskTitle.trim()}
                      >
                        Save Task
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

  // Calculate task statistics
  const allTasks = project.stages?.flatMap(stage => stage.tasks || []) || [];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(task => task.status === 'completed').length;

  // Use stage-based progress from backend
  const overallProgress = project.progress || 0;
  const stageProgress = project.stageProgress || [];

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
          <div className="flex items-center gap-4">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: project.color || '#6366f1' }}
            />
            <div>
              {editingProjectName ? (
                <Input
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                  onBlur={saveProjectName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveProjectName();
                    if (e.key === 'Escape') setEditingProjectName(false);
                  }}
                  className="text-3xl font-bold h-auto p-0 border-none shadow-none focus:ring-0"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-3xl font-bold cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors"
                  onClick={startEditingProjectName}
                >
                  {project.name}
                </h1>
              )}
              {editingProjectDescription ? (
                <Input
                  value={tempProjectDescription}
                  onChange={(e) => setTempProjectDescription(e.target.value)}
                  onBlur={saveProjectDescription}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveProjectDescription();
                    if (e.key === 'Escape') setEditingProjectDescription(false);
                  }}
                  className="text-muted-foreground mt-1 h-auto p-0 border-none shadow-none focus:ring-0"
                  placeholder="Click to add description..."
                  autoFocus
                />
              ) : (
                <p 
                  className="text-muted-foreground mt-1 cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors"
                  onClick={startEditingProjectDescription}
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
              onClick={() => setShowEditProjectModal(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{completedTasks}/{totalTasks} tasks</span>
            </div>
            <SegmentedProgressBar stageProgress={stageProgress} className="mb-2" />
            <div className="text-xs text-gray-600 text-center">
              {overallProgress.toFixed(1)}% complete
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Project Stages</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowCompactView(!showCompactView)}
                className="text-xs"
              >
                {showCompactView ? 'Expand All' : 'Compact View'}
              </Button>
              <Button onClick={() => setShowNewStageForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stage
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {project.stages && project.stages.length > 0 ? (
              <>
                {project.stages.map(renderStage)}
                {/* Inline New Stage Form */}
                {showNewStageForm && (
                  <Card className="border-dashed border-2 border-blue-300 bg-blue-50 animate-fadeIn">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Input
                            value={newStageName}
                            onChange={(e) => setNewStageName(e.target.value)}
                            placeholder="Enter stage name..."
                            className="border-blue-300 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (newStageName.trim()) {
                                  handleAddStage();
                                }
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            value={newStageDescription}
                            onChange={(e) => setNewStageDescription(e.target.value)}
                            placeholder="Enter stage description (optional)..."
                            className="border-blue-300 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (newStageName.trim()) {
                                  handleAddStage();
                                }
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowNewStageForm(false);
                              setNewStageName('');
                              setNewStageDescription('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleAddStage} 
                            disabled={!newStageName.trim()}
                          >
                            Save Stage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="text-center p-8">
                    <h3 className="font-semibold mb-2">No stages yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first stage to organize your mod development.</p>
                    <Button onClick={() => setShowNewStageForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Stage
                    </Button>
                  </CardContent>
                </Card>
                {/* Inline New Stage Form for empty state */}
                {showNewStageForm && (
                  <Card className="border-dashed border-2 border-blue-300 bg-blue-50 animate-fadeIn">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Input
                            value={newStageName}
                            onChange={(e) => setNewStageName(e.target.value)}
                            placeholder="Enter stage name..."
                            className="border-blue-300 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (newStageName.trim()) {
                                  handleAddStage();
                                }
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            value={newStageDescription}
                            onChange={(e) => setNewStageDescription(e.target.value)}
                            placeholder="Enter stage description (optional)..."
                            className="border-blue-300 focus:border-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (newStageName.trim()) {
                                  handleAddStage();
                                }
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShowNewStageForm(false);
                              setNewStageName('');
                              setNewStageDescription('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleAddStage} 
                            disabled={!newStageName.trim()}
                          >
                            Save Stage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
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

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        onProjectUpdated={fetchProject}
        project={project}
      />
    </div>
  );
}