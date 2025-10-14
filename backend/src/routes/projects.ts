import express from 'express';
import { getDatabase } from '../database';
import { Project, ProjectWithDetails, Stage, Task } from '../types';
import { authenticateToken } from './auth';

const router = express.Router();

// Middleware to check project access (owner or shared)
const checkProjectAccess = (req: any, res: any, next: any) => {
  const projectId = parseInt(req.params.id);
  const db = getDatabase();
  
  // Check if user owns the project
  db.get('SELECT id, user_id FROM projects WHERE id = ?', [projectId], (err, project: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // User owns the project
    if (project.user_id === req.user.userId) {
      req.projectId = projectId;
      req.projectPermission = 'owner';
      return next();
    }
    
    // Check if project is shared with user
    db.get(
      'SELECT permission FROM project_shares WHERE project_id = ? AND shared_with_user_id = ?',
      [projectId, req.user.userId],
      (err, share: any) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!share) {
          return res.status(403).json({ error: 'Access denied' });
        }
        
        req.projectId = projectId;
        req.projectPermission = share.permission;
        next();
      }
    );
  });
};

// Middleware to check write access (owner or readwrite permission)
const checkWriteAccess = (req: any, res: any, next: any) => {
  const projectId = parseInt(req.params.id);
  const db = getDatabase();
  
  // Check if user owns the project
  db.get('SELECT id, user_id FROM projects WHERE id = ?', [projectId], (err, project: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // User owns the project
    if (project.user_id === req.user.userId) {
      req.projectId = projectId;
      req.projectPermission = 'owner';
      return next();
    }
    
    // Check if project is shared with user with write access
    db.get(
      'SELECT permission FROM project_shares WHERE project_id = ? AND shared_with_user_id = ?',
      [projectId, req.user.userId],
      (err, share: any) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!share || share.permission !== 'readwrite') {
          return res.status(403).json({ error: 'Write access denied' });
        }
        
        req.projectId = projectId;
        req.projectPermission = share.permission;
        next();
      }
    );
  });
};

