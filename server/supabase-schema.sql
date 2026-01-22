-- Territory Manager - Supabase PostgreSQL Schema
-- Execute this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('publisher', 'territory_servant', 'service_overseer', 'elder');
CREATE TYPE territory_status AS ENUM ('green', 'yellow', 'red');
CREATE TYPE territory_size AS ENUM ('small', 'medium', 'large');

-- Congregations Table
CREATE TABLE IF NOT EXISTS congregations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    invite_code VARCHAR(8) UNIQUE NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    photo_url TEXT,
    congregation_id UUID REFERENCES congregations(id) ON DELETE SET NULL,
    role user_role DEFAULT 'publisher',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Territories Table
CREATE TABLE IF NOT EXISTS territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(uid) ON DELETE SET NULL,
    congregation_id UUID REFERENCES congregations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    observations TEXT,
    status territory_status DEFAULT 'green',
    size territory_size DEFAULT 'medium',
    last_worked_date TIMESTAMPTZ,
    last_worked_by VARCHAR(255),
    days_since_work INTEGER DEFAULT 0,
    geolocation JSONB,
    images JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Records Table
CREATE TABLE IF NOT EXISTS work_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    territory_id UUID REFERENCES territories(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    publisher_name VARCHAR(255),
    notes TEXT,
    photos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Territory Groups Table
CREATE TABLE IF NOT EXISTS territory_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    congregation_id UUID REFERENCES congregations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    territory_ids JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Plans Table
CREATE TABLE IF NOT EXISTS weekly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES territory_groups(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    days JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_congregation ON users(congregation_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_territories_congregation ON territories(congregation_id);
CREATE INDEX IF NOT EXISTS idx_territories_user ON territories(user_id);
CREATE INDEX IF NOT EXISTS idx_work_records_territory ON work_records(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_groups_congregation ON territory_groups(congregation_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_group ON weekly_plans(group_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to territories table
CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON territories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional but recommended
-- ALTER TABLE congregations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE territory_groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies can be added later based on your security requirements
