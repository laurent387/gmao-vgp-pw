import { trpcClient } from '@/lib/trpc';
import { Asset, Site, Zone, Mission, NonConformity, CorrectiveAction, ControlType, Client } from '@/types';
import { AssetFilters } from '@/repositories/AssetRepository';
import { MissionFilters } from '@/repositories/MissionRepository';
import { NCFilters } from '@/repositories/NCRepository';

class WebApiService {
  async updateAsset(id: string, data: Partial<Asset>): Promise<Asset | null> {
    console.log('[WebAPI] Updating asset:', id, data);
    try {
      const updated = await trpcClient.assets.update.mutate({ id, data });
      const result = (updated as any)?.json ?? updated;
      return result as Asset | null;
    } catch (e) {
      console.error('[WebAPI] Error updating asset:', e);
      return null;
    }
  }
  private normalizeList<T>(value: unknown): T[] {
    const list = (value as any)?.json ?? value;
    return Array.isArray(list) ? (list as T[]) : [];
  }

  async getAssets(filters?: AssetFilters): Promise<Asset[]> {
    console.log('[WebAPI] Fetching assets with filters:', filters);
    try {
      const assets = await trpcClient.assets.list.query({
        siteId: filters?.siteId,
        zoneId: filters?.zoneId,
        status: filters?.statut,
        category: filters?.categorie,
        search: filters?.search,
      });
      console.log('[WebAPI] Raw assets response:', assets);
      const list = this.normalizeList<Asset>(assets);
      console.log('[WebAPI] Fetched', list.length, 'assets');
      return list;
    } catch (e) {
      console.error('[WebAPI] Error fetching assets:', e);
      return [];
    }
  }

  async getAssetById(id: string): Promise<Asset | null> {
    console.log('[WebAPI] Fetching asset by id:', id);
    try {
      const asset = await trpcClient.assets.getById.query({ id });
      const result = (asset as any)?.json ?? asset;
      console.log('[WebAPI] Fetched asset:', result);
      return result as Asset | null;
    } catch (e) {
      console.error('[WebAPI] Error fetching asset:', e);
      return null;
    }
  }

  async getAssetCategories(): Promise<string[]> {
    console.log('[WebAPI] Fetching asset categories');
    try {
      const res = await trpcClient.assets.categories.query();
      const list = this.normalizeList<string>(res);
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
      const sites = await trpcClient.sites.list.query();
      const list = this.normalizeList<Site>(sites);
      console.log('[WebAPI] Fetched sites:', list.length);
      return list;
    } catch (e) {
      console.error('[WebAPI] Error fetching sites:', e);
      return [];
    }
  }

  async getClients(): Promise<Client[]> {
    console.log('[WebAPI] Fetching clients');
    try {
      const res = await trpcClient.sites.clients.query();
      const list = this.normalizeList<Client>(res);
      console.log('[WebAPI] Fetched clients:', list.length);
      return list;
    } catch (e) {
      console.error('[WebAPI] Error fetching clients:', e);
      return [];
    }
  }

  async getSiteById(id: string): Promise<Site | null> {
    console.log('[WebAPI] Fetching site by id:', id);
    try {
      const site = await trpcClient.sites.getById.query({ id });
      return site as Site | null;
    } catch (e) {
      console.error('[WebAPI] Error fetching site:', e);
      return null;
    }
  }

  async getZones(siteId?: string): Promise<Zone[]> {
    console.log('[WebAPI] Fetching zones for site:', siteId);
    try {
      const zones = await trpcClient.sites.zones.query({ siteId });
      return this.normalizeList<Zone>(zones);
    } catch (e) {
      console.error('[WebAPI] Error fetching zones:', e);
      return [];
    }
  }

  async getMissions(filters?: MissionFilters): Promise<Mission[]> {
    console.log('[WebAPI] Fetching missions with filters:', filters);
    try {
      const missions = await trpcClient.missions.list.query({
        siteId: filters?.siteId,
        status: filters?.status,
        assignedTo: filters?.assignedTo,
      });
      return this.normalizeList<Mission>(missions);
    } catch (e) {
      console.error('[WebAPI] Error fetching missions:', e);
      return [];
    }
  }

  async getMissionById(id: string): Promise<Mission | null> {
    console.log('[WebAPI] Fetching mission by id:', id);
    try {
      const mission = await trpcClient.missions.getById.query({ id });
      const result = (mission as any)?.json ?? mission;
      if (!result) return null;
      
      const assets = await trpcClient.missions.getAssets.query({ missionId: id });
      const assetsList = (assets as any)?.json ?? assets;
      return { ...result, assets: assetsList } as Mission;
    } catch (e) {
      console.error('[WebAPI] Error fetching mission:', e);
      return null;
    }
  }

