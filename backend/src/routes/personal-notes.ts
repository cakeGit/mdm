import express from 'express';
import { getDatabase } from '../database';
import { authenticateToken } from './auth';

const router = express.Router();

// GET /api/personal-note - Get the user's personal note
router.get('/', authenticateToken, (req: any, res) => {
  const db = getDatabase();
  const userId = req.user.userId;

  db.get(
    'SELECT content, updated_at FROM personal_notes WHERE user_id = ?',
    [userId],
    (err, row: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        // Return empty note if none exists yet
        return res.json({ content: '', updated_at: null });
      }

      res.json({
        content: row.content,
        updated_at: row.updated_at
      });
    }
  );
});

// PUT /api/personal-note - Create or update the user's personal note
router.put('/', authenticateToken, (req: any, res) => {
  const db = getDatabase();
  const userId = req.user.userId;
  const { content } = req.body;

  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be a string' });
  }

  // Use INSERT OR REPLACE to handle both create and update
  db.run(
    `INSERT INTO personal_notes (user_id, content, updated_at) 
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) 
     DO UPDATE SET content = ?, updated_at = CURRENT_TIMESTAMP`,
    [userId, content, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        content,
        updated_at: new Date().toISOString()
      });
    }
  );
});

export default router;
