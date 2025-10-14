import express from 'express';
import crypto from 'crypto';
import { getDatabase } from '../database';
import { ProjectShare, ProjectShareToken } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// Middleware to check if user owns the project
const verifyProjectOwnership = (req: any, res: any, next: any) => {
  const projectId = parseInt(req.params.id);
  const db = getDatabase();
  
  db.get(
    'SELECT id FROM projects WHERE id = ? AND user_id = ?',
    [projectId, req.user.userId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!project) {
        return res.status(404).json({ error: 'Project not found or you do not have permission' });
      }
      req.projectId = projectId;
      next();
    }
  );
};

// POST /api/projects/:id/share - Share project with a user
router.post('/:id/share', authenticateToken, verifyProjectOwnership, (req: any, res) => {
  const { username, permission } = req.body;
  
  if (!username || !permission) {
    return res.status(400).json({ error: 'Username and permission are required' });
  }
  
  if (!['read', 'readwrite'].includes(permission)) {
    return res.status(400).json({ error: 'Permission must be "read" or "readwrite"' });
  }
  
  const db = getDatabase();
  
  // Find the user to share with
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot share project with yourself' });
    }
    
    // Create the share
    db.run(
      `INSERT INTO project_shares (project_id, shared_with_user_id, permission, created_by_user_id)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(project_id, shared_with_user_id) 
       DO UPDATE SET permission = excluded.permission`,
      [req.projectId, user.id, permission, req.user.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({
          id: this.lastID,
          project_id: req.projectId,
          shared_with_user_id: user.id,
          permission,
          created_by_user_id: req.user.userId
        });
      }
    );
  });
});

// GET /api/projects/:id/shares - List project shares
router.get('/:id/shares', authenticateToken, verifyProjectOwnership, (req: any, res) => {
  const db = getDatabase();
  
  db.all(
    `SELECT ps.*, u.username as shared_with_username, u.email as shared_with_email
     FROM project_shares ps
     JOIN users u ON ps.shared_with_user_id = u.id
     WHERE ps.project_id = ?
     ORDER BY ps.created_at DESC`,
    [req.projectId],
    (err, shares: ProjectShare[]) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(shares);
    }
  );
});

// DELETE /api/projects/:id/shares/:shareId - Remove a share
router.delete('/:id/shares/:shareId', authenticateToken, verifyProjectOwnership, (req: any, res) => {
  const shareId = parseInt(req.params.shareId);
  const db = getDatabase();
  
  db.run(
    'DELETE FROM project_shares WHERE id = ? AND project_id = ?',
    [shareId, req.projectId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Share not found' });
      }
      
      res.json({ success: true });
    }
  );
});

// POST /api/projects/:id/share-token - Generate anonymous read-only link
router.post('/:id/share-token', authenticateToken, verifyProjectOwnership, (req: any, res) => {
  const db = getDatabase();
  const token = crypto.randomBytes(32).toString('hex');
  
  // Check if token already exists
  db.get(
    'SELECT * FROM project_share_tokens WHERE project_id = ?',
    [req.projectId],
    (err, existingToken: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (existingToken) {
        return res.json({
          id: existingToken.id,
          project_id: existingToken.project_id,
          token: existingToken.token,
          created_at: existingToken.created_at,
          expires_at: existingToken.expires_at
        });
      }
      
      // Create new token
      db.run(
        'INSERT INTO project_share_tokens (project_id, token, created_by_user_id) VALUES (?, ?, ?)',
        [req.projectId, token, req.user.userId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            id: this.lastID,
            project_id: req.projectId,
            token,
            created_by_user_id: req.user.userId
          });
        }
      );
    }
  );
});

// GET /api/projects/:id/share-token - Get existing token
router.get('/:id/share-token', authenticateToken, verifyProjectOwnership, (req: any, res) => {
  const db = getDatabase();
  
  db.get(
    'SELECT * FROM project_share_tokens WHERE project_id = ?',
    [req.projectId],
    (err, token: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!token) {
        return res.status(404).json({ error: 'No share token found' });
      }
      
      res.json(token);
    }
  );
});

// DELETE /api/projects/:id/share-token - Revoke anonymous link
router.delete('/:id/share-token', authenticateToken, verifyProjectOwnership, (req: any, res) => {
  const db = getDatabase();
  
  db.run(
    'DELETE FROM project_share_tokens WHERE project_id = ?',
    [req.projectId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Share token not found' });
      }
      
      res.json({ success: true });
    }
  );
});

// GET /api/shared/:token - Access project via anonymous link (no auth required)
router.get('/shared/:token', (req: any, res) => {
  const { token } = req.params;
  const db = getDatabase();
  
  // Find the token and get project
  db.get(
    `SELECT pst.*, p.id as project_id, p.name, p.description, p.color, p.created_at, p.updated_at
     FROM project_share_tokens pst
     JOIN projects p ON pst.project_id = p.id
     WHERE pst.token = ? AND (pst.expires_at IS NULL OR pst.expires_at > CURRENT_TIMESTAMP)`,
    [token],
    (err, result: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!result) {
        return res.status(404).json({ error: 'Invalid or expired share link' });
      }
      
      const projectId = result.project_id;
      
      // Get stages
      db.all('SELECT * FROM stages WHERE project_id = ? ORDER BY sort_order', [projectId], (err, stages: any[]) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Get tasks for all stages
        const stageIds = stages.map(s => s.id).join(',');
        const taskQuery = stageIds ? `SELECT * FROM tasks WHERE stage_id IN (${stageIds}) ORDER BY created_at` : 'SELECT * FROM tasks WHERE 1=0';
        
        db.all(taskQuery, [], (err, tasks: any[]) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Build response with stages and tasks
          const stagesWithTasks = stages.map(stage => ({
            ...stage,
            tasks: tasks.filter(t => t.stage_id === stage.id)
          }));
          
          res.json({
            id: projectId,
            name: result.name,
            description: result.description,
            color: result.color,
            created_at: result.created_at,
            updated_at: result.updated_at,
            stages: stagesWithTasks,
            permission: 'read',
            shared: true
          });
        });
      });
    }
  );
});

export default router;
