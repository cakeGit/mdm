import { useState } from 'react';

export function useStageDragAndDrop(onReorder: (draggedId: number, dropTargetId: number, position: 'before' | 'after') => void) {
  const [draggedStageId, setDraggedStageId] = useState<number | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<number | null>(null);
  const [stageInsertPosition, setStageInsertPosition] = useState<'before' | 'after' | null>(null);

  const handleStageDragStart = (e: React.DragEvent, stageId: number) => {
    setDraggedStageId(stageId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleStageDragOver = (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    
    if (!draggedStageId || draggedStageId === stageId) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    
    setDragOverStageId(stageId);
    setStageInsertPosition(position);
  };

  const handleStageDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
      setDragOverStageId(null);
      setStageInsertPosition(null);
    }
  };

  const handleStageDrop = (e: React.DragEvent, dropTargetId: number) => {
    e.preventDefault();
    
    if (!draggedStageId || draggedStageId === dropTargetId || !stageInsertPosition) {
      setDraggedStageId(null);
      setDragOverStageId(null);
      setStageInsertPosition(null);
      return;
    }

    onReorder(draggedStageId, dropTargetId, stageInsertPosition);

    setDraggedStageId(null);
    setDragOverStageId(null);
    setStageInsertPosition(null);
  };

  const handleStageDragEnd = () => {
    setDraggedStageId(null);
    setDragOverStageId(null);
    setStageInsertPosition(null);
  };

  return {
    draggedStageId,
    dragOverStageId,
    stageInsertPosition,
    handleStageDragStart,
    handleStageDragOver,
    handleStageDragLeave,
    handleStageDrop,
    handleStageDragEnd,
  };
}