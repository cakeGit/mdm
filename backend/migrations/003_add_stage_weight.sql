-- Add weight field to stages for fixed-length progress tracking
ALTER TABLE stages ADD COLUMN weight INTEGER DEFAULT 1;