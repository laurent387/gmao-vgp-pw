// VGP Presses Schema - Tables additionnelles pour la gestion des VGP
import { getPgPool } from "./postgres";

export async function ensureVGPSchema(): Promise<void> {
  const p = getPgPool();

  const vgpSchemaSql = `
    -- =============================================
    -- VGP TEMPLATES & ITEMS (fiches types versionnées)
    -- =============================================
    
    CREATE TABLE IF NOT EXISTS vgp_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      machine_type TEXT NOT NULL DEFAULT 'PRESS',
      version INTEGER NOT NULL DEFAULT 1,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      referentiel TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vgp_template_sections (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL REFERENCES vgp_templates(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS vgp_template_items (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES vgp_template_sections(id) ON DELETE CASCADE,
      numero INTEGER NOT NULL,
      label TEXT NOT NULL,
      help_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE INDEX IF NOT EXISTS idx_vgp_template_items_section ON vgp_template_items(section_id);

    -- =============================================
    -- VGP REPORTS (regroupement multi-machines)
    -- =============================================
    
    CREATE TABLE IF NOT EXISTS vgp_reports (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
      numero_rapport TEXT UNIQUE NOT NULL,
      date_rapport TIMESTAMPTZ NOT NULL,
      signataire TEXT NOT NULL,
      synthese TEXT,
      has_observations BOOLEAN NOT NULL DEFAULT FALSE,
      pdf_path TEXT,
      pdf_url TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vgp_reports_client ON vgp_reports(client_id);
    CREATE INDEX IF NOT EXISTS idx_vgp_reports_date ON vgp_reports(date_rapport);

    -- =============================================
    -- VGP INSPECTION RUNS (une fiche par machine)
    -- =============================================
    
    CREATE TABLE IF NOT EXISTS vgp_inspection_runs (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL REFERENCES vgp_reports(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL REFERENCES vgp_templates(id) ON DELETE RESTRICT,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
      date_inspection TIMESTAMPTZ NOT NULL,
      verificateur TEXT NOT NULL,
      compteur_type TEXT,
      compteur_valeur INTEGER,
      conditions_intervention TEXT,
      modes_fonctionnement TEXT,
      moyens_disposition BOOLEAN DEFAULT TRUE,
      conclusion TEXT NOT NULL DEFAULT 'EN_COURS',
      particularites TEXT,
      statut TEXT NOT NULL DEFAULT 'BROUILLON',
      signed_by TEXT,
      signed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vgp_runs_report ON vgp_inspection_runs(report_id);
    CREATE INDEX IF NOT EXISTS idx_vgp_runs_asset ON vgp_inspection_runs(asset_id);
    CREATE INDEX IF NOT EXISTS idx_vgp_runs_statut ON vgp_inspection_runs(statut);

    -- =============================================
    -- VGP ITEM RESULTS (résultats par item)
    -- =============================================
    
    CREATE TABLE IF NOT EXISTS vgp_item_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES vgp_inspection_runs(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL REFERENCES vgp_template_items(id) ON DELETE RESTRICT,
      result TEXT NOT NULL DEFAULT 'NA',
      comment TEXT,
      photos JSONB,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      UNIQUE(run_id, item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_vgp_results_run ON vgp_item_results(run_id);
    CREATE INDEX IF NOT EXISTS idx_vgp_results_item ON vgp_item_results(item_id);

    -- =============================================
    -- VGP OBSERVATIONS (non-conformités VGP)
    -- =============================================
    
    CREATE TABLE IF NOT EXISTS vgp_observations (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES vgp_inspection_runs(id) ON DELETE CASCADE,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
      item_id TEXT REFERENCES vgp_template_items(id) ON DELETE SET NULL,
      item_numero INTEGER,
      description TEXT NOT NULL,
      recommandation TEXT,
      gravite INTEGER DEFAULT 3,
      statut TEXT NOT NULL DEFAULT 'OUVERTE',
      is_auto BOOLEAN NOT NULL DEFAULT FALSE,
      pieces_jointes JSONB,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vgp_observations_run ON vgp_observations(run_id);
    CREATE INDEX IF NOT EXISTS idx_vgp_observations_asset ON vgp_observations(asset_id);
    CREATE INDEX IF NOT EXISTS idx_vgp_observations_statut ON vgp_observations(statut);

    -- =============================================
    -- Extend assets table for VGP-specific fields
    -- =============================================
    
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'force_nominale'
      ) THEN
        ALTER TABLE assets ADD COLUMN force_nominale TEXT;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'compteur_type'
      ) THEN
        ALTER TABLE assets ADD COLUMN compteur_type TEXT;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'compteur_valeur'
      ) THEN
        ALTER TABLE assets ADD COLUMN compteur_valeur INTEGER;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'caracteristiques'
      ) THEN
        ALTER TABLE assets ADD COLUMN caracteristiques JSONB;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'dispositifs_protection'
      ) THEN
        ALTER TABLE assets ADD COLUMN dispositifs_protection JSONB;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'vgp_enabled'
      ) THEN
        ALTER TABLE assets ADD COLUMN vgp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'vgp_validity_months'
      ) THEN
        ALTER TABLE assets ADD COLUMN vgp_validity_months INTEGER;
      END IF;
    END $$;
  `;

  console.log("[PG] Ensuring VGP schema...");
  await p.query(vgpSchemaSql);
  console.log("[PG] VGP Schema ready");
}
