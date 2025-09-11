import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { TaskCard } from './TaskCard';
import { NewTaskForm } from './NewTaskForm';
import { useTaskDragAndDrop } from '@/hooks/useTaskDragAndDrop';
import { Stage, Task } from '@/types';

interface StageCardProps {
  stage: Stage;
  showCompactView: boolean;
  onUpdateStage: (stageId: number, data: Partial<Stage>) => void;
  onAddTask: (stageId: number, title: string, description: string, keepOpen?: boolean) => void;
  onUpdateTask: (taskId: number, data: Partial<Task>) => void;
  onReorderTasks: (stageId: number, taskIds: number[]) => void;
}

export function StageCard({ 
  stage, 
  showCompactView, 
  onUpdateStage, 
  onAddTask, 
  onUpdateTask,
  onReorderTasks
}: StageCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(stage.name);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);

  const completedTasks = stage.tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = stage.tasks?.length || 0;
  const stageProgress = stage.progress || 0;

  const handleReorder = (draggedId: number, dropTargetId: number, position: 'before' | 'after') => {
    if (!stage.tasks) return;

    const draggedIndex = stage.tasks.findIndex(task => task.id === draggedId);
    const dropIndex = stage.tasks.findIndex(task => task.id === dropTargetId);

    if (draggedIndex === -1 || dropIndex === -1) return;

    const newTasks = [...stage.tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    
    let insertIndex = dropIndex;
    if (position === 'after') {
      insertIndex = dropIndex + 1;
    }
    if (draggedIndex < dropIndex && position === 'before') {
      insertIndex = dropIndex - 1;
    }

    newTasks.splice(insertIndex, 0, draggedTask);
    const taskIds = newTasks.map(task => task.id!);
    onReorderTasks(stage.id!, taskIds);
  };

  const {
    draggedTaskId,
    dragOverTaskId,
    taskInsertPosition,
    handleTaskDragStart,
    handleTaskDragOver,
    handleTaskDragLeave,
    handleTaskDrop,
    handleTaskDragEnd,
  } = useTaskDragAndDrop(handleReorder);

  const saveName = () => {
    if (tempName.trim() && tempName !== stage.name) {
      onUpdateStage(stage.id!, { name: tempName.trim() });
    }
    setEditingName(false);
  };

  // keepOpen indicates whether the form should stay open after submit (Shift+Enter)
  const handleAddTask = (title: string, description: string, keepOpen?: boolean) => {
    onAddTask(stage.id!, title, description);
    if (!keepOpen) setShowNewTaskForm(false);
  };

  const toggleExpanded = () => {
    if (!showCompactView) {
      setIsExpanded(!isExpanded);
    }
  };

  const isCurrentlyExpanded = !showCompactView && isExpanded;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div 
        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded p-2"
        onClick={toggleExpanded}
      >
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
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onSelectStart={(e) => e.stopPropagation()}
              className="text-lg font-semibold border-blue-300 focus:border-blue-500"
              autoFocus
            />
          ) : (
            <h3 
              className="font-semibold text-lg cursor-pointer hover:bg-gray-100 rounded px-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setTempName(stage.name);
                setEditingName(true);
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
            {isCurrentlyExpanded ? '−' : '+'}
          </Button>
        </div>
      </div>

      {isCurrentlyExpanded && (
        <div className="mt-4 space-y-3">
          {stage.tasks && stage.tasks.length > 0 ? (
            <div className="space-y-2">
              {stage.tasks.map((task) => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  draggedTaskId={draggedTaskId}
                  dragOverTaskId={dragOverTaskId}
                  taskInsertPosition={taskInsertPosition}
                  onDragStart={handleTaskDragStart}
                  onDragOver={handleTaskDragOver}
                  onDragLeave={handleTaskDragLeave}
                  onDrop={handleTaskDrop}
                  onDragEnd={handleTaskDragEnd}
                  onUpdateTask={onUpdateTask}
                />
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
              setShowNewTaskForm(true);
            }}
          >
            <Plus className="mr-2 h-3 w-3" />
            Add Task
          </Button>

          {showNewTaskForm && (
            <NewTaskForm 
              onAddTask={handleAddTask}
              onCancel={() => setShowNewTaskForm(false)}
            />
          )}

          {stage.substages && stage.substages.length > 0 && (
            <div className="pl-4 border-l-2 border-gray-200 space-y-3">
              {/* Recursive rendering for substages can be complex. 
                  For this refactor, we'll assume a flat structure for now.
                  A more advanced implementation might need a dedicated SubStageList component.
              */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
