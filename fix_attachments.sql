-- Fix attachments table for NC uploads
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_owner_type_check;
ALTER TABLE attachments ADD CONSTRAINT attachments_owner_type_check CHECK (owner_type IN ('EQUIPMENT', 'REPORT', 'VGP_REPORT', 'VGP_RUN', 'NONCONFORMITY', 'MISSION'));

-- Make created_by nullable for API uploads
ALTER TABLE attachments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE attachments ALTER COLUMN original_file_name DROP NOT NULL;
