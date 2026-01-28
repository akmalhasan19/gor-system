-- Migration: Maintenance System
-- Creates maintenance_tasks table for tracking court maintenance

-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    task_date DATE NOT NULL,
    start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
    duration_hours INTEGER NOT NULL DEFAULT 1 CHECK (duration_hours >= 1 AND duration_hours <= 12),
    maintenance_type TEXT NOT NULL DEFAULT 'other',
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    technician_name TEXT,
    cost DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_maintenance_tasks_venue_date ON maintenance_tasks(venue_id, task_date);
CREATE INDEX idx_maintenance_tasks_court_date ON maintenance_tasks(court_id, task_date);
CREATE INDEX idx_maintenance_tasks_status ON maintenance_tasks(status);

-- Enable RLS
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access maintenance tasks for venues they belong to
CREATE POLICY "Users can view maintenance tasks for their venues"
    ON maintenance_tasks FOR SELECT
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert maintenance tasks for their venues"
    ON maintenance_tasks FOR INSERT
    WITH CHECK (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update maintenance tasks for their venues"
    ON maintenance_tasks FOR UPDATE
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete maintenance tasks for their venues"
    ON maintenance_tasks FOR DELETE
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_maintenance_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintenance_tasks_updated_at
    BEFORE UPDATE ON maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_tasks_updated_at();

-- Add comment
COMMENT ON TABLE maintenance_tasks IS 'Stores individual maintenance events for courts';
