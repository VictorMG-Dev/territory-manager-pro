-- Territory Manager - Service Reports Schema
-- Execute this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS service_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    hours INTEGER DEFAULT 0,
    minutes INTEGER DEFAULT 0,
    bible_studies INTEGER DEFAULT 0,
    participated BOOLEAN DEFAULT FALSE,
    is_campaign BOOLEAN DEFAULT FALSE,
    daily_records JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE service_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own reports"
    ON service_reports FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own reports"
    ON service_reports FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own reports"
    ON service_reports FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own reports"
    ON service_reports FOR DELETE
    USING (auth.uid()::text = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_service_reports_user_month ON service_reports(user_id, month);
