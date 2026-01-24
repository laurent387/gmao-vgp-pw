import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  
  if (Platform.OS === 'web') {
    console.log('[DB] Web platform - using mock database');
    return createMockDatabase();
  }
  
  db = await SQLite.openDatabaseAsync('inspectra.db');
  console.log('[DB] Database opened successfully');
  return db;
}

function createMockDatabase(): SQLite.SQLiteDatabase {
  const mockDb = {
    execAsync: async (sql: string) => {
      console.log('[MockDB] execAsync:', sql.substring(0, 100));
    },
    runAsync: async (sql: string, params?: any[]) => {
      console.log('[MockDB] runAsync:', sql.substring(0, 100), params);
      return { lastInsertRowId: 1, changes: 1 };
    },
    getFirstAsync: async <T>(sql: string, params?: any[]): Promise<T | null> => {
      console.log('[MockDB] getFirstAsync:', sql.substring(0, 100), params);
      return null;
    },
    getAllAsync: async <T>(sql: string, params?: any[]): Promise<T[]> => {
      console.log('[MockDB] getAllAsync:', sql.substring(0, 100), params);
      return [];
    },
  } as unknown as SQLite.SQLiteDatabase;
  
  db = mockDb;
  return mockDb;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();
  
  if (Platform.OS === 'web') {
    console.log('[DB] Skipping schema creation on web');
    return;
  }
  
  console.log('[DB] Creating tables...');
  
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      token_mock TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (site_id) REFERENCES sites(id)
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
      site_id TEXT NOT NULL,
      zone_id TEXT NOT NULL,
      mise_en_service TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      FOREIGN KEY (zone_id) REFERENCES zones(id)
    );

    CREATE TABLE IF NOT EXISTS control_types (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      periodicity_days INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS asset_controls (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      control_type_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      last_done_at TEXT,
      next_due_at TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (control_type_id) REFERENCES control_types(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_templates (
      id TEXT PRIMARY KEY,
      control_type_id TEXT NOT NULL,
      asset_category TEXT,
      name TEXT NOT NULL,
      FOREIGN KEY (control_type_id) REFERENCES control_types(id)
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      label TEXT NOT NULL,
      field_type TEXT NOT NULL DEFAULT 'BOOL',
      required INTEGER NOT NULL DEFAULT 1,
      help_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (template_id) REFERENCES checklist_templates(id)
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      control_type_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'A_PLANIFIER',
      site_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (control_type_id) REFERENCES control_types(id),
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS mission_assets (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      performed_at TEXT NOT NULL,
      performer TEXT NOT NULL,
      conclusion TEXT NOT NULL,
      summary TEXT,
      signed_by_name TEXT,
      signed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS report_item_results (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL,
      checklist_item_id TEXT NOT NULL,
      status TEXT NOT NULL,
      value_num REAL,
      value_text TEXT,
      comment TEXT,
      FOREIGN KEY (report_id) REFERENCES reports(id),
      FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id)
    );

    CREATE TABLE IF NOT EXISTS nonconformities (
      id TEXT PRIMARY KEY,
      report_id TEXT,
      asset_id TEXT NOT NULL,
      checklist_item_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      severity INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'OUVERTE',
      created_at TEXT NOT NULL,
      FOREIGN KEY (report_id) REFERENCES reports(id),
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS corrective_actions (
      id TEXT PRIMARY KEY,
      nonconformity_id TEXT NOT NULL,
      owner TEXT NOT NULL,
      description TEXT,
      due_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OUVERTE',
      closed_at TEXT,
      validated_by TEXT,
      FOREIGN KEY (nonconformity_id) REFERENCES nonconformities(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      date TEXT NOT NULL,
      actor TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      description TEXT NOT NULL,
      parts_ref TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      mime TEXT NOT NULL,
      sha256 TEXT,
      uploaded_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      last_error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_assets_site ON assets(site_id);
    CREATE INDEX IF NOT EXISTS idx_assets_categorie ON assets(categorie);
    CREATE INDEX IF NOT EXISTS idx_asset_controls_due ON asset_controls(next_due_at);
    CREATE INDEX IF NOT EXISTS idx_reports_performed ON reports(performed_at);
    CREATE INDEX IF NOT EXISTS idx_actions_due ON corrective_actions(due_at, status);
    CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
  `);
  
  console.log('[DB] Tables created successfully');
}

export async function clearDatabase(): Promise<void> {
  const database = await getDatabase();
  
  if (Platform.OS === 'web') return;
  
  await database.execAsync(`
    DELETE FROM outbox;
    DELETE FROM documents;
    DELETE FROM maintenance_logs;
    DELETE FROM corrective_actions;
    DELETE FROM nonconformities;
    DELETE FROM report_item_results;
    DELETE FROM reports;
    DELETE FROM mission_assets;
    DELETE FROM missions;
    DELETE FROM checklist_items;
    DELETE FROM checklist_templates;
    DELETE FROM asset_controls;
    DELETE FROM control_types;
    DELETE FROM assets;
    DELETE FROM zones;
    DELETE FROM sites;
    DELETE FROM users;
  `);
  
  console.log('[DB] Database cleared');
}
