import { useState } from 'react';

export function useTaskDragAndDrop(onReorder: (draggedId: number, dropTargetId: number, position: 'before' | 'after') => void) {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);
  const [taskInsertPosition, setTaskInsertPosition] = useState<'before' | 'after' | null>(null);

  const handleTaskDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleTaskDragOver = (e: React.DragEvent, taskId: number) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    
    if (!draggedTaskId || draggedTaskId === taskId) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    
    setDragOverTaskId(taskId);
    setTaskInsertPosition(position);
  };

  const handleTaskDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
      setDragOverTaskId(null);
      setTaskInsertPosition(null);
    }
  };

  const handleTaskDrop = (e: React.DragEvent, dropTargetId: number) => {
    e.preventDefault();
    
    if (!draggedTaskId || draggedTaskId === dropTargetId || !taskInsertPosition) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      setTaskInsertPosition(null);
      return;
    }

    onReorder(draggedTaskId, dropTargetId, taskInsertPosition);

    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setTaskInsertPosition(null);
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setTaskInsertPosition(null);
  };

  return {
    draggedTaskId,
    dragOverTaskId,
    taskInsertPosition,
    handleTaskDragStart,
    handleTaskDragOver,
    handleTaskDragLeave,
    handleTaskDrop,
    handleTaskDragEnd,
  };
}
