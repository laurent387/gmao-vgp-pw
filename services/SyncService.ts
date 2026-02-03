import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { outboxRepository } from '@/repositories/OutboxRepository';
import { documentRepository } from '@/repositories/DocumentRepository';
import { OutboxItem } from '@/types';
import { trpcClient } from '@/lib/trpc';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isSyncing = false;
  private apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

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

      if (pendingItems.length === 0) {
        console.log('[SYNC] No items to sync');
        return result;
      }

      const itemsForUpload: OutboxItem[] = [];
      const itemsForTrpc: OutboxItem[] = [];

      for (const item of pendingItems) {
        if (item.type === 'UPLOAD_DOCUMENT') {
          itemsForUpload.push(item);
        } else {
          itemsForTrpc.push(item);
        }
      }

      if (itemsForUpload.length > 0) {
        console.log(`[SYNC] Processing ${itemsForUpload.length} document uploads`);
        for (const item of itemsForUpload) {
          try {
            await this.uploadDocument(JSON.parse(item.payload_json));
            await outboxRepository.markSent(item.id);
            result.processed++;
            console.log(`[SYNC] Uploaded document ${item.id}`);
          } catch (e) {
            const error = e instanceof Error ? e.message : 'Unknown error';
            await outboxRepository.markError(item.id, error);
            result.failed++;
            result.errors.push(`Document upload: ${error}`);
            console.error(`[SYNC] Document upload failed ${item.id}:`, error);
          }
        }
      }

      if (itemsForTrpc.length > 0) {
        console.log(`[SYNC] Processing ${itemsForTrpc.length} items via tRPC`);

        const syncItems = itemsForTrpc.map((item) => ({
          id: item.id,
          type: item.type,
          payload: JSON.parse(item.payload_json),
        }));

        try {
          const response = await trpcClient.sync.push.mutate({ items: syncItems });
          console.log('[SYNC] tRPC push response:', response);

          for (const itemResult of response.results) {
            const originalItem = itemsForTrpc.find((i) => i.id === itemResult.id);
            if (!originalItem) continue;

            if (itemResult.success) {
              await outboxRepository.markSent(itemResult.id);
              result.processed++;
            } else {
              await outboxRepository.markError(itemResult.id, itemResult.error || 'Unknown error');
              result.failed++;
              result.errors.push(`${originalItem.type}: ${itemResult.error}`);
            }
          }
        } catch (e) {
          const error = e instanceof Error ? e.message : 'Unknown error';
          console.error('[SYNC] tRPC push failed:', error);

          for (const item of itemsForTrpc) {
            await outboxRepository.markError(item.id, error);
            result.failed++;
          }
          result.errors.push(`Sync batch failed: ${error}`);
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

  async pull(lastSyncAt?: string): Promise<{ timestamp: string; changes: Record<string, any[]> }> {
    console.log('[SYNC] Pulling changes since:', lastSyncAt || 'beginning');

    try {
      const response = await trpcClient.sync.pull.query({
        lastSyncAt,
        entities: [
          'users',
          'sites',
          'zones',
          'assets',
          'controlTypes',
          'missions',
          'nonconformities',
          'correctiveActions',
          'reports',
          'maintenanceLogs',
          'checklistTemplates',
          'checklistItems',
        ],
      });

      console.log('[SYNC] Pull complete, timestamp:', response.timestamp);
      return response;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      console.error('[SYNC] Pull failed:', error);
      throw e;
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

    const FileSystem = require('expo-file-system');
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

  async getStatus(): Promise<{ serverTime: string; version: string; status: string; database: string }> {
    try {
      return await trpcClient.sync.status.query();
    } catch (e) {
      console.error('[SYNC] Status check failed:', e);
      return {
        serverTime: new Date().toISOString(),
        version: 'unknown',
        status: 'offline',
        database: 'unknown',
      };
    }
  }
}

export const syncService = new SyncService();