// GET /api/projects - Fetch all projects (owned and shared)
router.get('/', authenticateToken, (req: any, res) => {
  const db = getDatabase();
  
  // First get owned projects
  db.all(`
    SELECT p.*, 
           COUNT(t.id) as total_tasks,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
           'owner' as permission,
           0 as is_shared
    FROM projects p
    LEFT JOIN stages s ON p.id = s.project_id
    LEFT JOIN tasks t ON s.id = t.stage_id
    WHERE p.user_id = ?
    GROUP BY p.id
  `, [req.user.userId], (err, ownedProjects: any[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Then get shared projects
    db.all(`
      SELECT p.*, 
             COUNT(t.id) as total_tasks,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
             ps.permission,
             1 as is_shared
      FROM projects p
      JOIN project_shares ps ON p.id = ps.project_id
      LEFT JOIN stages s ON p.id = s.project_id
      LEFT JOIN tasks t ON s.id = t.stage_id
      WHERE ps.shared_with_user_id = ?
      GROUP BY p.id
    `, [req.user.userId], (err, sharedProjects: any[]) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Combine owned and shared projects
      const rows = [...ownedProjects, ...sharedProjects].sort((a, b) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      
      if (rows.length === 0) {
        return res.json([]);
      }
    
    
    // Calculate stage-based progress for each project
    const projectIds = rows.map(row => row.id);
    if (projectIds.length === 0) {
      return res.json([]);
    }
    
    // Get all stages with their task completion stats
    const stagesQuery = `
      SELECT s.id, s.project_id, s.weight,
             COUNT(t.id) as stage_total_tasks,
             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as stage_completed_tasks
      FROM stages s
      LEFT JOIN tasks t ON s.id = t.stage_id
      WHERE s.project_id IN (${projectIds.map(() => '?').join(',')})
        AND s.parent_stage_id IS NULL
      GROUP BY s.id, s.project_id, s.weight
    `;
    
    db.all(stagesQuery, projectIds, (err, stages: any[]) => {
      if (err) {
        console.error('Error fetching stage progress:', err);
        // Fallback to task-based progress
        const projects = rows.map(row => ({
          ...row,
          progress: row.total_tasks > 0 ? (row.completed_tasks / row.total_tasks) * 100 : 0
        }));
        return res.json(projects);
      }
      
      // Calculate stage-based progress for each project
      const projects = rows.map(row => {
        const projectStages = stages.filter(stage => stage.project_id === row.id);
        
        if (projectStages.length === 0) {
          return {
            ...row,
            progress: 0
          };
        }
        
        // Calculate weighted average of stage completions
        const stageProgress = projectStages.map(stage => {
          const completionRate = stage.stage_total_tasks > 0 
            ? (stage.stage_completed_tasks / stage.stage_total_tasks) 
            : 0;
          return {
            progress: completionRate * 100,
            weight: stage.weight || 1
          };
        });
        
        const totalWeight = stageProgress.reduce((sum, stage) => sum + stage.weight, 0);
        const weightedProgress = totalWeight > 0 
          ? stageProgress.reduce((sum, stage) => sum + (stage.progress * stage.weight), 0) / totalWeight
          : 0;
        
        return {
          ...row,
          progress: weightedProgress
        };
      });
    
    // Get suggested tasks for all projects
    const projectIds = projects.map(p => p.id).join(',');
    if (projectIds) {
      const suggestedTaskQuery = `
        SELECT t.*, s.project_id
        FROM tasks t
        JOIN stages s ON t.stage_id = s.id
        WHERE s.project_id IN (${projectIds}) 
          AND t.status != 'completed'
        ORDER BY s.project_id, t.priority ASC, t.created_at ASC
      `;
      
      db.all(suggestedTaskQuery, [], (err, tasks: any[]) => {
        if (err) {
          console.error('Error fetching suggested tasks:', err);
          return res.json(projects);
        }
        
        // Add suggested task to each project (first non-completed task by priority)
        const projectsWithSuggestions = projects.map(project => {
          const suggestedTask = tasks.find(task => task.project_id === project.id);
          return {
            ...project,
            suggested_task: suggestedTask || null
          };
        });
        
        res.json(projectsWithSuggestions);
      });
    } else {
      res.json(projects);
    }
    });
    });
  });
});

// POST /api/projects - Create a new project
router.post('/', authenticateToken, (req: any, res) => {
  const { name, description, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  const db = getDatabase();
  
  db.run(`
    INSERT INTO projects (user_id, name, description, color, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [req.user.userId, name, description, color || '#6366f1'], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      name,
      description,
      color: color || '#6366f1',
  status: 'active'
    });
  });
});

// GET /api/projects/:id - Get project with nested stages/tasks
router.get('/:id', authenticateToken, checkProjectAccess, (req: any, res) => {
  const projectId = req.projectId;
  const db = getDatabase();
  
  // Get project details
  db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project: Project) => {
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
        
        // Calculate stage-based progress
        const stageProgress = rootStages.map(stage => {
          const stageTasks = stage.tasks || [];
          const stageCompletedTasks = stageTasks.filter((t: Task) => t.status === 'completed').length;
          const stageCompletionRate = stageTasks.length > 0 ? (stageCompletedTasks / stageTasks.length) : 0;
          
          return {
            ...stage,
            progress: stageCompletionRate * 100,
            weight: stage.weight || 1
          };
        });
        
        // Calculate total progress as weighted average of stage completions
        const totalWeight = stageProgress.reduce((sum, stage) => sum + stage.weight, 0);
        const weightedProgress = totalWeight > 0 
          ? stageProgress.reduce((sum, stage) => sum + (stage.progress * stage.weight), 0) / totalWeight
          : 0;

        const result: ProjectWithDetails = {
          ...project,
          stages: stageProgress,
          totalTasks,
          completedTasks,
          progress: weightedProgress,
          stageProgress: stageProgress.map(stage => ({
            id: stage.id,
            name: stage.name,
            progress: stage.progress,
            weight: stage.weight
          }))
        };
        
        res.json(result);
      });
    });
  });
});

// PATCH /api/projects/:id - Update project (requires write access)
router.patch('/:id', authenticateToken, checkWriteAccess, (req: any, res) => {
  const projectId = req.projectId;
  const { status, name, description, color } = req.body;
  
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
  if (color !== undefined) {
    updates.push('color = ?');
    values.push(color);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(projectId);
  
  db.run(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true });
  });
});

// POST /api/projects/:id/stages - Add a stage to a project (requires write access)
router.post('/:id/stages', authenticateToken, checkWriteAccess, (req: any, res) => {
  const projectId = req.projectId;
  const { name, description, parent_stage_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Stage name is required' });
  }
  
  const db = getDatabase();
  
  // Project access already verified by middleware
  db.get('SELECT id FROM projects WHERE id = ?', [projectId], (err, project) => {
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