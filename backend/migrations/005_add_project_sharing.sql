-- UP --
-- Project sharing between users
CREATE TABLE project_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    shared_with_user_id INTEGER NOT NULL,
    permission TEXT NOT NULL CHECK(permission IN ('read', 'readwrite')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(project_id, shared_with_user_id)
);

-- Anonymous read-only share tokens
CREATE TABLE project_share_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INTEGER NOT NULL,
    expires_at DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- DOWN --
DROP TABLE IF EXISTS project_shares;
DROP TABLE IF EXISTS project_share_tokens;
