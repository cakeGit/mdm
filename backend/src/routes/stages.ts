import express from 'express';
import { getDatabase } from '../database';
import { Task } from '../types';

const router = express.Router();

// POST /api/stages/:id/tasks - Add a task to a stage
router.post('/:id/tasks', (req, res) => {
  const stageId = parseInt(req.params.id);
  const { title, description, priority = 2 } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  
  const db = getDatabase();
  
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

export default router;