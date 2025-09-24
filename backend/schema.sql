-- User authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Main project container
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    status TEXT DEFAULT 'active', -- 'active', 'on-hold', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Hierarchical Stages (e.g., "Core Mod", "Features/Cool Mob")
CREATE TABLE stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    parent_stage_id INTEGER, -- Enables nested substages. NULL for top-level.
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    weight INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_stage_id) REFERENCES stages (id) ON DELETE CASCADE
);

-- Individual actionable tasks
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- 'todo', 'in-progress', 'completed'
    priority INTEGER DEFAULT 2, -- 1 (High), 2 (Medium), 3 (Low)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (stage_id) REFERENCES stages (id) ON DELETE CASCADE
);

-- Pomodoro work sessions
CREATE TABLE work_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- Duration in seconds (e.g., 1500 for 25 min)
    started_at DATETIME NOT NULL,
    notes TEXT, -- Notes about what was accomplished
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);