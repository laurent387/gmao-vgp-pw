import { getDatabase } from '@/db/database';
import { Mission, MissionStatus, Asset } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';
import { mockMissions, mockAssets } from '@/db/mockData';

export interface MissionFilters {
  siteId?: string;
  status?: MissionStatus;
  assignedTo?: string;
}

export class MissionRepository extends BaseRepository<Mission> {
  constructor() {
    super('missions');
  }

  async getAllWithDetails(filters?: MissionFilters): Promise<Mission[]> {
    if (Platform.OS === 'web') {
      let results = [...mockMissions];
      if (filters?.siteId) results = results.filter(m => m.site_id === filters.siteId);
      if (filters?.status) results = results.filter(m => m.status === filters.status);
      if (filters?.assignedTo) results = results.filter(m => m.assigned_to === filters.assignedTo);
      return results.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
    }
    
    const db = await getDatabase();
    
    let query = `
      SELECT 
        m.*,
        ct.label as control_type_label,
        ct.code as control_type_code,
        s.name as site_name,
        u.name as assigned_to_name
      FROM missions m
      LEFT JOIN control_types ct ON m.control_type_id = ct.id
      LEFT JOIN sites s ON m.site_id = s.id
      LEFT JOIN users u ON m.assigned_to = u.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters?.siteId) {
      conditions.push('m.site_id = ?');
      params.push(filters.siteId);
    }
    
    if (filters?.status) {
      conditions.push('m.status = ?');
      params.push(filters.status);
    }
    
    if (filters?.assignedTo) {
      conditions.push('m.assigned_to = ?');
      params.push(filters.assignedTo);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY m.scheduled_at DESC';
    
    return db.getAllAsync<Mission>(query, params);
  }

  async getByIdWithDetails(id: string): Promise<Mission | null> {
    if (Platform.OS === 'web') {
      const mission = mockMissions.find(m => m.id === id);
      if (!mission) return null;
      const siteAssets = mockAssets.filter(a => a.site_id === mission.site_id).slice(0, (mission as any).asset_count || 3);
      return { ...mission, assets: siteAssets };
    }
    
    const db = await getDatabase();
    
    const mission = await db.getFirstAsync<Mission>(`
      SELECT 
        m.*,
        ct.label as control_type_label,
        ct.code as control_type_code,
        ct.periodicity_days,
        s.name as site_name,
        u.name as assigned_to_name
      FROM missions m
      LEFT JOIN control_types ct ON m.control_type_id = ct.id
      LEFT JOIN sites s ON m.site_id = s.id
      LEFT JOIN users u ON m.assigned_to = u.id
      WHERE m.id = ?
    `, [id]);
    
    if (!mission) return null;
    
    const assets = await db.getAllAsync<Asset>(`
      SELECT a.*, s.name as site_name, z.name as zone_name
      FROM mission_assets ma
      INNER JOIN assets a ON ma.asset_id = a.id
      LEFT JOIN sites s ON a.site_id = s.id
      LEFT JOIN zones z ON a.zone_id = z.id
      WHERE ma.mission_id = ?
    `, [id]);
    
    return { ...mission, assets };
  }

  async create(mission: Omit<Mission, 'id' | 'created_at'>, assetIds: string[]): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(`
      INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, mission.control_type_id, mission.scheduled_at, mission.assigned_to, mission.status, mission.site_id, now]);
    
    for (const assetId of assetIds) {
      await db.runAsync(
        'INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)',
        [this.generateId(), id, assetId]
      );
    }
    
    return id;
  }

  async updateStatus(id: string, status: MissionStatus): Promise<void> {
    if (Platform.OS === 'web') {
      const idx = mockMissions.findIndex(m => m.id === id);
      if (idx >= 0) {
        (mockMissions[idx] as any).status = status;
        console.log('[MissionRepository] updateStatus(web)', { id, status });
      } else {
        console.log('[MissionRepository] updateStatus(web) mission not found', { id, status });
      }
      return;
    }

    const db = await getDatabase();
    await db.runAsync('UPDATE missions SET status = ? WHERE id = ?', [status, id]);
  }

  async getByStatus(status: MissionStatus): Promise<Mission[]> {
    if (Platform.OS === 'web') return mockMissions.filter(m => m.status === status);
    
    const db = await getDatabase();
    return db.getAllAsync<Mission>(
      'SELECT * FROM missions WHERE status = ? ORDER BY scheduled_at DESC',
      [status]
    );
  }

  async getMissionAssets(missionId: string): Promise<Asset[]> {
    if (Platform.OS === 'web') {
      const mission = mockMissions.find(m => m.id === missionId);
      if (!mission) return [];
      return mockAssets.filter(a => a.site_id === mission.site_id).slice(0, mission.asset_count || 3);
    }
    
    const db = await getDatabase();
    return db.getAllAsync<Asset>(`
      SELECT a.*, s.name as site_name, z.name as zone_name
      FROM mission_assets ma
      INNER JOIN assets a ON ma.asset_id = a.id
      LEFT JOIN sites s ON a.site_id = s.id
      LEFT JOIN zones z ON a.zone_id = z.id
      WHERE ma.mission_id = ?
    `, [missionId]);
  }
}

export const missionRepository = new MissionRepository();
