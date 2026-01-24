import { getDatabase } from '@/db/database';
import { MaintenanceLog, OperationType } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';

export class MaintenanceRepository extends BaseRepository<MaintenanceLog> {
  constructor() {
    super('maintenance_logs');
  }

  async getByAssetId(assetId: string): Promise<MaintenanceLog[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<MaintenanceLog>(
      'SELECT * FROM maintenance_logs WHERE asset_id = ? ORDER BY date DESC',
      [assetId]
    );
  }

  async create(log: Omit<MaintenanceLog, 'id' | 'created_at'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(`
      INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, log.asset_id, log.date, log.actor, log.operation_type, log.description, log.parts_ref, now]);
    
    return id;
  }
}

export const maintenanceRepository = new MaintenanceRepository();
