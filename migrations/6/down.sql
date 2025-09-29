
-- Remove the trigger
DROP TRIGGER IF EXISTS set_assessment_retention_expiry;

-- Remove the retention tracking column
ALTER TABLE assessments DROP COLUMN retention_expires_at;
