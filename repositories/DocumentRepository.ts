import { Platform } from 'react-native';

import { getDatabase } from '@/db/database';
import { Document } from '@/types';
import { BaseRepository } from './BaseRepository';

export type DocumentEntityType = Document['entity_type'];

export class DocumentRepository extends BaseRepository<Document> {
  constructor() {
    super('documents');
  }

  async getByEntity(entityType: DocumentEntityType, entityId: string): Promise<Document[]> {
    if (Platform.OS === 'web') {
      const all = await this.getAll();
      return all.filter((d) => d.entity_type === entityType && d.entity_id === entityId);
    }

    const db = await getDatabase();
    return db.getAllAsync<Document>(
      'SELECT * FROM documents WHERE entity_type = ? AND entity_id = ? ORDER BY uploaded_at DESC',
      [entityType, entityId]
    );
  }

  async create(doc: Omit<Document, 'id'> & { id?: string }): Promise<string> {
    if (Platform.OS === 'web') {
      console.log('[DocumentRepository] create(web)', doc);
      return doc.id ?? '';
    }

    const db = await getDatabase();
    const id = doc.id ?? this.generateId();

    await db.runAsync(
      `INSERT INTO documents (id, entity_type, entity_id, local_uri, mime, sha256, uploaded_at, synced, server_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        doc.entity_type,
        doc.entity_id,
        doc.local_uri,
        doc.mime,
        doc.sha256 ?? null,
        doc.uploaded_at,
        doc.synced ? 1 : 0,
        doc.server_url ?? null,
      ]
    );

    return id;
  }

  async markSynced(id: string, serverUrl: string | null): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('[DocumentRepository] markSynced(web)', { id, serverUrl });
      return;
    }

    const db = await getDatabase();
    await db.runAsync('UPDATE documents SET synced = 1, server_url = ? WHERE id = ?', [serverUrl, id]);
  }

  async getPendingUploads(): Promise<Document[]> {
    if (Platform.OS === 'web') return [];

    const db = await getDatabase();
    return db.getAllAsync<Document>('SELECT * FROM documents WHERE synced = 0 ORDER BY uploaded_at ASC');
  }

  async delete(id: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('[DocumentRepository] delete(web)', id);
      return;
    }

    const db = await getDatabase();
    await db.runAsync('DELETE FROM documents WHERE id = ?', [id]);
  }
}

export const documentRepository = new DocumentRepository();
