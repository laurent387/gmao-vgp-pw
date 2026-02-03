import axios from 'axios';

const API_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://api.in-spectra.com';

export const api = axios.create({
  baseURL: API_URL,
  // headers: { Authorization: `Bearer ${token}` } // à ajouter après login
});

// Function to set auth token for all API requests
export const setApiAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Assets
export const getAssets = (params?: Record<string, unknown>) => api.get('/assets', { params });
export const getAsset = (id: string) => api.get(`/assets/${id}`);
export const getAssetCategories = () => api.get('/assets/categories');
export const createAsset = (data: Record<string, unknown>) => api.post('/assets', data);
export const updateAsset = (id: string, data: Record<string, unknown>) => api.put(`/assets/${id}`, data);
export const deleteAsset = (id: string) => api.delete(`/assets/${id}`);
export const importAssets = (data: Record<string, unknown>) => api.post('/assets/import', data);
export const exportAssets = () => api.get('/assets/export');

// Missions
export const getMissions = (params?: Record<string, unknown>) => api.get('/missions', { params });
export const getMission = (id: string) => api.get(`/missions/${id}`);
export const createMission = (data: Record<string, unknown>) => api.post('/missions', data);
export const updateMission = (id: string, data: Record<string, unknown>) => api.put(`/missions/${id}`, data);
export const deleteMission = (id: string) => api.delete(`/missions/${id}`);
export const importMissions = (data: Record<string, unknown>) => api.post('/missions/import', data);
export const exportMissions = () => api.get('/missions/export');

// Mission operation assets (operations -> assets -> checklist)
export const getMissionOperationAssets = (missionId: string) => api.get(`/missions/${missionId}/operation-assets`);
export const updateMissionOperationAsset = (missionId: string, id: number | string, data: Record<string, unknown>) =>
  api.put(`/missions/${missionId}/operation-assets/${id}`, data);

// Operation checklists (templates)
export const getOperationChecklists = (params?: Record<string, unknown>) => api.get('/operation-checklists', { params });
export const getOperationChecklist = (id: number | string) => api.get(`/operation-checklists/${id}`);
export const createOperationChecklist = (data: Record<string, unknown>) => api.post('/operation-checklists', data);
export const updateOperationChecklist = (id: number | string, data: Record<string, unknown>) =>
  api.put(`/operation-checklists/${id}`, data);
export const deleteOperationChecklist = (id: number | string) => api.delete(`/operation-checklists/${id}`);

// Nonconformities
export const getNonconformities = (params?: Record<string, unknown>) => api.get('/nonconformities', { params });
export const getNonconformity = (id: string) => api.get(`/nonconformities/${id}`);
export const createNonconformity = (data: Record<string, unknown>) => api.post('/nonconformities', data);
export const updateNonconformity = (id: string, data: Record<string, unknown>) => api.put(`/nonconformities/${id}`, data);
export const deleteNonconformity = (id: string) => api.delete(`/nonconformities/${id}`);
export const importNonconformities = (data: Record<string, unknown>) => api.post('/nonconformities/import', data);
export const exportNonconformities = () => api.get('/nonconformities/export');

// Reports
export const getReports = (params?: Record<string, unknown>) => api.get('/reports', { params });
export const getReport = (id: string) => api.get(`/reports/${id}`);
export const createReport = (data: Record<string, unknown>) => api.post('/reports', data);
export const updateReport = (id: string, data: Record<string, unknown>) => api.put(`/reports/${id}`, data);
export const deleteReport = (id: string) => api.delete(`/reports/${id}`);
export const importReports = (data: Record<string, unknown>) => api.post('/reports/import', data);
export const exportReports = () => api.get('/reports/export');

// Users
export const getUsers = (params?: Record<string, unknown>) => api.get('/users', { params });
export const getUser = (id: string) => api.get(`/users/${id}`);
export const getTechnicians = () => api.get('/users/technicians');
export const createUser = (data: Record<string, unknown>) => api.post('/users', data);
export const updateUser = (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);
export const importUsers = (data: Record<string, unknown>) => api.post('/users/import', data);
export const exportUsers = () => api.get('/users/export');
export const getResponsibleUsers = () => api.get('/users/responsible');
export const updateUserCanBeResponsible = (id: string, canBeResponsible: boolean) => 
  api.patch(`/users/${id}/can-be-responsible`, { canBeResponsible });

// Clients
export const getClients = (params?: Record<string, unknown>) => api.get('/clients', { params });
export const getClient = (id: string) => api.get(`/clients/${id}`);
export const createClient = (data: Record<string, unknown>) => api.post('/clients', data);
export const updateClient = (id: string, data: Record<string, unknown>) => api.put(`/clients/${id}`, data);
export const deleteClient = (id: string) => api.delete(`/clients/${id}`);

// Sites
export const getSites = (params?: Record<string, unknown>) => api.get('/sites', { params });
export const getSite = (id: string) => api.get(`/sites/${id}`);
export const createSite = (data: Record<string, unknown>) => api.post('/sites', data);
export const updateSite = (id: string, data: Record<string, unknown>) => api.put(`/sites/${id}`, data);
export const deleteSite = (id: string) => api.delete(`/sites/${id}`);

// Zones
export const getZones = (params?: Record<string, unknown>) => api.get('/zones', { params });
export const getZone = (id: string) => api.get(`/zones/${id}`);
export const createZone = (data: Record<string, unknown>) => api.post('/zones', data);
export const updateZone = (id: string, data: Record<string, unknown>) => api.put(`/zones/${id}`, data);
export const deleteZone = (id: string) => api.delete(`/zones/${id}`);

// Auth
export const login = (data: Record<string, unknown>) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Attachments
export const getAttachments = (params?: Record<string, unknown>) => api.get('/attachments', { params });
export const getAttachment = (id: string) => api.get(`/attachments/${id}`);
export const createAttachment = (data: Record<string, unknown>) => api.post('/attachments', data);
export const deleteAttachment = (id: string) => api.delete(`/attachments/${id}`);

// VGP
export const getVgpTemplates = (params?: Record<string, unknown>) => api.get('/vgp/templates', { params });
export const getVgpTemplate = (id: string) => api.get(`/vgp/templates/${id}`);
export const createVgpTemplate = (data: Record<string, unknown>) => api.post('/vgp/templates', data);
export const updateVgpTemplate = (id: string, data: Record<string, unknown>) => api.put(`/vgp/templates/${id}`, data);
export const getVgpControls = (params?: Record<string, unknown>) => api.get('/vgp/controls', { params });

// Controls
export const getControlTypes = () => api.get('/controls/types');
export const getDueEcheances = (params?: Record<string, unknown>) => api.get('/controls/due-echeances', { params });
export const getControls = (params?: Record<string, unknown>) => api.get('/controls', { params });

// Actions (Corrective Actions)
export const getActions = (params?: Record<string, unknown>) => api.get('/actions', { params });
export const getAction = (id: string) => api.get(`/actions/${id}`);
export const createAction = (data: Record<string, unknown>) => api.post('/actions', data);
export const updateAction = (id: string, data: Record<string, unknown>) => api.put(`/actions/${id}`, data);
export const deleteAction = (id: string) => api.delete(`/actions/${id}`);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

