-- Migration: Update job status CHECK constraint for new lifecycle statuses
-- Old values: pending, scheduled, in_progress, completed, cancelled
-- New values: pending, scheduled, en_route, picked_up, dumping, completed, cancelled
-- Replaces 'in_progress' with 'en_route' and adds 'picked_up', 'dumping'

-- Step 1: Drop the old constraint FIRST
ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_status_check";

-- Step 2: Migrate any existing 'in_progress' rows to 'en_route'
UPDATE "jobs" SET "status" = 'en_route' WHERE "status" = 'in_progress';

-- Step 3: Add updated constraint with new lifecycle statuses
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_status_check"
  CHECK ("status" IN ('pending', 'scheduled', 'en_route', 'picked_up', 'dumping', 'completed', 'cancelled'));
