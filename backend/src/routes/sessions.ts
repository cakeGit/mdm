import express from 'express';
import { getDatabase } from '../database';
import { WorkSession } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// GET /api/sessions - Get sessions (optional ?date=YYYY-MM-DD)
router.get('/', authenticateToken, (req: any, res) => {
  const date = req.query.date as string;
  const db = getDatabase();
  
  let query = `
    SELECT ws.*, p.name as project_name
    FROM work_sessions ws
    JOIN projects p ON ws.project_id = p.id
    WHERE p.user_id = ?
  `;
  
  const params: any[] = [req.user.userId];
  
  if (date) {
    query += ` AND DATE(ws.started_at) = ?`;
    params.push(date);
  }
  
  query += ` ORDER BY ws.started_at DESC`;
  
  db.all(query, params, (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(sessions);
  });
});

// POST /api/sessions - Log a new work session
router.post('/', authenticateToken, (req: any, res) => {
  const { project_id, duration, notes } = req.body;
  
  if (!project_id || !duration) {
    return res.status(400).json({ error: 'Project ID and duration are required' });
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
      INSERT INTO work_sessions (project_id, duration, started_at, notes)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    `, [project_id, duration, notes], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Update project's updated_at timestamp
      db.run('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [project_id]);
      
      res.status(201).json({
        id: this.lastID,
        project_id,
        duration,
        notes
      });
    });
  });
});

export default router;