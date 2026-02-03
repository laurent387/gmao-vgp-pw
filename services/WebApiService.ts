import { Asset, Site, Zone, Mission, NonConformity, CorrectiveAction, ControlType, Client } from '@/types';
import { AssetFilters } from '@/repositories/AssetRepository';
import { MissionFilters } from '@/repositories/MissionRepository';
import { NCFilters } from '@/repositories/NCRepository';

class WebApiService {
  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset | null> {
    console.log('[WebAPI] Updating asset:', id, data);
    try {
      const { data: updated } = await import('@/app/api').then(m => m.updateAsset(id, data));
      return updated as Asset | null;
    } catch (e) {
      console.error('[WebAPI] Error updating asset:', e);
      return null;
    }
  }
  private normalizeList<T>(value: unknown): T[] {
    const list = (value as any)?.json ?? value;
    return Array.isArray(list) ? (list as T[]) : [];
  }

  async getAssets(filters?: AssetFilters & { sortBy?: string; sortOrder?: string }): Promise<Asset[]> {
    // Utilise l’API REST Fastify
    try {
      const { data } = await import('@/app/api').then(m => m.getAssets(filters));
      return data;
    } catch (e) {
      console.error('[WebAPI] Error fetching assets:', e);
      return [];
    }
  }

  async getAssetById(id: string): Promise<Asset | null> {
    try {
      const { data } = await import('@/app/api').then(m => m.getAsset(id));
      return data;
    } catch (e) {
      console.error('[WebAPI] Error fetching asset:', e);
      return null;
    }
  }

  async getAssetCategories(): Promise<string[]> {
    console.log('[WebAPI] Fetching asset categories');
    try {
      const { data } = await import('@/app/api').then(m => m.getAssetCategories());
      const list = Array.isArray(data) ? data : [];
      console.log('[WebAPI] Fetched categories:', list.length);
      return list;
    } catch (e) {
      console.error('[WebAPI] Error fetching categories:', e);
      return [];
    }
  }

  async getSites(): Promise<Site[]> {
    console.log('[WebAPI] Fetching sites');
    try {
      const { data } = await import('@/app/api').then(m => m.getSites());
      console.log('[WebAPI] Fetched sites:', Array.isArray(data) ? data.length : 'undefined');
      return (data as Site[]) || [];
    } catch (e) {
      console.error('[WebAPI] Error fetching sites:', e);
      return [];
    }
  }

  async getClients(): Promise<Client[]> {
    console.log('[WebAPI] Fetching clients');
    try {
      const { data } = await import('@/app/api').then(m => m.getClients());
      console.log('[WebAPI] Fetched clients:', Array.isArray(data) ? data.length : 'undefined');
      return (data as Client[]) || [];
    } catch (e) {
      console.error('[WebAPI] Error fetching clients:', e);
      return [];
    }
  }

  async getTechnicians(): Promise<any[]> {
    console.log('[WebAPI] Fetching technicians');
    try {
      const { data } = await import('@/app/api').then(m => m.getTechnicians());
      console.log('[WebAPI] Fetched technicians:', Array.isArray(data) ? data.length : 'undefined');
      return (data as any[]) || [];
    } catch (e) {
      console.error('[WebAPI] Error fetching technicians:', e);
      return [];
    }
  }

  async getSiteById(id: string): Promise<Site | null> {
    console.log('[WebAPI] Fetching site by id:', id);
    try {
      const { data } = await import('@/app/api').then(m => m.getSite(id));
      return data as Site | null;
    } catch (e) {
      console.error('[WebAPI] Error fetching site:', e);
      return null;
    }
  }

  async getZones(siteId?: string): Promise<Zone[]> {
    console.log('[WebAPI] Fetching zones for site:', siteId);
    try {
      const { data } = await import('@/app/api').then(m => m.getZones({ siteId }));
      return (data as Zone[]) || [];
    } catch (e) {
      console.error('[WebAPI] Error fetching zones:', e);
      return [];
    }
  }

  async getMissions(filters?: MissionFilters): Promise<Mission[]> {
    console.log('[WebAPI] Fetching missions with filters:', filters);
    try {
      const { data } = await import('@/app/api').then(m => m.getMissions({
        siteId: filters?.siteId,
        status: filters?.status,
        assignedTo: filters?.assignedTo,
        sortBy: filters?.sortBy,
        sortOrder: filters?.sortOrder,
      }));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[WebAPI] Error fetching missions:', e);
      return [];
    }
  }

  async getMissionById(id: string): Promise<Mission | null> {
    console.log('[WebAPI] Fetching mission by id:', id);
    try {
      const { data } = await import('@/app/api').then(m => m.getMission(id));
      return data || null;
    } catch (e) {
      console.error('[WebAPI] Error fetching mission:', e);
      return null;
    }
  }

