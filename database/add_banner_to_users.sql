-- Add banner column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner TEXT;
