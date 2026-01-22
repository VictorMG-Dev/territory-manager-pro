-- Fix RLS (Row Level Security) for Territory Manager
-- Execute this in the Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE congregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE territory_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for service_role (backend API)
-- This allows the backend to perform all operations

-- Congregations policies
CREATE POLICY "Service role can do everything on congregations"
ON congregations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users policies
CREATE POLICY "Service role can do everything on users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Territories policies
CREATE POLICY "Service role can do everything on territories"
ON territories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Work records policies
CREATE POLICY "Service role can do everything on work_records"
ON work_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Territory groups policies
CREATE POLICY "Service role can do everything on territory_groups"
ON territory_groups
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Weekly plans policies
CREATE POLICY "Service role can do everything on weekly_plans"
ON weekly_plans
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Optional: Add policies for authenticated users (anon key)
-- Uncomment if you want to allow direct client access

-- CREATE POLICY "Users can read their own data"
-- ON users
-- FOR SELECT
-- TO authenticated
-- USING (auth.uid()::text = uid::text);

-- CREATE POLICY "Users can update their own data"
-- ON users
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid()::text = uid::text)
-- WITH CHECK (auth.uid()::text = uid::text);
