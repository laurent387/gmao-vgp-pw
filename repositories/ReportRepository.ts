import { getDatabase } from '@/db/database';
import { Report, ReportItemResult, ControlConclusion, ChecklistItemStatus } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';

export class ReportRepository extends BaseRepository<Report> {
  constructor() {
    super('reports');
  }

  async getByAssetId(assetId: string): Promise<Report[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<Report>(`
      SELECT r.*, a.code_interne as asset_code, a.designation as asset_designation
      FROM reports r
      LEFT JOIN assets a ON r.asset_id = a.id
      WHERE r.asset_id = ?
      ORDER BY r.performed_at DESC
    `, [assetId]);
  }

  async getByMissionId(missionId: string): Promise<Report[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<Report>(`
      SELECT r.*, a.code_interne as asset_code, a.designation as asset_designation
      FROM reports r
      LEFT JOIN assets a ON r.asset_id = a.id
      WHERE r.mission_id = ?
      ORDER BY r.performed_at DESC
    `, [missionId]);
  }

  async getByIdWithItems(id: string): Promise<Report | null> {
    if (Platform.OS === 'web') return null;
    
    const db = await getDatabase();
    
    const report = await db.getFirstAsync<Report>(`
      SELECT r.*, a.code_interne as asset_code, a.designation as asset_designation
      FROM reports r
      LEFT JOIN assets a ON r.asset_id = a.id
      WHERE r.id = ?
    `, [id]);
    
    if (!report) return null;
    
    const items = await db.getAllAsync<ReportItemResult>(`
      SELECT rir.*, ci.label, ci.field_type, ci.help_text
      FROM report_item_results rir
      LEFT JOIN checklist_items ci ON rir.checklist_item_id = ci.id
      WHERE rir.report_id = ?
      ORDER BY ci.sort_order
    `, [id]);
    
    return { ...report, items };
  }

  async create(report: Omit<Report, 'id' | 'created_at'>, items: Omit<ReportItemResult, 'id' | 'report_id'>[]): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(`
      INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, report.mission_id, report.asset_id, report.performed_at, report.performer, report.conclusion, report.summary, report.signed_by_name, report.signed_at, now]);
    
    for (const item of items) {
      await db.runAsync(`
        INSERT INTO report_item_results (id, report_id, checklist_item_id, status, value_num, value_text, comment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [this.generateId(), id, item.checklist_item_id, item.status, item.value_num, item.value_text, item.comment]);
    }
    
    return id;
  }
}

export const reportRepository = new ReportRepository();
