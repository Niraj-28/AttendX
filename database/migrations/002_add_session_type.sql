-- Migration: Add session_type column to sessions table
-- Date: 2026-09-26
-- Description: Add session_type field to differentiate between lecture, lab, and tutorial sessions

ALTER TABLE sessions 
ADD COLUMN session_type ENUM('lecture', 'lab', 'tutorial') DEFAULT 'lecture' 
AFTER session_date;

-- Update existing records to have default session_type
UPDATE sessions SET session_type = 'lecture' WHERE session_type IS NULL;
