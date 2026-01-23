-- Add submission tracking columns to service_reports
ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Ensure users can be joined by the backend (already exists but for clarity)
-- CREATE INDEX IF NOT EXISTS idx_service_reports_submitted ON service_reports(submitted);
