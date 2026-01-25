import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

import { outboxRepository } from '@/repositories/OutboxRepository';
import { documentRepository } from '@/repositories/DocumentRepository';
import { OutboxItem } from '@/types';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isSyncing = false;
  private apiBaseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'http://localhost:3000';

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SYNC] Already syncing, skipping');
      return { success: false, processed: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    console.log('[SYNC] Starting sync...');

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      const pendingItems = await outboxRepository.getPending();
      console.log(`[SYNC] Found ${pendingItems.length} pending items`);

      for (const item of pendingItems) {
        try {
          await this.processItem(item);
          await outboxRepository.markSent(item.id);
          result.processed++;
          console.log(`[SYNC] Processed item ${item.id} (${item.type})`);
        } catch (e) {
          const error = e instanceof Error ? e.message : 'Unknown error';
          await outboxRepository.markError(item.id, error);
          result.failed++;
          result.errors.push(`${item.type}: ${error}`);
          console.error(`[SYNC] Failed item ${item.id}:`, error);
        }
      }

      result.success = result.failed === 0;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      result.success = false;
      result.errors.push(error);
      console.error('[SYNC] Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }

    console.log('[SYNC] Sync complete:', result);
    return result;
  }

  private async processItem(item: OutboxItem): Promise<void> {
    const payload: any = JSON.parse(item.payload_json);

    console.log(`[SYNC] Processing ${item.type}:`, payload);

    if (item.type === 'UPLOAD_DOCUMENT') {
      await this.uploadDocument(payload);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 250));

    const shouldFail = Math.random() < 0.05;
    if (shouldFail) {
      throw new Error('Network error (simulated)');
    }
  }

  private async getAuthToken(): Promise<string | null> {
    const key = 'inspectra_auth';

    try {
      if (Platform.OS === 'web') {
        const stored = localStorage.getItem(key);
        const parsed = stored ? (JSON.parse(stored) as { token?: string }) : null;
        return parsed?.token ?? null;
      }

      const stored = await SecureStore.getItemAsync(key);
      const parsed = stored ? (JSON.parse(stored) as { token?: string }) : null;
      return parsed?.token ?? null;
    } catch (e) {
      console.error('[SYNC] Failed to read auth token:', e);
      return null;
    }
  }

  private async uploadDocument(payload: { documentId?: string; entityType?: string; entityId?: string }): Promise<void> {
    const documentId = payload.documentId;
    if (!documentId) throw new Error('Missing documentId');

    if (Platform.OS === 'web') {
      console.log('[SYNC] Web upload not supported for local files, skipping');
      await documentRepository.markSynced(documentId, null);
      return;
    }

    const doc = await documentRepository.getById(documentId);
    if (!doc) throw new Error(`Document not found: ${documentId}`);

    const info = await FileSystem.getInfoAsync(doc.local_uri);
    if (!info.exists) throw new Error('Local file missing');

    const token = await this.getAuthToken();

    const formData = new FormData();
    formData.append('entityType', doc.entity_type);
    formData.append('entityId', doc.entity_id);
    formData.append('documentId', doc.id);

    const name = doc.local_uri.split('/').pop() || `photo-${doc.id}.jpg`;

    formData.append('file', {
      uri: doc.local_uri,
      name,
      type: doc.mime,
    } as any);

    const url = `${this.apiBaseUrl}/api/uploads`;
    console.log('[SYNC] Uploading document to:', url, { documentId: doc.id, entityType: doc.entity_type, entityId: doc.entity_id, mime: doc.mime });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const text = await res.text();
    console.log('[SYNC] Upload response:', res.status, text.substring(0, 200));

    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    const serverUrl: string | null = typeof parsed?.url === 'string' ? parsed.url : null;
    await documentRepository.markSynced(doc.id, serverUrl);
  }

  async addToOutbox(type: string, payload: object): Promise<void> {
    await outboxRepository.add(type, payload);
    console.log(`[SYNC] Added to outbox: ${type}`);
  }

  async getPendingCount(): Promise<number> {
    return outboxRepository.getPendingCount();
  }

  async getOutboxItems(): Promise<OutboxItem[]> {
    return outboxRepository.getAll();
  }

  async clearSentItems(): Promise<void> {
    await outboxRepository.clearSent();
  }

  async retryFailedItems(): Promise<void> {
    await outboxRepository.retryErrors();
  }
}

export const syncService = new SyncService();
