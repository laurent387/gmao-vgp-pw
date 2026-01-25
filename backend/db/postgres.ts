import { Pool } from "pg";

let pool: Pool | null = null;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getPgPool(): Pool {
  if (pool) return pool;

  const host = requireEnv(process.env.DATABASE_HOST, "DATABASE_HOST");
  const port = Number(requireEnv(process.env.DATABASE_PORT, "DATABASE_PORT"));
  const database = requireEnv(process.env.DATABASE_NAME, "DATABASE_NAME");
  const user = requireEnv(process.env.DATABASE_USER, "DATABASE_USER");
  const password = requireEnv(process.env.DATABASE_PASSWORD, "DATABASE_PASSWORD");

  const sslEnv = process.env.DATABASE_SSL;
  const ssl = sslEnv ? sslEnv.toLowerCase() === "true" : undefined;

  pool = new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: ssl ? ({ rejectUnauthorized: false } as const) : undefined,
    max: 5,
  });

  console.log("[PG] Pool created", { host, port, database, user, ssl: Boolean(ssl) });

  return pool;
}

export async function pgQuery<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const p = getPgPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

export async function ensurePgSchema(): Promise<void> {
  const p = getPgPool();

  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      token_mock TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      code_interne TEXT UNIQUE NOT NULL,
      designation TEXT NOT NULL,
      categorie TEXT NOT NULL,
      marque TEXT,
      modele TEXT,
      numero_serie TEXT,
      annee INTEGER,
      statut TEXT NOT NULL DEFAULT 'EN_SERVICE',
      criticite INTEGER NOT NULL DEFAULT 3,
      site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
      zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE RESTRICT,
      mise_en_service TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS control_types (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      periodicity_days INTEGER NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS asset_controls (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      control_type_id TEXT NOT NULL REFERENCES control_types(id) ON DELETE RESTRICT,
      start_date TIMESTAMPTZ NOT NULL,
      last_done_at TIMESTAMPTZ,
      next_due_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS checklist_templates (
      id TEXT PRIMARY KEY,
      control_type_id TEXT NOT NULL REFERENCES control_types(id) ON DELETE CASCADE,
      asset_category TEXT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      field_type TEXT NOT NULL DEFAULT 'BOOL',
      required BOOLEAN NOT NULL DEFAULT TRUE,
      help_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      control_type_id TEXT NOT NULL REFERENCES control_types(id) ON DELETE RESTRICT,
      scheduled_at TIMESTAMPTZ NOT NULL,
      assigned_to TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'A_PLANIFIER',
      site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mission_assets (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
      performed_at TIMESTAMPTZ NOT NULL,
      performer TEXT NOT NULL,
      conclusion TEXT NOT NULL,
      summary TEXT,
      signed_by_name TEXT,
      signed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_item_results (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
      checklist_item_id TEXT NOT NULL REFERENCES checklist_items(id) ON DELETE RESTRICT,
      status TEXT NOT NULL,
      value_num DOUBLE PRECISION,
      value_text TEXT,
      comment TEXT
    );

    CREATE TABLE IF NOT EXISTS nonconformities (
      id TEXT PRIMARY KEY,
      report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
      checklist_item_id TEXT REFERENCES checklist_items(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'OUVERTE',
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS corrective_actions (
      id TEXT PRIMARY KEY,
      nonconformity_id TEXT NOT NULL REFERENCES nonconformities(id) ON DELETE CASCADE,
      owner TEXT NOT NULL,
      description TEXT,
      due_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'OUVERTE',
      closed_at TIMESTAMPTZ,
      validated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      date TIMESTAMPTZ NOT NULL,
      actor TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      description TEXT NOT NULL,
      parts_ref TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      mime TEXT NOT NULL,
      sha256 TEXT,
      uploaded_at TIMESTAMPTZ NOT NULL,
      synced BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      last_error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_assets_site ON assets(site_id);
    CREATE INDEX IF NOT EXISTS idx_assets_categorie ON assets(categorie);
    CREATE INDEX IF NOT EXISTS idx_asset_controls_due ON asset_controls(next_due_at);
    CREATE INDEX IF NOT EXISTS idx_reports_performed ON reports(performed_at);
    CREATE INDEX IF NOT EXISTS idx_actions_due ON corrective_actions(due_at, status);
    CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
  `;

  console.log("[PG] Ensuring schema...");
  await p.query(schemaSql);
  console.log("[PG] Schema ready");
}
