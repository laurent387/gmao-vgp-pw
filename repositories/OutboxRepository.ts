import { getDatabase } from '@/db/database';
import { OutboxItem, OutboxStatus } from '@/types';
import { BaseRepository } from './BaseRepository';
import { Platform } from 'react-native';

export class OutboxRepository extends BaseRepository<OutboxItem> {
  constructor() {
    super('outbox');
  }

  async getPending(): Promise<OutboxItem[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<OutboxItem>(
      "SELECT * FROM outbox WHERE status = 'PENDING' ORDER BY created_at ASC"
    );
  }

  async getAll(): Promise<OutboxItem[]> {
    if (Platform.OS === 'web') return [];
    
    const db = await getDatabase();
    return db.getAllAsync<OutboxItem>('SELECT * FROM outbox ORDER BY created_at DESC');
  }

  async add(type: string, payload: object): Promise<string> {
    if (Platform.OS === 'web') return '';
    
    const db = await getDatabase();
    const id = this.generateId();
    const now = this.formatDate(new Date());
    
    await db.runAsync(`
      INSERT INTO outbox (id, type, payload_json, created_at, status, last_error)
      VALUES (?, ?, ?, ?, 'PENDING', NULL)
    `, [id, type, JSON.stringify(payload), now]);
    
    console.log('[OUTBOX] Added item:', type);
    return id;
  }

  async markSent(id: string): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    await db.runAsync("UPDATE outbox SET status = 'SENT' WHERE id = ?", [id]);
  }

  async markError(id: string, error: string): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    await db.runAsync("UPDATE outbox SET status = 'ERROR', last_error = ? WHERE id = ?", [error, id]);
  }

  async getPendingCount(): Promise<number> {
    if (Platform.OS === 'web') return 0;
    
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM outbox WHERE status = 'PENDING'"
    );
    return result?.count ?? 0;
  }

  async clearSent(): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    await db.runAsync("DELETE FROM outbox WHERE status = 'SENT'");
  }

  async retryErrors(): Promise<void> {
    if (Platform.OS === 'web') return;
    
    const db = await getDatabase();
    await db.runAsync("UPDATE outbox SET status = 'PENDING', last_error = NULL WHERE status = 'ERROR'");
  }
}

export const outboxRepository = new OutboxRepository();