  async getMissionAssets(missionId: string): Promise<Asset[]> {
    console.log('[WebAPI] Fetching mission assets:', missionId);
    try {
      // Get mission first to find asset_ids
      const { data: mission } = await import('@/app/api').then(m => m.getMission(missionId));
      if (!mission?.asset_ids?.length) return [];
      
      // Fetch each asset
      const { getAsset } = await import('@/app/api');
      const assets = await Promise.all(
        mission.asset_ids.map(async (assetId: string) => {
          try {
            const { data } = await getAsset(assetId);
            return data;
          } catch {
            return null;
          }
        })
      );
      return assets.filter(Boolean) as Asset[];
    } catch (e) {
      console.error('[WebAPI] Error fetching mission assets:', e);
      return [];
    }
  }

  async getMissionOperationAssets(missionId: string): Promise<any[]> {
    console.log('[WebAPI] Fetching mission operation assets:', missionId);
    try {
      const { data } = await import('@/app/api').then(m => m.getMissionOperationAssets(missionId));
      return Array.isArray(data?.data) ? data.data : data;
    } catch (e) {
      console.error('[WebAPI] Error fetching mission operation assets:', e);
      return [];
    }
  }

  async updateMissionOperationAsset(
    missionId: string,
    id: number | string,
    data: { work_description?: string; checklist_template_id?: number | null; checklist_data?: any[] }
  ): Promise<any | null> {
    console.log('[WebAPI] Updating mission operation asset:', missionId, id, data);
    try {
      const { data: result } = await import('@/app/api').then(m => m.updateMissionOperationAsset(missionId, id, data));
      return result?.data ?? result;
    } catch (e) {
      console.error('[WebAPI] Error updating mission operation asset:', e);
      return null;
    }
  }

  async updateMissionStatus(id: string, status: string): Promise<void> {
    console.log('[WebAPI] Updating mission status:', id, status);
    try {
      await import('@/app/api').then(m => m.updateMission(id, { status }));
    } catch (e) {
      console.error('[WebAPI] Error updating mission status:', e);
    }
  }

  async createMission(data: { control_type_id: string; scheduled_at: string; assigned_to: string; site_id: string; asset_ids: string[] }): Promise<string> {
    console.log('[WebAPI] Creating mission:', data);
    try {
      const id = `mission_${Date.now()}`;
      const { data: result } = await import('@/app/api').then(m => m.createMission({ id, ...data }));
      return result?.id || id;
    } catch (e) {
      console.error('[WebAPI] Error creating mission:', e);
      throw e;
    }
  }

  async createMissionFull(data: {
    control_type_id?: string | null;
    scheduled_at: string;
    assigned_to: string;
    site_id: string;
    status?: string;
    asset_ids: string[];
    technician_ids: string[];
    operation_types: (string | import('@/types').OperationType)[];
    operation_assets?: Record<string, string[]>;
  }): Promise<string> {
    console.log('[WebAPI] Creating mission (full):', data);
    try {
      const { data: result } = await import('@/app/api').then(m => m.createMission(data));
      console.log('[WebAPI] Mission created:', result);
      return result?.id || '';
    } catch (e) {
      console.error('[WebAPI] Error creating mission:', e);
      throw e;
    }
  }

  async getNonConformities(filters?: NCFilters): Promise<NonConformity[]> {
    console.log('[WebAPI] Fetching NCs with filters:', filters);
    try {
      const { data } = await import('@/app/api').then(m => m.getNonconformities(filters));
      return data;
    } catch (e) {
      console.error('[WebAPI] Error fetching nonconformities:', e);
      return [];
    }
  }

  async getNCById(id: string): Promise<NonConformity | null> {
    console.log('[WebAPI] Fetching NC by id:', id);
    try {
      const { data } = await import('@/app/api').then(m => m.getNonconformity(id));
      return data;
    } catch (e) {
      console.error('[WebAPI] Error fetching nonconformity:', e);
      return null;
    }
  }

  async createNC(data: { asset_id: string; title: string; description: string; severity: number; report_id?: string }): Promise<string> {
    console.log('[WebAPI] Creating NC:', data);
    try {
      const { data: result } = await import('@/app/api').then(m => m.createNonconformity(data));
      return result.id;
    } catch (e) {
      console.error('[WebAPI] Error creating nonconformity:', e);
      throw e;
    }
  }

  async updateNCStatus(id: string, status: string): Promise<void> {
    console.log('[WebAPI] Updating NC status:', id, status);
    try {
      await import('@/app/api').then(m => m.updateNonconformity(id, { status }));
    } catch (e) {
      console.error('[WebAPI] Error updating NC status:', e);
    }
  }

  async updateNC(id: string, data: { title?: string; description?: string; severity?: number; status?: string }): Promise<void> {
    console.log('[WebAPI] Updating NC:', id, data);
    try {
      await import('@/app/api').then(m => m.updateNonconformity(id, data));
    } catch (e) {
      console.error('[WebAPI] Error updating NC:', e);
      throw e;
    }
  }

