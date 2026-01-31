/**
 * Navigation helpers for centralized route management
 * Prevents broken links and ensures consistent navigation patterns
 */

import { useRouter } from 'expo-router';

// Route parameter types
export interface ClientRouteParams {
  id: string;
}

export interface SiteRouteParams {
  id: string;
  clientId?: string;
}

export interface EquipmentRouteParams {
  id: string;
  siteId?: string;
  clientId?: string;
}

export interface ReportRouteParams {
  id: string;
}

export interface NCRouteParams {
  id: string;
  assetId?: string;
}

export interface MissionRouteParams {
  id: string;
}

// Route builders - centralized route construction
export const routes = {
  profile: () => '/profile',
  profileEdit: () => '/profile-edit',
  
  clientDetail: (id: string) => ({
    pathname: '/client/[id]' as const,
    params: { id },
  }),
  
  equipmentDetail: (id: string, siteId?: string, clientId?: string) => ({
    pathname: '/asset/[id]' as const,
    params: { id, ...(siteId && { siteId }), ...(clientId && { clientId }) },
  }),
  
  missionDetail: (id: string) => ({
    pathname: '/mission/[id]' as const,
    params: { id },
  }),
  
  ncDetail: (id: string, assetId?: string) => ({
    pathname: '/nc/[id]' as const,
    params: { id, ...(assetId && { assetId }) },
  }),
  
  // Tab screens with optional filters
  inventory: (siteId?: string, clientId?: string) => ({
    pathname: '/(tabs)/inventory' as const,
    params: { ...(siteId && { siteId }), ...(clientId && { clientId }) },
  }),
  
  planning: (status?: 'overdue' | 'due30', assetId?: string) => ({
    pathname: '/(tabs)/planning' as const,
    params: { ...(status && { status }), ...(assetId && { assetId }) },
  }),
  
  sites: () => '/(tabs)/sites',
  dashboard: () => '/(tabs)',
  missions: () => '/(tabs)/missions',
  nc: () => '/(tabs)/nc',
  admin: () => '/(tabs)/admin',
  sync: () => '/(tabs)/sync',
};

// Navigation helpers hook
export const useNavigation = () => {
  const router = useRouter();

  return {
    // Profile navigation
    goToProfile: () => router.push(routes.profile() as any),
    goToProfileEdit: () => router.push(routes.profileEdit() as any),
    
    // Entity navigation
    goToClient: (id: string) => router.push(routes.clientDetail(id) as any),
    goToEquipment: (id: string, siteId?: string, clientId?: string) =>
      router.push(routes.equipmentDetail(id, siteId, clientId) as any),
    goToMission: (id: string) => router.push(routes.missionDetail(id) as any),
    goToNonConformity: (id: string, assetId?: string) => router.push(routes.ncDetail(id, assetId) as any),
    
    // List views with filters
    goToInventory: (siteId?: string, clientId?: string) =>
      router.push(routes.inventory(siteId, clientId) as any),
    goToPlanning: (status?: 'overdue' | 'due30', assetId?: string) =>
      router.push(routes.planning(status, assetId) as any),
    goToSites: () => router.push(routes.sites() as any),
    goToDashboard: () => router.push(routes.dashboard() as any),
    goToMissions: () => router.push(routes.missions() as any),
    goToNCList: () => router.push(routes.nc() as any),
    goToAdmin: () => router.push(routes.admin() as any),
    goToSync: () => router.push(routes.sync() as any),
    
    // Generic push (for custom navigation)
    push: (path: any) => router.push(path),
    replace: (path: any) => router.replace(path),
    back: () => router.back(),
  };
};

/**
 * Deep link builder for external navigation
 * Used for notifications, deep linking from URLs, etc.
 */
export const buildDeepLink = (type: string, id: string, params?: Record<string, string>) => {
  const baseUrl = 'in-spectra://';
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
  
  switch (type) {
    case 'client':
      return `${baseUrl}client/${id}${queryString}`;
    case 'equipment':
      return `${baseUrl}equipment/${id}${queryString}`;
    case 'mission':
      return `${baseUrl}mission/${id}${queryString}`;
    case 'nc':
      return `${baseUrl}nc/${id}${queryString}`;
    default:
      return `${baseUrl}`;
  }
};

/**
 * Parse deep links and navigate to appropriate screen
 */
export const parseDeepLink = (
  url: string
): { type: string; id: string; params?: Record<string, string> } | null => {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    
    if (segments.length < 2) return null;
    
    const [type, id] = segments;
    const params: Record<string, string> = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return { type, id, params };
  } catch {
    return null;
  }
};

/**
 * Hook to handle deep link navigation
 */
export const useDeepLinkNavigation = () => {
  const nav = useNavigation();

  return (deepLink: string) => {
    const parsed = parseDeepLink(deepLink);
    if (!parsed) return false;

    switch (parsed.type) {
      case 'client':
        nav.goToClient(parsed.id);
        return true;
      case 'equipment':
        nav.goToEquipment(parsed.id, parsed.params?.siteId, parsed.params?.clientId);
        return true;
      case 'mission':
        nav.goToMission(parsed.id);
        return true;
      case 'nc':
        nav.goToNonConformity(parsed.id, parsed.params?.assetId);
        return true;
      default:
        return false;
    }
  };
};

/**
 * Helper to construct accessible labels for screen reader
 */
export const getAccessibilityLabel = (
  type: 'client' | 'site' | 'equipment' | 'report' | 'mission' | 'nc',
  name?: string
): string => {
  const typeLabel = {
    client: 'Client',
    site: 'Site',
    equipment: 'Équipement',
    report: 'Rapport',
    mission: 'Mission',
    nc: 'Non-conformité',
  }[type];

  return name ? `${typeLabel}: ${name}` : typeLabel;
};
