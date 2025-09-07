import express from 'express';
import { getDatabase } from '../database';
import { Task } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// PATCH /api/tasks/:id - Update a task
router.patch('/:id', authenticateToken, (req: any, res) => {
  const taskId = parseInt(req.params.id);
  const { status, title, description, priority } = req.body;
  
  const db = getDatabase();
  
  // First verify the task belongs to a stage/project owned by the user
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
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (status) {
      updates.push('status = ?');
      values.push(status);
      
      if (status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      } else {
        updates.push('completed_at = NULL');
      }
    }
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(taskId);
    
    db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ success: true });
    });
  });
});

export default router;