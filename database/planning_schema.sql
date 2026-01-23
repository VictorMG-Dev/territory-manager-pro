-- Monthly Plans Table
CREATE TABLE IF NOT EXISTS monthly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  target_hours DECIMAL(5,2) NOT NULL,
  total_planned_hours DECIMAL(5,2) DEFAULT 0,
  projected_completion DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Weekly Schedules Table
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES monthly_plans(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 5),
  days JSONB NOT NULL DEFAULT '{}',
  total_planned_hours DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month, week_number)
);

-- Plan Templates Table (for saved templates)
CREATE TABLE IF NOT EXISTS plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  service_role VARCHAR(50),
  target_hours DECIMAL(5,2),
  distribution JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_plans_user_month ON monthly_plans(user_id, month);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_user_month ON weekly_schedules(user_id, month);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_plan ON weekly_schedules(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_templates_user ON plan_templates(user_id);

-- Row Level Security Policies
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;

-- Monthly Plans Policies
CREATE POLICY "Users can view their own monthly plans"
  ON monthly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly plans"
  ON monthly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly plans"
  ON monthly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly plans"
  ON monthly_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly Schedules Policies
CREATE POLICY "Users can view their own weekly schedules"
  ON weekly_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly schedules"
  ON weekly_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly schedules"
  ON weekly_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly schedules"
  ON weekly_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Plan Templates Policies
CREATE POLICY "Users can view their own templates and public templates"
  ON plan_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own templates"
  ON plan_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON plan_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON plan_templates FOR DELETE
  USING (auth.uid() = user_id);
