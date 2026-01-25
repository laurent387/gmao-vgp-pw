import { getDatabase } from '@/db/database';
import { NonConformity, CorrectiveAction, NCStatus, ActionStatus, SeverityLevel } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';
import { webApiService } from '@/services/WebApiService';

export interface NCFilters {
  status?: NCStatus;
  assetId?: string;
  severity?: SeverityLevel;
}

export class NCRepository extends BaseRepository<NonConformity> {
  constructor() {
    super('nonconformities');
  }

  async getAllWithDetails(filters?: NCFilters): Promise<NonConformity[]> {
    if (Platform.OS === 'web') {
      return webApiService.getNonConformities(filters);
    }
    
    const db = await getDatabase();
    
    let query = `
      SELECT 
        nc.*,
        a.code_interne as asset_code,
        a.designation as asset_designation,
        ca.id as action_id,
        ca.status as action_status,
        ca.due_at as action_due_at
      FROM nonconformities nc
      LEFT JOIN assets a ON nc.asset_id = a.id
      LEFT JOIN corrective_actions ca ON nc.id = ca.nonconformity_id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters?.status) {
      conditions.push('nc.status = ?');
      params.push(filters.status);
    }
    
    if (filters?.assetId) {
      conditions.push('nc.asset_id = ?');
      params.push(filters.assetId);
    }
    
    if (filters?.severity) {
      conditions.push('nc.severity = ?');
      params.push(filters.severity);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY nc.created_at DESC';
    
    return db.getAllAsync<NonConformity>(query, params);
  }

  async getByIdWithAction(id: string): Promise<NonConformity | null> {
    if (Platform.OS === 'web') {
      return webApiService.getNCById(id);
    }
    
    const db = await getDatabase();
    
    const nc = await db.getFirstAsync<NonConformity>(`
      SELECT nc.*, a.code_interne as asset_code, a.designation as asset_designation
      FROM nonconformities nc
      LEFT JOIN assets a ON nc.asset_id = a.id
      WHERE nc.id = ?
    `, [id]);
    
    if (!nc) return null;
    
    const action = await db.getFirstAsync<CorrectiveAction>(
      'SELECT * FROM corrective_actions WHERE nonconformity_id = ?',
      [id]
    );
    
    return { ...nc, corrective_action: action ?? undefined };
  }

  async getByAssetId(assetId: string): Promise<NonConformity[]> {
    if (Platform.OS === 'web') {
      return webApiService.getNonConformities({ assetId });
    }
    
    const db = await getDatabase();
    return db.getAllAsync<NonConformity>(`
      SELECT nc.*, ca.status as action_status
      FROM nonconformities nc
      LEFT JOIN corrective_actions ca ON nc.id = ca.nonconformity_id
      WHERE nc.asset_id = ?
      ORDER BY nc.created_at DESC
    `, [assetId]);
  }

  async create(nc: Omit<NonConformity, 'id' | 'created_at'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(`
      INSERT INTO nonconformities (id, report_id, asset_id, checklist_item_id, title, description, severity, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, nc.report_id, nc.asset_id, nc.checklist_item_id, nc.title, nc.description, nc.severity, nc.status, now]);
    
    return id;
  }

  async updateStatus(id: string, status: NCStatus): Promise<void> {
    if (Platform.OS === 'web') {
      await webApiService.updateNCStatus(id, status);
      return;
    }
    
    const db = await getDatabase();
    await db.runAsync('UPDATE nonconformities SET status = ? WHERE id = ?', [status, id]);
  }

  async getByStatus(status: NCStatus): Promise<NonConformity[]> {
    if (Platform.OS === 'web') {
      return webApiService.getNonConformities({ status });
    }
    
    const db = await getDatabase();
    return db.getAllAsync<NonConformity>(
      `SELECT nc.*, a.code_interne as asset_code, a.designation as asset_designation
       FROM nonconformities nc
       LEFT JOIN assets a ON nc.asset_id = a.id
       WHERE nc.status = ?
       ORDER BY nc.created_at DESC`,
      [status]
    );
  }

  async update(id: string, data: Partial<NonConformity>): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.severity !== undefined) {
      fields.push('severity = ?');
      values.push(data.severity);
    }
    
    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(`UPDATE nonconformities SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  }

  async getOpenCount(): Promise<number> {
    if (Platform.OS === 'web') {
      const ncs = await webApiService.getNonConformities();
      return ncs.filter(nc => nc.status !== 'CLOTUREE').length;
    }
    
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM nonconformities WHERE status != 'CLOTUREE'"
    );
    return result?.count ?? 0;
  }
}

export class ActionRepository extends BaseRepository<CorrectiveAction> {
  constructor() {
    super('corrective_actions');
  }

  async create(action: Omit<CorrectiveAction, 'id'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    
    await db.runAsync(`
      INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status, closed_at, validated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, action.nonconformity_id, action.owner, action.description ?? null, action.due_at, action.status, action.closed_at ?? null, action.validated_by ?? null]);
    
    return id;
  }

  async updateStatus(id: string, status: ActionStatus, validatedBy?: string): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    const closedAt = status === 'CLOTUREE' || status === 'VALIDEE' ? this.formatDate(new Date()) : null;
    
    await db.runAsync(
      'UPDATE corrective_actions SET status = ?, closed_at = ?, validated_by = ? WHERE id = ?',
      [status, closedAt, validatedBy ?? null, id]
    );
  }

  async getOverdueCount(): Promise<number> {
    if (Platform.OS === 'web') {
      return 0;
    }
    
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM corrective_actions 
      WHERE status IN ('OUVERTE', 'EN_COURS') AND due_at < datetime('now')
    `);
    return result?.count ?? 0;
  }

  async getByStatus(status: ActionStatus): Promise<CorrectiveAction[]> {
    if (Platform.OS === 'web') {
      return [];
    }
    
    const db = await getDatabase();
    return db.getAllAsync<CorrectiveAction>(
      'SELECT * FROM corrective_actions WHERE status = ? ORDER BY due_at ASC',
      [status]
    );
  }

  async update(id: string, data: Partial<CorrectiveAction>): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.owner !== undefined) {
      fields.push('owner = ?');
      values.push(data.owner);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.due_at !== undefined) {
      fields.push('due_at = ?');
      values.push(data.due_at);
    }
    if (data.closed_at !== undefined) {
      fields.push('closed_at = ?');
      values.push(data.closed_at);
    }
    if (data.validated_by !== undefined) {
      fields.push('validated_by = ?');
      values.push(data.validated_by);
    }
    
    if (fields.length > 0) {
      values.push(id);
      await db.runAsync(`UPDATE corrective_actions SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  }
}

export const ncRepository = new NCRepository();
export const actionRepository = new ActionRepository();
