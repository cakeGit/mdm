import express from 'express';
import { getDatabase } from '../database';
import { Task } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// Helper function to check write access to a project
const checkProjectWriteAccess = (db: any, projectId: number, userId: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Check if user owns the project
    db.get('SELECT user_id FROM projects WHERE id = ?', [projectId], (err: any, project: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!project) {
        resolve(false);
        return;
      }
      
      // User owns the project
      if (project.user_id === userId) {
        resolve(true);
        return;
      }
      
      // Check if project is shared with write access
      db.get(
        'SELECT permission FROM project_shares WHERE project_id = ? AND shared_with_user_id = ?',
        [projectId, userId],
        (err: any, share: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          resolve(share && share.permission === 'readwrite');
        }
      );
    });
  });
};

// PATCH /api/tasks/:id - Update a task
router.patch('/:id', authenticateToken, async (req: any, res) => {
  const taskId = parseInt(req.params.id);
  const { status, title, description, priority, is_pinned, notes } = req.body;
  
  const db = getDatabase();
  
  // First verify the task exists and get project_id
  db.get(`
    SELECT t.id, p.id as project_id FROM tasks t
    JOIN stages s ON t.stage_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE t.id = ?
  `, [taskId], async (err, task: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check write access
    try {
      const hasAccess = await checkProjectWriteAccess(db, task.project_id, req.user.userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Write access denied' });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
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
    
    if (is_pinned !== undefined) {
      updates.push('is_pinned = ?');
      values.push(is_pinned ? 1 : 0);
    }
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
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

// POST /api/tasks - Create a new task
router.post('/', authenticateToken, (req: any, res) => {
  const { stage_id, title, description, priority = 2 } = req.body;
  
  if (!stage_id || !title) {
    return res.status(400).json({ error: 'Stage ID and task title are required' });
  }
  
  const db = getDatabase();
  
  // First verify the stage belongs to a project owned by the user
  db.get(`
    SELECT s.id FROM stages s
    JOIN projects p ON s.project_id = p.id
    WHERE s.id = ? AND p.user_id = ?
  `, [stage_id, req.user.userId], (err, stage) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    db.run(`
      INSERT INTO tasks (stage_id, title, description, priority)
      VALUES (?, ?, ?, ?)
    `, [stage_id, title, description, priority], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        stage_id,
        title,
        description,
        status: 'todo',
        priority
      });
    });
  });
});

// PUT /api/tasks/reorder - Reorder tasks within a stage
router.put('/reorder', authenticateToken, (req: any, res) => {
  const { stage_id, task_ids } = req.body;
  
  if (!stage_id || !Array.isArray(task_ids)) {
    return res.status(400).json({ error: 'Stage ID and task IDs array are required' });
  }
  
  const db = getDatabase();
  
  // First verify the stage belongs to a project owned by the user
  db.get(`
    SELECT s.id FROM stages s
    JOIN projects p ON s.project_id = p.id
    WHERE s.id = ? AND p.user_id = ?
  `, [stage_id, req.user.userId], (err, stage) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    // Update sort_order for each task
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completed = 0;
      let errors = false;
      
      task_ids.forEach((taskId: number, index: number) => {
        db.run(
          'UPDATE tasks SET sort_order = ? WHERE id = ? AND stage_id = ?',
          [index, taskId, stage_id],
          function(err) {
            if (err) {
              errors = true;
              console.error('Failed to update task order:', err);
            }
            
            completed++;
            
            if (completed === task_ids.length) {
              if (errors) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to update task order' });
              } else {
                db.run('COMMIT');
                res.json({ success: true });
              }
            }
          }
        );
      });
    });
  });
});

export default router;

// GET /api/tasks/pinned - Get user's pinned tasks
router.get('/pinned', authenticateToken, (req: any, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT t.*, s.project_id as project_id, s.name as stage_name, p.name as project_name, p.color as project_color
    FROM tasks t
    JOIN stages s ON t.stage_id = s.id
    JOIN projects p ON s.project_id = p.id
    WHERE p.user_id = ? AND t.is_pinned = 1
    ORDER BY t.priority ASC, t.created_at ASC
  `, [req.user.userId], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(tasks);
  });
});