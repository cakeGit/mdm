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

                // Calculate streak with 1-day grace period
                // Get all unique dates with sessions, ordered descending
                db.all(`
                  SELECT DISTINCT DATE(ws.started_at) as session_date
                  FROM work_sessions ws
                  JOIN projects p ON ws.project_id = p.id
                  WHERE p.user_id = ?
                  ORDER BY session_date DESC
                `, [userId], (err, sessionDates) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  let streak = 0;
                  let gapsUsed = 0;
                  let currentDate = new Date();
                  currentDate.setHours(0, 0, 0, 0);

                  // Convert session dates to Date objects
                  const dates = sessionDates.map((row: any) => new Date(row.session_date + 'T00:00:00Z'));
                  
                  // Check if today has a session
                  const todayStr = currentDate.toISOString().split('T')[0];
                  const hasToday = dates.some(d => d.toISOString().split('T')[0] === todayStr);
                  
                  if (hasToday) {
                    streak = 1;
                    currentDate.setDate(currentDate.getDate() - 1);
                  } else {
                    // Check yesterday (allows 1-day gap from today)
                    const yesterdayStr = new Date(currentDate.getTime() - 24*60*60*1000).toISOString().split('T')[0];
                    const hasYesterday = dates.some(d => d.toISOString().split('T')[0] === yesterdayStr);
                    
                    if (hasYesterday) {
                      streak = 1;
                      gapsUsed = 1;
                      currentDate.setDate(currentDate.getDate() - 2);
                    } else {
                      // No recent activity, streak is 0
                      streak = 0;
                    }
                  }

                  // Continue checking previous days
                  for (let i = 0; i < dates.length && streak > 0; i++) {
                    const checkDateStr = currentDate.toISOString().split('T')[0];
                    const hasSession = dates.some(d => d.toISOString().split('T')[0] === checkDateStr);
                    
                    if (hasSession) {
                      streak++;
                      currentDate.setDate(currentDate.getDate() - 1);
                    } else {
                      // Check if we can use grace period
                      const graceDateStr = new Date(currentDate.getTime() - 24*60*60*1000).toISOString().split('T')[0];
                      const hasGraceSession = dates.some(d => d.toISOString().split('T')[0] === graceDateStr);
                      
                      if (hasGraceSession && gapsUsed === 0) {
                        streak++;
                        gapsUsed++;
                        currentDate.setDate(currentDate.getDate() - 2);
                      } else {
                        break; // Streak broken
                      }
                    }
                  }

                  // Combine all statistics
                  const progressData = {
                    totalProjects: (projectStats as any)?.total_projects || 0,
                    activeProjects: (projectStats as any)?.active_projects || 0,
                    completedTasks: (taskStats as any)?.completed_tasks || 0,
                    totalTasks: (taskStats as any)?.total_tasks || 0,
                    totalSessionTime: (sessionStats as any)?.total_session_time || 0,
                    streak: streak,
                    weeklyStats: {
                      thisWeek: {
                        tasks: (thisWeekTasks as any)?.tasks_this_week || 0,
                        sessions: (thisWeekSessions as any)?.sessions_this_week || 0,
                        time: (thisWeekSessions as any)?.time_this_week || 0
                      },
                      lastWeek: {
                        tasks: (lastWeekTasks as any)?.tasks_last_week || 0,
                        sessions: (lastWeekSessions as any)?.sessions_last_week || 0,
                        time: (lastWeekSessions as any)?.time_last_week || 0
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
});

export default router;