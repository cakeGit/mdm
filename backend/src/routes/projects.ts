import express from 'express';
import { getDatabase } from '../database';
import { Project, ProjectWithDetails, Stage, Task } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// GET /api/projects - Fetch all projects
router.get('/', authenticateToken, (req: any, res) => {
  const db = getDatabase();
  
  db.all(`
    SELECT p.*, 
           COUNT(t.id) as total_tasks,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
    FROM projects p
    LEFT JOIN stages s ON p.id = s.project_id
    LEFT JOIN tasks t ON s.id = t.stage_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `, [req.user.userId], (err, rows: any[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const projects = rows.map(row => ({
      ...row,
      progress: row.total_tasks > 0 ? (row.completed_tasks / row.total_tasks) * 100 : 0
    }));
    
    res.json(projects);
  });
});

// POST /api/projects - Create a new project
router.post('/', authenticateToken, (req: any, res) => {
  const { name, description, minecraft_version } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  const db = getDatabase();
  
  db.run(`
    INSERT INTO projects (user_id, name, description, minecraft_version, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [req.user.userId, name, description, minecraft_version], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      name,
      description,
      minecraft_version,
      status: 'planning'
    });
  });
});

// GET /api/projects/:id - Get project with nested stages/tasks
router.get('/:id', authenticateToken, (req: any, res) => {
  const projectId = parseInt(req.params.id);
  const db = getDatabase();
  
  // Get project details
  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.userId], (err, project: Project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get stages
    db.all('SELECT * FROM stages WHERE project_id = ? ORDER BY sort_order', [projectId], (err, stages: Stage[]) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get tasks for all stages
      const stageIds = stages.map(s => s.id).join(',');
      const taskQuery = stageIds ? `SELECT * FROM tasks WHERE stage_id IN (${stageIds}) ORDER BY created_at` : 'SELECT * FROM tasks WHERE 1=0';
      
      db.all(taskQuery, [], (err, tasks: Task[]) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Organize data
        const stageMap = new Map<number, any>();
        stages.forEach(stage => {
          stageMap.set(stage.id!, {
            ...stage,
            tasks: tasks.filter(t => t.stage_id === stage.id),
            substages: []
          });
        });
        
        // Build hierarchy
        const rootStages: any[] = [];
        stages.forEach(stage => {
          const stageWithTasks = stageMap.get(stage.id!);
          if (stage.parent_stage_id) {
            const parent = stageMap.get(stage.parent_stage_id);
            if (parent) {
              parent.substages.push(stageWithTasks);
            }
          } else {
            rootStages.push(stageWithTasks);
          }
        });
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        
        const result: ProjectWithDetails = {
          ...project,
          stages: rootStages,
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        };
        
        res.json(result);
      });
    });
  });
});

// PATCH /api/projects/:id - Update project
router.patch('/:id', authenticateToken, (req: any, res) => {
  const projectId = parseInt(req.params.id);
  const { status, name, description, minecraft_version } = req.body;
  
  const db = getDatabase();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }
  if (minecraft_version !== undefined) {
    updates.push('minecraft_version = ?');
    values.push(minecraft_version);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(projectId);
  values.push(req.user.userId);
  
  db.run(`UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true });
  });
});

// POST /api/projects/:id/stages - Add a stage to a project
router.post('/:id/stages', authenticateToken, (req: any, res) => {
  const projectId = parseInt(req.params.id);
  const { name, description, parent_stage_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Stage name is required' });
  }
  
  const db = getDatabase();
  
  // First verify the project belongs to the user
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    db.run(`
      INSERT INTO stages (project_id, parent_stage_id, name, description, sort_order)
      VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM stages WHERE project_id = ?))
    `, [projectId, parent_stage_id || null, name, description, projectId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        project_id: projectId,
        parent_stage_id: parent_stage_id || null,
        name,
        description,
        sort_order: 0,
        is_completed: false
      });
    });
  });
});

export default router;