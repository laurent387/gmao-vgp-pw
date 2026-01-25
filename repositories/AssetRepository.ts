import { getDatabase } from '@/db/database';
import { Asset, AssetStatus } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';
import { webApiService } from '@/services/WebApiService';

export interface AssetFilters {
  clientId?: string;
  siteId?: string;
  zoneId?: string;
  categorie?: string;
  statut?: AssetStatus;
  search?: string;
}

export class AssetRepository extends BaseRepository<Asset> {
  constructor() {
    super('assets');
  }

  async getAllWithDetails(filters?: AssetFilters): Promise<Asset[]> {
    if (Platform.OS === 'web') {
      return webApiService.getAssets(filters);
    }
    
    const db = await getDatabase();
    
    let query = `
      SELECT 
        a.*,
        s.name as site_name,
        z.name as zone_name,
        ac.next_due_at,
        CASE WHEN ac.next_due_at < datetime('now') THEN 1 ELSE 0 END as is_overdue
      FROM assets a
      LEFT JOIN sites s ON a.site_id = s.id
      LEFT JOIN zones z ON a.zone_id = z.id
      LEFT JOIN asset_controls ac ON a.id = ac.asset_id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters?.clientId) {
      conditions.push('s.client_id = ?');
      params.push(filters.clientId);
    }

    if (filters?.siteId) {
      conditions.push('a.site_id = ?');
      params.push(filters.siteId);
    }
    
    if (filters?.zoneId) {
      conditions.push('a.zone_id = ?');
      params.push(filters.zoneId);
    }
    
    if (filters?.categorie) {
      conditions.push('a.categorie = ?');
      params.push(filters.categorie);
    }
    
    if (filters?.statut) {
      conditions.push('a.statut = ?');
      params.push(filters.statut);
    }
    
    if (filters?.search) {
      conditions.push('(a.code_interne LIKE ? OR a.designation LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY a.code_interne';
    
    const results = await db.getAllAsync<Omit<Asset, 'is_overdue'> & { is_overdue: number }>(query, params);
    return results.map(r => ({ ...r, is_overdue: r.is_overdue === 1 }) as Asset);
  }

  async getByIdWithDetails(id: string): Promise<Asset | null> {
    if (Platform.OS === 'web') return webApiService.getAssetById(id);
    
    const db = await getDatabase();
    
    const result = await db.getFirstAsync<Omit<Asset, 'is_overdue'> & { is_overdue: number }>(`
      SELECT 
        a.*,
        s.name as site_name,
        z.name as zone_name,
        ac.next_due_at,
        CASE WHEN ac.next_due_at < datetime('now') THEN 1 ELSE 0 END as is_overdue
      FROM assets a
      LEFT JOIN sites s ON a.site_id = s.id
      LEFT JOIN zones z ON a.zone_id = z.id
      LEFT JOIN asset_controls ac ON a.id = ac.asset_id
      WHERE a.id = ?
    `, [id]);
    
    if (!result) return null;
    return { ...result, is_overdue: result.is_overdue === 1 } as Asset;
  }

  async create(asset: Omit<Asset, 'id' | 'created_at'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(`
      INSERT INTO assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, asset.code_interne, asset.designation, asset.categorie, asset.marque, asset.modele,
      asset.numero_serie, asset.annee, asset.statut, asset.criticite, asset.site_id, asset.zone_id,
      asset.mise_en_service, now
    ]);
    
    return id;
  }

  async update(id: string, asset: Partial<Asset>): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    
    const updateableFields = ['code_interne', 'designation', 'categorie', 'marque', 'modele', 'numero_serie', 'annee', 'statut', 'criticite', 'site_id', 'zone_id', 'mise_en_service'];
    
    for (const field of updateableFields) {
      if (asset[field as keyof Asset] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(asset[field as keyof Asset]);
      }
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    await db.runAsync(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async getCategories(): Promise<string[]> {
    if (Platform.OS === 'web') return webApiService.getAssetCategories();
    
    const db = await getDatabase();
    const results = await db.getAllAsync<{ categorie: string }>('SELECT DISTINCT categorie FROM assets ORDER BY categorie');
    return results.map(r => r.categorie);
  }

  async getOverdueCount(): Promise<number> {
    if (Platform.OS === 'web') {
      const assets = await webApiService.getAssets();
      return assets.filter(a => a.is_overdue).length;
    }
    
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(DISTINCT a.id) as count
      FROM assets a
      INNER JOIN asset_controls ac ON a.id = ac.asset_id
      WHERE ac.next_due_at < datetime('now')
    `);
    return result?.count ?? 0;
  }

  async getDueSoonCount(days: number): Promise<number> {
    if (Platform.OS === 'web') {
      const assets = await webApiService.getAssets();
      const now = new Date();
      return assets.filter(a => {
        if (!a.next_due_at) return false;
        const dueDate = new Date(a.next_due_at);
        const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= days;
      }).length;
    }
    
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(`
      SELECT COUNT(DISTINCT a.id) as count
      FROM assets a
      INNER JOIN asset_controls ac ON a.id = ac.asset_id
      WHERE ac.next_due_at >= datetime('now')
        AND ac.next_due_at <= datetime('now', '+${days} days')
    `);
    return result?.count ?? 0;
  }
}

export const assetRepository = new AssetRepository();