  async createCorrectiveAction(data: { nonconformity_id: string; owner: string; due_at: string; description: string }): Promise<string> {
    console.log('[WebAPI] Creating corrective action:', data);
    try {
      // For now, store as part of the NC or in a separate table
      const id = `action_${Date.now()}`;
      // TODO: Implement corrective actions endpoint
      return id;
    } catch (e) {
      console.error('[WebAPI] Error creating action:', e);
      throw e;
    }
  }

  async updateActionStatus(id: string, status: string, validatedBy?: string): Promise<void> {
    console.log('[WebAPI] Updating action status:', id, status);
    try {
      // TODO: Implement action status update endpoint
    } catch (e) {
      console.error('[WebAPI] Error updating action status:', e);
    }
  }

  async getControlTypes(): Promise<ControlType[]> {
    console.log('[WebAPI] Fetching control types');
    try {
      const { data } = await import('@/app/api').then(m => m.getControlTypes());
      console.log('[WebAPI] Fetched control types:', Array.isArray(data) ? data.length : 'undefined');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[WebAPI] Error fetching control types:', e);
      return [];
    }
  }

  async getOperationChecklists(operation_type?: string): Promise<any[]> {
    console.log('[WebAPI] Fetching operation checklists:', operation_type);
    try {
      const { data } = await import('@/app/api').then(m => m.getOperationChecklists({ operation_type }));
      return Array.isArray(data?.data) ? data.data : data;
    } catch (e) {
      console.error('[WebAPI] Error fetching operation checklists:', e);
      return [];
    }
  }

  async createOperationChecklist(data: {
    operation_type: string;
    name: string;
    description?: string;
    steps: Array<{ step: string; order: number }>;
  }): Promise<any | null> {
    console.log('[WebAPI] Creating operation checklist:', data);
    try {
      const { data: result } = await import('@/app/api').then(m => m.createOperationChecklist(data));
      return result?.data ?? result;
    } catch (e) {
      console.error('[WebAPI] Error creating operation checklist:', e);
      return null;
    }
  }

  async updateOperationChecklist(
    id: number | string,
    data: { name?: string; description?: string; steps?: Array<{ step: string; order: number }> }
  ): Promise<any | null> {
    console.log('[WebAPI] Updating operation checklist:', id, data);
    try {
      const { data: result } = await import('@/app/api').then(m => m.updateOperationChecklist(id, data));
      return result?.data ?? result;
    } catch (e) {
      console.error('[WebAPI] Error updating operation checklist:', e);
      return null;
    }
  }

  async getDueEcheances(filters?: { siteId?: string; overdueOnly?: boolean; dueSoonDays?: number }) {
    console.log('[WebAPI] Fetching due echeances:', filters);
    try {
      const { data } = await import('@/app/api').then(m => m.getDueEcheances(filters));
      console.log('[WebAPI] Fetched echeances:', Array.isArray(data) ? data.length : 'undefined');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[WebAPI] Error fetching due echeances:', e);
      return [];
    }
  }

  async getAttachments(ownerType: string, ownerId: string) {
    console.log('[WebAPI] Fetching attachments:', ownerType, ownerId);
    try {
      const { data } = await import('@/app/api').then(m => m.getAttachments({ ownerType, ownerId }));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[WebAPI] Error fetching attachments:', e);
      return [];
    }
  }

  async getVgpTemplates(activeOnly = false) {
    console.log('[WebAPI] Fetching VGP templates');
    try {
      const { data } = await import('@/app/api').then(m => m.getVgpTemplates({ activeOnly }));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[WebAPI] Error fetching VGP templates:', e);
      return [];
    }
  }

  // Corrective Actions
  async getActions(filters?: { nonconformity_id?: string; status?: string }): Promise<any[]> {
    console.log('[WebAPI] Fetching actions:', filters);
    try {
      const { data } = await import('@/app/api').then(m => m.getActions?.(filters) || Promise.resolve({ data: [] }));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[WebAPI] Error fetching actions:', e);
      return [];
    }
  }

  async createAction(actionData: { nonconformity_id: string; owner: string; due_at: string; description?: string }): Promise<string> {
    console.log('[WebAPI] Creating action:', actionData);
    try {
      const { data } = await import('@/app/api').then(m => m.createAction(actionData));
      return data.id;
    } catch (e) {
      console.error('[WebAPI] Error creating action:', e);
      throw e;
    }
  }

  async updateActionStatus(id: string, status: string, validatedBy?: string): Promise<void> {
    console.log('[WebAPI] Updating action status:', id, status);
    try {
      await import('@/app/api').then(m => m.updateAction(id, { status, validated_by: validatedBy }));
    } catch (e) {
      console.error('[WebAPI] Error updating action status:', e);
    }
  }
}

export const webApiService = new WebApiService();
