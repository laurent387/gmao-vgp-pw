import { getDatabase } from '@/db/database';
import { Site, Zone } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';

export class SiteRepository extends BaseRepository<Site> {
  constructor() {
    super('sites');
  }

  async create(site: Omit<Site, 'id' | 'created_at'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(
      'INSERT INTO sites (id, name, address, created_at) VALUES (?, ?, ?, ?)',
      [id, site.name, site.address ?? null, now]
    );
    
    return id;
  }
}

export class ZoneRepository extends BaseRepository<Zone> {
  constructor() {
    super('zones');
  }

  async getBySiteId(siteId: string): Promise<Zone[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<Zone>('SELECT * FROM zones WHERE site_id = ?', [siteId]);
  }

  async getAllWithSiteName(): Promise<Zone[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<Zone>(`
      SELECT z.*, s.name as site_name
      FROM zones z
      LEFT JOIN sites s ON z.site_id = s.id
      ORDER BY s.name, z.name
    `);
  }

  async create(zone: Omit<Zone, 'id'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    
    await db.runAsync(
      'INSERT INTO zones (id, site_id, name) VALUES (?, ?, ?)',
      [id, zone.site_id, zone.name]
    );
    
    return id;
  }
}

export const siteRepository = new SiteRepository();
export const zoneRepository = new ZoneRepository();
