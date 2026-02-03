// Types de base pour toutes les entités principales
export interface Asset {
  id: string;
  code_interne: string;
  designation: string;
  categorie: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  annee?: number;
  statut: string;
  criticite?: number;
  site_id: string;
  zone_id?: string;
  mise_en_service?: string;
  created_at: string;
}

export interface Mission {
  id: string;
  control_type_id: string;
  scheduled_at: string;
  assigned_to: string;
  status: string;
  site_id: string;
  created_at: string;
}

export interface NonConformity {
  id: string;
  report_id?: string;
  asset_id: string;
  checklist_item_id?: string;
  title: string;
  description?: string;
  severity: number;
  status: string;
  created_at: string;
}

export interface Report {
  id: string;
  mission_id: string;
  asset_id: string;
  performed_at: string;
  performer: string;
  conclusion: string;
  summary?: string;
  signed_by_name?: string;
  signed_at?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}
