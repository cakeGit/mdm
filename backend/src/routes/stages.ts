import express from 'express';
import { getDatabase } from '../database';
import { Task } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// POST /api/stages - Create a new stage
router.post('/', authenticateToken, (req: any, res) => {
  const { project_id, name, description, parent_stage_id, weight = 1 } = req.body;
  
  if (!project_id || !name) {
    return res.status(400).json({ error: 'Project ID and stage name are required' });
  }
  
  const db = getDatabase();
  
  // First verify the project belongs to the user
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, req.user.userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    db.run(`
      INSERT INTO stages (project_id, parent_stage_id, name, description, sort_order, weight)
      VALUES (?, ?, ?, ?, 0, ?)
    `, [project_id, parent_stage_id || null, name, description, weight], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Update project's updated_at timestamp
      db.run('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [project_id]);
      
      res.status(201).json({
        id: this.lastID,
        project_id,
        parent_stage_id,
        name,
        description,
        sort_order: 0,
        weight,
        is_completed: false
      });
    });
  });
});

// PATCH /api/stages/:id - Update a stage
router.patch('/:id', authenticateToken, (req: any, res) => {
  const stageId = parseInt(req.params.id);
  const { name, description, is_completed, weight, progress } = req.body;
  
  const db = getDatabase();
  
  // First verify the stage belongs to a project owned by the user
  db.get(`
    SELECT s.id FROM stages s
    JOIN projects p ON s.project_id = p.id
    WHERE s.id = ? AND p.user_id = ?
  `, [stageId, req.user.userId], (err, stage) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_completed !== undefined) {
      updates.push('is_completed = ?');
      values.push(is_completed);
    }
    if (weight !== undefined) {
      updates.push('weight = ?');
      values.push(weight);
    }
    if (progress !== undefined) {
      updates.push('progress = ?');
      values.push(progress);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(stageId);
    
    db.run(`UPDATE stages SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Stage not found' });
      }
      
      res.json({ success: true });
    });
  });
});

// PUT /api/stages/reorder - Reorder stages
router.put('/reorder', authenticateToken, (req: any, res) => {
  const { project_id, stage_ids } = req.body;
  
  if (!project_id || !Array.isArray(stage_ids) || stage_ids.length === 0) {
    return res.status(400).json({ error: 'Project ID and stage IDs array are required' });
  }
  
  const db = getDatabase();
  
  // First verify the project belongs to the user
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, req.user.userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Start a transaction to update all stages
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completed = 0;
      const total = stage_ids.length;
      let hasError = false;
      
      stage_ids.forEach((stageId: number, index: number) => {
        db.run('UPDATE stages SET sort_order = ? WHERE id = ? AND project_id = ?', 
          [index, stageId, project_id], 
          function(err) {
            completed++;
            
            if (err) {
              hasError = true;
              console.error('Error updating stage order:', err);
            }
            
            if (completed === total) {
              if (hasError) {
                db.run('ROLLBACK');
                res.status(500).json({ error: 'Failed to reorder stages' });
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

// POST /api/stages/:id/tasks - Add a task to a stage
router.post('/:id/tasks', authenticateToken, (req: any, res) => {
  const stageId = parseInt(req.params.id);
  const { title, description, priority = 2 } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  
  const db = getDatabase();
  
  // First verify the stage belongs to a project owned by the user
  db.get(`
    SELECT s.id FROM stages s
    JOIN projects p ON s.project_id = p.id
    WHERE s.id = ? AND p.user_id = ?
  `, [stageId, req.user.userId], (err, stage) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    db.run(`
      INSERT INTO tasks (stage_id, title, description, priority)
      VALUES (?, ?, ?, ?)
    `, [stageId, title, description, priority], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        stage_id: stageId,
        title,
        description,
        status: 'todo',
        priority
      });
    });
  });
});

export default router;