import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskNote } from '@/types';
import { apiRequest } from '@/lib/api';

interface TaskNotesProps {
  taskId: number;
  onNotesChange?: (count: number) => void;
}

export function TaskNotes({ taskId, onNotesChange }: TaskNotesProps) {
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TaskNote | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [taskId]);

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

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const response = await apiRequest('/api/task-notes', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          content: newNoteContent.trim()
        })
      });

      if (response.ok) {
        setNewNoteContent('');
        setShowAddModal(false);
        await fetchNotes();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
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

  const openEditModal = (note: TaskNote) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
    setNewNoteContent('');
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-20 rounded"></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <StickyNote className="w-4 h-4" />
          <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddModal(true)}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Note
        </Button>
      </div>

      {notes.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {notes.map((note) => (
            <Card key={note.id} className="bg-yellow-50 border-yellow-200">
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
          ))}
        </div>
      )}

      {/* Add/Edit Note Modal */}
      <Dialog open={showAddModal || !!editingNote} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Write your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
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