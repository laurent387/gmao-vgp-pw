import { getDatabase } from '@/db/database';
import { ControlType, AssetControl, ChecklistTemplate, ChecklistItem, DueEcheance } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';

export class ControlTypeRepository extends BaseRepository<ControlType> {
  constructor() {
    super('control_types');
  }

  async getActive(): Promise<ControlType[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<ControlType>('SELECT * FROM control_types WHERE active = 1 ORDER BY label');
  }
}

export class AssetControlRepository extends BaseRepository<AssetControl> {
  constructor() {
    super('asset_controls');
  }

  async getByAssetId(assetId: string): Promise<AssetControl[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<AssetControl>(`
      SELECT ac.*, ct.code, ct.label, ct.periodicity_days
      FROM asset_controls ac
      LEFT JOIN control_types ct ON ac.control_type_id = ct.id
      WHERE ac.asset_id = ?
      ORDER BY ac.next_due_at
    `, [assetId]);
  }

  async getDueEcheances(filters?: { siteId?: string; overdue?: boolean; dueSoon?: number }): Promise<DueEcheance[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    
    let query = `
      SELECT 
        ac.id,
        ac.asset_id,
        a.code_interne as asset_code,
        a.designation as asset_designation,
        ct.label as control_type_label,
        ac.next_due_at,
        CAST(julianday(ac.next_due_at) - julianday('now') AS INTEGER) as days_remaining,
        CASE WHEN ac.next_due_at < datetime('now') THEN 1 ELSE 0 END as is_overdue,
        s.name as site_name
      FROM asset_controls ac
      INNER JOIN assets a ON ac.asset_id = a.id
      INNER JOIN control_types ct ON ac.control_type_id = ct.id
      INNER JOIN sites s ON a.site_id = s.id
      WHERE ac.next_due_at IS NOT NULL
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters?.siteId) {
      conditions.push('a.site_id = ?');
      params.push(filters.siteId);
    }
    
    if (filters?.overdue) {
      conditions.push("ac.next_due_at < datetime('now')");
    } else if (filters?.dueSoon) {
      conditions.push(`ac.next_due_at <= datetime('now', '+${filters.dueSoon} days')`);
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY ac.next_due_at ASC';
    
    const results = await db.getAllAsync<Omit<DueEcheance, 'is_overdue'> & { is_overdue: number }>(query, params);
    return results.map(r => ({ ...r, is_overdue: r.is_overdue === 1 }) as DueEcheance);
  }

  async updateLastDone(assetId: string, controlTypeId: string, doneDate: Date, periodicityDays: number): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    const nextDue = new Date(doneDate);
    nextDue.setDate(nextDue.getDate() + periodicityDays);
    
    await db.runAsync(`
      UPDATE asset_controls 
      SET last_done_at = ?, next_due_at = ?
      WHERE asset_id = ? AND control_type_id = ?
    `, [doneDate.toISOString(), nextDue.toISOString(), assetId, controlTypeId]);
  }

  async create(assetControl: Omit<AssetControl, 'id'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    
    await db.runAsync(`
      INSERT INTO asset_controls (id, asset_id, control_type_id, start_date, last_done_at, next_due_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, assetControl.asset_id, assetControl.control_type_id, assetControl.start_date, assetControl.last_done_at, assetControl.next_due_at]);
    
    return id;
  }
}

export class ChecklistTemplateRepository extends BaseRepository<ChecklistTemplate> {
  constructor() {
    super('checklist_templates');
  }

  async getByControlType(controlTypeId: string, assetCategory?: string): Promise<ChecklistTemplate | null> {
    if (Platform.OS === 'web') return null;
    
    const db = await getDatabase();
    
    let template = await db.getFirstAsync<ChecklistTemplate>(
      'SELECT * FROM checklist_templates WHERE control_type_id = ? AND asset_category = ?',
      [controlTypeId, assetCategory ?? null]
    );
    
    if (!template && assetCategory) {
      template = await db.getFirstAsync<ChecklistTemplate>(
        'SELECT * FROM checklist_templates WHERE control_type_id = ? AND asset_category IS NULL',
        [controlTypeId]
      );
    }
    
    return template;
  }
}

export class ChecklistItemRepository extends BaseRepository<ChecklistItem> {
  constructor() {
    super('checklist_items');
  }

  async getByTemplateId(templateId: string): Promise<ChecklistItem[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<ChecklistItem>(
      'SELECT * FROM checklist_items WHERE template_id = ? ORDER BY sort_order',
      [templateId]
    );
  }
}

export const controlTypeRepository = new ControlTypeRepository();
export const assetControlRepository = new AssetControlRepository();
export const checklistTemplateRepository = new ChecklistTemplateRepository();
export const checklistItemRepository = new ChecklistItemRepository();
