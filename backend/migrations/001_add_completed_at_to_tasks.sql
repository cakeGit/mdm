-- UP --
-- Add completed_at column to tasks table if it doesn't exist
-- This is safe to run multiple times
PRAGMA table_info(tasks);

-- Update existing completed tasks to have a completed_at timestamp
UPDATE tasks SET completed_at = CURRENT_TIMESTAMP WHERE status = 'completed' AND completed_at IS NULL;

-- DOWN --
-- This migration is safe and doesn't need rollback since the column may have existed before