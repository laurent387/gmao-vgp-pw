import { getDatabase } from '@/db/database';
import { Client, Site, Zone } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';
import { webApiService } from '@/services/WebApiService';

export class ClientRepository extends BaseRepository<Client> {
  constructor() {
    super('clients');
  }

  async create(client: Omit<Client, 'id' | 'created_at'>): Promise<string> {
    if (Platform.OS === 'web') return '';

    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());

    await db.runAsync('INSERT INTO clients (id, name, created_at) VALUES (?, ?, ?)', [id, client.name, now]);

    return id;
  }
}

export class SiteRepository extends BaseRepository<Site> {
  constructor() {
    super('sites');
  }

  async getAllWithClientName(): Promise<Site[]> {
    if (Platform.OS === 'web') {
      return webApiService.getSites();
    }

    const db = await getDatabase();
    return db.getAllAsync<Site>(`
      SELECT s.*, c.name as client_name
      FROM sites s
      LEFT JOIN clients c ON s.client_id = c.id
      ORDER BY c.name, s.name
    `);
  }

  async getByClientId(clientId: string): Promise<Site[]> {
    if (Platform.OS === 'web') {
      const sites = await webApiService.getSites();
      return sites.filter(s => s.client_id === clientId);
    }

    const db = await getDatabase();
    return db.getAllAsync<Site>('SELECT * FROM sites WHERE client_id = ? ORDER BY name', [clientId]);
  }

  async create(site: Omit<Site, 'id' | 'created_at'>): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(
      'INSERT INTO sites (id, client_id, name, address, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, site.client_id, site.name, site.address ?? null, now]
    );
    
    return id;
  }
}

export class ZoneRepository extends BaseRepository<Zone> {
  constructor() {
    super('zones');
  }

  async getBySiteId(siteId: string): Promise<Zone[]> {
    if (Platform.OS === 'web') return webApiService.getZones(siteId);
    
    const db = await getDatabase();
    return db.getAllAsync<Zone>('SELECT * FROM zones WHERE site_id = ?', [siteId]);
  }

  async getAllWithSiteName(): Promise<Zone[]> {
    if (Platform.OS === 'web') {
      return webApiService.getZones();
    }
    
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

export const clientRepository = new ClientRepository();
export const siteRepository = new SiteRepository();
export const zoneRepository = new ZoneRepository();
