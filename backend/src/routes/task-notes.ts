import express from 'express';
import { getDatabase } from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

// GET /api/task-notes/:taskId - Get notes for a task
router.get('/:taskId', authenticateToken, (req: any, res) => {
  const taskId = parseInt(req.params.taskId);
  const db = getDatabase();
  
  // Verify user owns the task
  db.get(`
    SELECT t.id FROM tasks t
    JOIN stages s ON t.stage_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE t.id = ? AND p.user_id = ?
  `, [taskId, req.user.userId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.all('SELECT * FROM task_notes WHERE task_id = ? ORDER BY created_at ASC', [taskId], (err, notes) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(notes);
    });
  });
});

// POST /api/task-notes - Create a new note for a task
router.post('/', authenticateToken, (req: any, res) => {
  const { task_id, content } = req.body;
  
  if (!task_id || !content) {
    return res.status(400).json({ error: 'Task ID and content are required' });
  }
  
  const db = getDatabase();
  
  // Verify user owns the task
  db.get(`
    SELECT t.id FROM tasks t
    JOIN stages s ON t.stage_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE t.id = ? AND p.user_id = ?
  `, [task_id, req.user.userId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    db.run(`
      INSERT INTO task_notes (task_id, content)
      VALUES (?, ?)
    `, [task_id, content], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        task_id,
        content,
        created_at: new Date().toISOString()
      });
    });
  });
});

// PUT /api/task-notes/:id - Update a note
router.put('/:id', authenticateToken, (req: any, res) => {
  const noteId = parseInt(req.params.id);
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const db = getDatabase();
  
  // Verify user owns the note
  db.get(`
    SELECT tn.id FROM task_notes tn
    JOIN tasks t ON tn.task_id = t.id
    JOIN stages s ON t.stage_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE tn.id = ? AND p.user_id = ?
  `, [noteId, req.user.userId], (err, note) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    db.run(`
      UPDATE task_notes 
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [content, noteId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ id: noteId, content });
    });
  });
});

// PUT /api/task-notes/reorder - Reorder notes for a task
router.put('/reorder', authenticateToken, (req: any, res) => {
  const { task_id, note_ids } = req.body;
  
  if (!task_id || !Array.isArray(note_ids)) {
    return res.status(400).json({ error: 'Task ID and note IDs array are required' });
  }
  
  const db = getDatabase();
  
  // Verify user owns the task
  db.get(`
    SELECT t.id FROM tasks t
    JOIN stages s ON t.stage_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE t.id = ? AND p.user_id = ?
  `, [task_id, req.user.userId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // For now, we'll just return success as the frontend handles the order
    // In a future version, we could add a sort_order column to task_notes
    res.json({ message: 'Note order updated successfully' });
  });
});

// DELETE /api/task-notes/:id - Delete a note
router.delete('/:id', authenticateToken, (req: any, res) => {
  const noteId = parseInt(req.params.id);
  const db = getDatabase();
  
  // Verify user owns the note
  db.get(`
    SELECT tn.id FROM task_notes tn
    JOIN tasks t ON tn.task_id = t.id
    JOIN stages s ON t.stage_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE tn.id = ? AND p.user_id = ?
  `, [noteId, req.user.userId], (err, note) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    db.run('DELETE FROM task_notes WHERE id = ?', [noteId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ message: 'Note deleted successfully' });
    });
  });
});

export default router;