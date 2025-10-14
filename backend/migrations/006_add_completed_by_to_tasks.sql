-- UP --
ALTER TABLE tasks ADD COLUMN completed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- DOWN --
ALTER TABLE tasks DROP COLUMN completed_by_user_id;