  async getMissionAssets(missionId: string): Promise<Asset[]> {
    console.log('[WebAPI] Fetching mission assets:', missionId);
    try {
      const assets = await trpcClient.missions.getAssets.query({ missionId });
      return this.normalizeList<Asset>(assets);
    } catch (e) {
      console.error('[WebAPI] Error fetching mission assets:', e);
      return [];
    }
  }

  async updateMissionStatus(id: string, status: string): Promise<void> {
    console.log('[WebAPI] Updating mission status:', id, status);
    try {
      await trpcClient.missions.updateStatus.mutate({ 
        id, 
        status: status as "A_PLANIFIER" | "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE" 
      });
    } catch (e) {
      console.error('[WebAPI] Error updating mission status:', e);
    }
  }

  async createMission(data: { control_type_id: string; scheduled_at: string; assigned_to: string; site_id: string; asset_ids: string[] }): Promise<string> {
    console.log('[WebAPI] Creating mission:', data);
    try {
      const result = await trpcClient.missions.create.mutate(data);
      return result.id;
    } catch (e) {
      console.error('[WebAPI] Error creating mission:', e);
      throw e;
    }
  }

  async getNonConformities(filters?: NCFilters): Promise<NonConformity[]> {
    console.log('[WebAPI] Fetching NCs with filters:', filters);
    try {
      const ncs = await trpcClient.nc.list.query({
        status: filters?.status,
        assetId: filters?.assetId,
        severity: filters?.severity,
      });
      const list = (ncs as any)?.json ?? ncs;
      console.log('[WebAPI] Fetched NCs:', Array.isArray(list) ? list.length : 'undefined');
      return (list as NonConformity[]) || [];
    } catch (e) {
      console.error('[WebAPI] Error fetching NCs:', e);
      return [];
    }
  }

  async getNCById(id: string): Promise<NonConformity | null> {
    console.log('[WebAPI] Fetching NC by id:', id);
    try {
      const nc = await trpcClient.nc.getById.query({ id });
      return nc as NonConformity | null;
    } catch (e) {
      console.error('[WebAPI] Error fetching NC:', e);
      return null;
    }
  }

  async createNC(data: { asset_id: string; title: string; description: string; severity: number; report_id?: string }): Promise<string> {
    console.log('[WebAPI] Creating NC:', data);
    try {
      const result = await trpcClient.nc.create.mutate(data);
      return result.id;
    } catch (e) {
      console.error('[WebAPI] Error creating NC:', e);
      throw e;
    }
  }

  async updateNCStatus(id: string, status: string): Promise<void> {
    console.log('[WebAPI] Updating NC status:', id, status);
    try {
      await trpcClient.nc.updateStatus.mutate({ 
        id, 
        status: status as "OUVERTE" | "EN_COURS" | "CLOTUREE" 
      });
    } catch (e) {
      console.error('[WebAPI] Error updating NC status:', e);
    }
  }

  async createCorrectiveAction(data: { nonconformity_id: string; owner: string; due_at: string; description: string }): Promise<string> {
    console.log('[WebAPI] Creating corrective action:', data);
    try {
      const result = await trpcClient.nc.createAction.mutate(data);
      return result.id;
    } catch (e) {
      console.error('[WebAPI] Error creating action:', e);
      throw e;
    }
  }

  async updateActionStatus(id: string, status: string, validatedBy?: string): Promise<void> {
    console.log('[WebAPI] Updating action status:', id, status);
    try {
      await trpcClient.nc.updateActionStatus.mutate({ 
        id, 
        status: status as "OUVERTE" | "EN_COURS" | "CLOTUREE" | "VALIDEE",
        validatedBy 
      });
    } catch (e) {
      console.error('[WebAPI] Error updating action status:', e);
    }
  }

  async getControlTypes(): Promise<ControlType[]> {
    console.log('[WebAPI] Fetching control types');
    try {
      const types = await trpcClient.controls.types.query();
      const list = (types as any)?.json ?? types;
      console.log('[WebAPI] Fetched control types:', Array.isArray(list) ? list.length : 'undefined');
      return (list as ControlType[]) || [];
    } catch (e) {
      console.error('[WebAPI] Error fetching control types:', e);
      return [];
    }
  }

  async getDueEcheances(filters?: { siteId?: string; overdueOnly?: boolean; dueSoonDays?: number }) {
    console.log('[WebAPI] Fetching due echeances:', filters);
    try {
      const res = await trpcClient.controls.dueEcheances.query(filters);
      const list = (res as any)?.json ?? res;
      console.log('[WebAPI] Fetched echeances:', Array.isArray(list) ? list.length : 'undefined');
      return list;
    } catch (e) {
      console.error('[WebAPI] Error fetching due echeances:', e);
      return [];
    }
  }
}

export const webApiService = new WebApiService();
