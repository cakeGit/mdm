import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, StickyNote, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskNote } from '@/types';
import { apiRequest } from '@/lib/api';
import { UnifiedAddForm, FieldConfig } from '@/components/UnifiedAddForm';

interface TaskNotesProps {
  taskId: number;
  collapsible?: boolean;
  onNotesChange?: (count: number) => void;
}

const noteFields: FieldConfig[] = [
  {
    key: 'content',
    label: 'Note Content',
    placeholder: 'Enter your note...',
    type: 'textarea',
    required: true,
    allowNewlines: true // Allow Shift+Enter for newlines in note content
  }
];

export function TaskNotes({ taskId, collapsible = false, onNotesChange }: TaskNotesProps) {
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<TaskNote | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [draggedNoteId, setDraggedNoteId] = useState<number | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<number | null>(null);
  const [insertPosition, setInsertPosition] = useState<'before' | 'after' | null>(null);
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const modalTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [taskId]);

  // When the add/edit modal opens, focus and select the textarea
  useEffect(() => {
    if (showAddModal || !!editingNote) {
      // small timeout to ensure DOM is rendered
      setTimeout(() => {
        if (modalTextareaRef.current) {
          modalTextareaRef.current.focus();
          modalTextareaRef.current.select();
        }
      }, 0);
    }
  }, [showAddModal, editingNote]);

  const fetchNotes = async () => {
    try {
      const response = await apiRequest(`/api/task-notes/${taskId}`);
      const notesData = await response.json();
      setNotes(notesData);
      onNotesChange?.(notesData.length);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (content?: string) => {
    const noteContent = content || newNoteContent;
    if (!noteContent.trim()) return;

    try {
      const response = await apiRequest('/api/task-notes', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          content: noteContent.trim()
        })
      });

      if (response.ok) {
        setNewNoteContent('');
        setShowAddForm(false);
        setShowAddModal(false);
        await fetchNotes();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleUnifiedFormSubmit = (values: Record<string, string>, keepOpen?: boolean) => {
    handleAddNote(values.content);
    if (!keepOpen) {
      setShowAddForm(false);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !newNoteContent.trim()) return;

    try {
      const response = await apiRequest(`/api/task-notes/${editingNote.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          content: newNoteContent.trim()
        })
      });

      if (response.ok) {
        setEditingNote(null);
        setNewNoteContent('');
        await fetchNotes();
      }
    } catch (error) {
      console.error('Failed to edit note:', error);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await apiRequest(`/api/task-notes/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, noteId: number) => {
    setDraggedNoteId(noteId);
    // Safely set effectAllowed if dataTransfer exists
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, noteId: number) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    
    if (!draggedNoteId || draggedNoteId === noteId) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    
    setDragOverNoteId(noteId);
    setInsertPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
      setDragOverNoteId(null);
      setInsertPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropTargetId: number) => {
    e.preventDefault();
    
    if (!draggedNoteId || draggedNoteId === dropTargetId || !insertPosition) {
      setDraggedNoteId(null);
      setDragOverNoteId(null);
      setInsertPosition(null);
      return;
    }

    const draggedIndex = notes.findIndex(note => note.id === draggedNoteId);
    const dropIndex = notes.findIndex(note => note.id === dropTargetId);

    if (draggedIndex === -1 || dropIndex === -1) {
      setDraggedNoteId(null);
      setDragOverNoteId(null);
      setInsertPosition(null);
      return;
    }

    const newNotes = [...notes];
    const [draggedNote] = newNotes.splice(draggedIndex, 1);
    
    // Calculate the actual insert position
    let insertIndex = dropIndex;
    if (insertPosition === 'after') {
      insertIndex = dropIndex + 1;
    }
    // If dragged note was before the drop target, adjust insert index
    if (draggedIndex < dropIndex && insertPosition === 'before') {
      insertIndex = dropIndex - 1;
    }

    newNotes.splice(insertIndex, 0, draggedNote);

    setNotes(newNotes);
    setDraggedNoteId(null);
    setDragOverNoteId(null);
    setInsertPosition(null);

    // Update the order in the backend
    updateNoteOrder(newNotes);
  };

  const updateNoteOrder = async (orderedNotes: TaskNote[]) => {
    try {
      const noteIds = orderedNotes.map(note => note.id);
      await apiRequest(`/api/task-notes/reorder`, {
        method: 'PUT',
        body: JSON.stringify({
          task_id: taskId,
          note_ids: noteIds
        })
      });
    } catch (error) {
      console.error('Failed to update note order:', error);
      // Revert to original order on error
      await fetchNotes();
    }
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
    setInsertPosition(null);
  };

  const openEditModal = (note: TaskNote) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
    setNewNoteContent('');
  };

  // Submit on Enter, allow newline with Shift+Enter inside modal textarea
  const handleModalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingNote) {
        void handleEditNote();
      } else {
        void handleAddNote();
      }
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-20 rounded"></div>;
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center justify-between">
        {notes.length === 0 ? (
          // Compact clickable label for adding a note when there are none
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowAddForm(true);
              setIsExpanded(true);
            }}
            className="text-xs text-gray-600 hover:text-blue-700"
          >
            Add Note
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800 p-1 space-x-2"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <StickyNote className="w-4 h-4" />
            <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
          </Button>
        )}
        {isExpanded && notes.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowAddForm(true);
              setShowAddModal(true);
            }}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {isExpanded && (
        <>
          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="relative">
                  {/* Insert position indicator - before */}
                  {dragOverNoteId === note.id && insertPosition === 'before' && (
                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
                  )}
                  
                  <Card 
                    className={`bg-white border-gray-200 cursor-move transition-all ${
                      draggedNoteId === note.id ? 'opacity-50 scale-95' : 'hover:shadow-md'
                    } ${dragOverNoteId === note.id ? 'ring-2 ring-blue-300' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id!)}
                    onDragOver={(e) => handleDragOver(e, note.id!)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, note.id!)}
                    onDragEnd={handleDragEnd}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-700 flex-1 pr-2">{note.content}</p>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(note)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note.id!)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(note.created_at!).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Insert position indicator - after */}
                  {dragOverNoteId === note.id && insertPosition === 'after' && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline Add Note Form */}
          {showAddForm && (
            <UnifiedAddForm
              fields={noteFields}
              onSubmit={handleUnifiedFormSubmit}
              onCancel={() => {
                setShowAddForm(false);
                setNewNoteContent('');
              }}
              submitLabel="Save Note"
              autoFocus={true}
            />
          )}
        </>
      )}

      {/* Add/Edit Note Modal */}
      <Dialog open={showAddModal || !!editingNote} onOpenChange={closeModal}>
    <DialogContent className="bg-gray-50">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Write your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              onKeyDown={handleModalKeyDown}
              className="bg-gray-100"
              ref={modalTextareaRef}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={editingNote ? handleEditNote : handleAddNote}>
                {editingNote ? 'Update' : 'Add'} Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}