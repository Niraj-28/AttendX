-- Migration: 002_add_stream_column
-- Description: Add stream column to students table
-- Date: 2026-09-17

USE attendx;

-- Add stream column if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS stream VARCHAR(100) AFTER phone,
ADD INDEX IF NOT EXISTS idx_stream (stream);

-- Update existing records with NULL stream values
-- This can be updated manually later based on actual data

SELECT '✓ Migration 002 completed successfully - stream column added' as Status;
