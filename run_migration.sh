#!/bin/bash
set -e

PGPASSWORD=inspectravgp2025 psql -U api_user -d in_spectra -h localhost --pset=pager=off <<'EOF'
-- Migration: Create attachments table

CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(50) PRIMARY KEY,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('EQUIPMENT', 'REPORT', 'VGP_REPORT', 'VGP_RUN')),
  owner_id VARCHAR(100) NOT NULL,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('PDF', 'IMAGE')),
  category VARCHAR(30) NOT NULL CHECK (category IN ('DOCUMENTATION', 'CERTIFICAT_LEGAL', 'RAPPORT', 'PLAQUE_IDENTIFICATION', 'PHOTO', 'AUTRE')),
  title VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  is_private BOOLEAN DEFAULT false,
  checksum VARCHAR(64),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED')),
  version_number INTEGER DEFAULT 1,
  parent_id VARCHAR(50) REFERENCES attachments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(50),
  archived_at TIMESTAMPTZ,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_attachments_status ON attachments(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_attachments_category ON attachments(category);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_storage_key ON attachments(storage_key);

SELECT 'Attachments table created successfully' as result;
EOF

echo "Migration completed!"
