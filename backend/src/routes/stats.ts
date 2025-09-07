import express from 'express';
import { getDatabase } from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

// GET /api/stats/progress - Get progress statistics
router.get('/progress', authenticateToken, (req: any, res) => {
  const db = getDatabase();
  const userId = req.user.userId;

  // Get total projects and active projects
  db.get(`
    SELECT 
      COUNT(*) as total_projects,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_projects
    FROM projects 
    WHERE user_id = ?
  `, [userId], (err, projectStats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get task statistics
    db.get(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks t
      JOIN stages s ON t.stage_id = s.id
      JOIN projects p ON s.project_id = p.id
      WHERE p.user_id = ?
    `, [userId], (err, taskStats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get total session time
      db.get(`
        SELECT COALESCE(SUM(ws.duration), 0) as total_session_time
        FROM work_sessions ws
        JOIN projects p ON ws.project_id = p.id
        WHERE p.user_id = ?
      `, [userId], (err, sessionStats) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Get this week's task completions
        db.get(`
          SELECT COUNT(*) as tasks_this_week
          FROM tasks t
          JOIN stages s ON t.stage_id = s.id
          JOIN projects p ON s.project_id = p.id
          WHERE p.user_id = ? 
            AND t.completed_at IS NOT NULL 
            AND DATE(t.completed_at) >= DATE('now', '-7 days')
        `, [userId], (err, thisWeekTasks) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get this week's sessions
          db.get(`
            SELECT 
              COUNT(*) as sessions_this_week,
              COALESCE(SUM(ws.duration), 0) as time_this_week
            FROM work_sessions ws
            JOIN projects p ON ws.project_id = p.id
            WHERE p.user_id = ? 
              AND DATE(ws.started_at) >= DATE('now', '-7 days')
          `, [userId], (err, thisWeekSessions) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Get last week's task completions
            db.get(`
              SELECT COUNT(*) as tasks_last_week
              FROM tasks t
              JOIN stages s ON t.stage_id = s.id
              JOIN projects p ON s.project_id = p.id
              WHERE p.user_id = ? 
                AND t.completed_at IS NOT NULL 
                AND DATE(t.completed_at) >= DATE('now', '-14 days') 
                AND DATE(t.completed_at) < DATE('now', '-7 days')
            `, [userId], (err, lastWeekTasks) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Get last week's sessions
              db.get(`
                SELECT 
                  COUNT(*) as sessions_last_week,
                  COALESCE(SUM(ws.duration), 0) as time_last_week
                FROM work_sessions ws
                JOIN projects p ON ws.project_id = p.id
                WHERE p.user_id = ? 
                  AND DATE(ws.started_at) >= DATE('now', '-14 days') 
                  AND DATE(ws.started_at) < DATE('now', '-7 days')
              `, [userId], (err, lastWeekSessions) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                // Combine all statistics
                const progressData = {
                  totalProjects: projectStats.total_projects || 0,
                  activeProjects: projectStats.active_projects || 0,
                  completedTasks: taskStats.completed_tasks || 0,
                  totalTasks: taskStats.total_tasks || 0,
                  totalSessionTime: sessionStats.total_session_time || 0,
                  weeklyStats: {
                    thisWeek: {
                      tasks: thisWeekTasks.tasks_this_week || 0,
                      sessions: thisWeekSessions.sessions_this_week || 0,
                      time: thisWeekSessions.time_this_week || 0
                    },
                    lastWeek: {
                      tasks: lastWeekTasks.tasks_last_week || 0,
                      sessions: lastWeekSessions.sessions_last_week || 0,
                      time: lastWeekSessions.time_last_week || 0
                    }
                  }
                };

                res.json(progressData);
              });
            });
          });
        });
      });
    });
  });
});

export default router;