-- UP --
ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on id for existing tasks
UPDATE tasks SET sort_order = id;

-- DOWN --
ALTER TABLE tasks DROP COLUMN sort_order;