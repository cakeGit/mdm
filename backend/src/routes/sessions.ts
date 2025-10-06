import express from 'express';
import { getDatabase } from '../database';
import { WorkSession } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// GET /api/sessions - Get sessions with filtering
router.get('/', authenticateToken, (req: any, res) => {
  const filter = req.query.filter as string;
  const projectId = req.query.project_id as string;
  const limit = req.query.limit as string;
  const db = getDatabase();
  
  let query = `
    SELECT ws.*, p.name as project_name, p.color as project_color
    FROM work_sessions ws
    JOIN projects p ON ws.project_id = p.id
    WHERE p.user_id = ?
  `;
  
  const params: any[] = [req.user.userId];
  
  // Add project filtering if specified
  if (projectId) {
    query += ` AND ws.project_id = ?`;
    params.push(projectId);
  }
  
  // Add date filtering based on filter parameter
  if (filter && filter !== 'all') {
    switch (filter) {
      case 'today':
        query += ` AND DATE(ws.started_at) = DATE('now')`;
        break;
      case 'week':
        query += ` AND DATE(ws.started_at) >= DATE('now', '-7 days')`;
        break;
      case 'month':
        query += ` AND DATE(ws.started_at) >= DATE('now', '-30 days')`;
        break;
    }
  }
  
  query += ` ORDER BY ws.started_at DESC`;
  
  // Add limit if specified
  if (limit) {
    query += ` LIMIT ?`;
    params.push(parseInt(limit));
  }
  
  db.all(query, params, (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(sessions);
  });
});

// POST /api/sessions - Log a new work session
router.post('/', authenticateToken, (req: any, res) => {
  const { project_id, duration, notes, started_at } = req.body;
  
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
    
    // Use provided started_at or default to current timestamp
    const sessionStartedAt = started_at || new Date().toISOString();
    
    db.run(`
      INSERT INTO work_sessions (project_id, duration, started_at, notes)
      VALUES (?, ?, ?, ?)
    `, [project_id, duration, sessionStartedAt, notes], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Update project's updated_at timestamp
      db.run('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [project_id]);
      
      res.status(201).json({
        id: this.lastID,
        project_id,
        duration,
        notes,
        started_at: sessionStartedAt
      });
    });
  });
});

export default router;