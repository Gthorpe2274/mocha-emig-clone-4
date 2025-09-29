
-- Add retention tracking columns to assessments table
ALTER TABLE assessments ADD COLUMN retention_expires_at DATETIME;

-- Set retention expiry date for existing assessments (2 years from creation)
UPDATE assessments 
SET retention_expires_at = datetime(created_at, '+2 years')
WHERE retention_expires_at IS NULL;

-- Add trigger to automatically set retention expiry for new assessments
CREATE TRIGGER set_assessment_retention_expiry 
AFTER INSERT ON assessments
BEGIN
  UPDATE assessments 
  SET retention_expires_at = datetime(NEW.created_at, '+2 years')
  WHERE id = NEW.id;
END;
