import { outboxRepository } from '@/repositories/OutboxRepository';
import { OutboxItem } from '@/types';

export interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isSyncing = false;
  private apiBaseUrl = 'https://api.inspectra.example.com';

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
    const payload = JSON.parse(item.payload_json);
    
    console.log(`[SYNC] Processing ${item.type}:`, payload);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const shouldFail = Math.random() < 0.1;
    if (shouldFail) {
      throw new Error('Network error (simulated)');
    }
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
