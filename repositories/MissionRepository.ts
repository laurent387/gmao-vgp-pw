import { getDatabase } from '@/db/database';
import { Mission, MissionStatus, Asset, OperationType } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';
import { webApiService } from '@/services/WebApiService';

export interface MissionFilters {
  siteId?: string;
  status?: MissionStatus;
  assignedTo?: string;
  sortBy?: 'scheduled_at' | 'status' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export class MissionRepository extends BaseRepository<Mission> {
  constructor() {
    super('missions');
  }

  async getAllWithDetails(filters?: MissionFilters): Promise<Mission[]> {
    if (Platform.OS === 'web') {
      return webApiService.getMissions(filters);
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

    const sortColumnMap: Record<string, string> = {
      scheduled_at: 'm.scheduled_at',
      status: 'm.status',
      created_at: 'm.created_at',
    };
    const sortColumn = sortColumnMap[filters?.sortBy || 'scheduled_at'] || 'm.scheduled_at';
    const sortOrder = filters?.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    return db.getAllAsync<Mission>(query, params);
  }

  async getByIdWithDetails(id: string): Promise<Mission | null> {
    if (Platform.OS === 'web') {
      return webApiService.getMissionById(id);
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

  async create(
    mission: Omit<Mission, 'id' | 'created_at'>,
    assetIds: string[],
    technicianIds?: string[],
    operationTypes?: (string | OperationType)[],
    operationAssets?: Record<string, string[]>
  ): Promise<string> {
    if (Platform.OS === 'web') {
      return webApiService.createMissionFull({
        ...mission,
        asset_ids: assetIds,
        technician_ids: technicianIds || [],
        operation_types: operationTypes || [],
        operation_assets: operationAssets || {},
      });
    }
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(`
      INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, mission.control_type_id, mission.scheduled_at, mission.assigned_to, mission.status, mission.site_id, now]);
    
    // Add assets
    for (const assetId of assetIds) {
      await db.runAsync(
        'INSERT INTO mission_assets (id, mission_id, asset_id) VALUES (?, ?, ?)',
        [this.generateId(), id, assetId]
      );
    }

    // Add technicians
    if (technicianIds && technicianIds.length > 0) {
      for (const techId of technicianIds) {
        await db.runAsync(
          'INSERT INTO mission_technicians (id, mission_id, technician_id, assigned_at) VALUES (?, ?, ?, ?)',
          [this.generateId(), id, techId, now]
        );
      }
    }

    // Add operations
    if (operationTypes && operationTypes.length > 0) {
      for (let i = 0; i < operationTypes.length; i++) {
        await db.runAsync(
          'INSERT INTO mission_operations (id, mission_id, operation_type, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
          [this.generateId(), id, operationTypes[i], i, now]
        );
      }
    }
    
    return id;
  }

  async updateStatus(id: string, status: MissionStatus): Promise<void> {
    if (Platform.OS === 'web') {
      await webApiService.updateMissionStatus(id, status);
      return;
    }

    const db = await getDatabase();
    await db.runAsync('UPDATE missions SET status = ? WHERE id = ?', [status, id]);
  }

  async getByStatus(status: MissionStatus): Promise<Mission[]> {
    if (Platform.OS === 'web') {
      const missions = await webApiService.getMissions({ status });
      return missions;
    }
    
    const db = await getDatabase();
    return db.getAllAsync<Mission>(
      'SELECT * FROM missions WHERE status = ? ORDER BY scheduled_at DESC',
      [status]
    );
  }

  async getMissionAssets(missionId: string): Promise<Asset[]> {
    if (Platform.OS === 'web') {
      return webApiService.getMissionAssets(missionId);
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
