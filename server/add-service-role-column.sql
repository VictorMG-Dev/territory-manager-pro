-- Add service_role column to users table
-- This column stores the field service role (publisher, auxiliary_pioneer, regular_pioneer)

-- Create ENUM type for service roles
CREATE TYPE service_role_type AS ENUM ('publisher', 'auxiliary_pioneer', 'regular_pioneer');

-- Add service_role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS service_role service_role_type DEFAULT 'publisher';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_service_role ON users(service_role);
