import { getDatabase } from '@/db/database';
import { Platform } from 'react-native';

export abstract class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(): Promise<T[]> {
    if (Platform.OS === 'web') return [] as T[];
    const db = await getDatabase();
    return db.getAllAsync<T>(`SELECT * FROM ${this.tableName}`);
  }

  async getById(id: string): Promise<T | null> {
    if (Platform.OS === 'web') return null;
    const db = await getDatabase();
    return db.getFirstAsync<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  async deleteById(id: string): Promise<void> {
    if (Platform.OS === 'web') return;
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  async count(): Promise<number> {
    if (Platform.OS === 'web') return 0;
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    return result?.count ?? 0;
  }

  protected generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  protected formatDate(date: Date): string {
    return date.toISOString();
  }
}
