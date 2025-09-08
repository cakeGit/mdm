-- Add mini-notes functionality to tasks
CREATE TABLE task_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- Add pinned flag to tasks for Pomodoro integration
ALTER TABLE tasks ADD COLUMN is_pinned BOOLEAN DEFAULT 0;

-- Add notes column to tasks for quick notes
ALTER TABLE tasks ADD COLUMN notes TEXT;