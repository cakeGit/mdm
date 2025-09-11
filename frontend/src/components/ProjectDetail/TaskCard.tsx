import { useState } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskNotes } from '@/components/TaskNotes';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  draggedTaskId: number | null;
  dragOverTaskId: number | null;
  taskInsertPosition: 'before' | 'after' | null;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
  onDragOver: (e: React.DragEvent, taskId: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, taskId: number) => void;
  onDragEnd: () => void;
  onUpdateTask: (taskId: number, data: Partial<Task>) => void;
}

export function TaskCard({
  task,
  draggedTaskId,
  dragOverTaskId,
  taskInsertPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onUpdateTask,
}: TaskCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(task.title);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const saveTitle = () => {
    if (tempTitle.trim() && tempTitle !== task.title) {
      onUpdateTask(task.id!, { title: tempTitle.trim() });
    }
    setEditingTitle(false);
  };

  const toggleStatus = () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    onUpdateTask(task.id!, { status: newStatus });
  };

  const togglePin = () => {
    onUpdateTask(task.id!, { is_pinned: !task.is_pinned });
  };

  return (
    <div className="relative">
      {dragOverTaskId === task.id && taskInsertPosition === 'before' && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
      )}
      
      <div 
        className={`p-3 rounded border ${editingTitle ? 'cursor-text' : 'cursor-move'} transition-all ${getTaskStatusColor(task.status)} ${task.is_pinned ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''} ${
          draggedTaskId === task.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
        } ${dragOverTaskId === task.id ? 'ring-2 ring-blue-300' : ''}`}
        draggable={!editingTitle}
        onDragStart={(e) => !editingTitle && onDragStart(e, task.id!)}
        onDragOver={(e) => !editingTitle && onDragOver(e, task.id!)}
        onDragLeave={!editingTitle ? onDragLeave : undefined}
        onDrop={(e) => !editingTitle && onDrop(e, task.id!)}
        onDragEnd={!editingTitle ? onDragEnd : undefined}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                toggleStatus();
              }}
            >
              {task.status === 'completed' ? '↺' : '✓'}
            </Button>
          </div>
          <div className="flex-1 px-3">
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onSelectStart={(e) => e.stopPropagation()}
                  className="font-medium border-green-300 focus:border-green-500"
                  autoFocus
                />
              ) : (
                <h4 
                  className="font-medium cursor-pointer hover:bg-white rounded px-1 transition-colors"
                  onClick={() => {
                    setTempTitle(task.title);
                    setEditingTitle(true);
                  }}
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
            <TaskNotes taskId={task.id!} collapsible={true} />
          </div>
          <div className="flex flex-col gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                togglePin();
              }}
              title={task.is_pinned ? 'Unpin task' : 'Pin task'}
            >
              {task.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      {dragOverTaskId === task.id && taskInsertPosition === 'after' && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
      )}
    </div>
  );
}
