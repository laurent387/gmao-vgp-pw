export type UserRole = 'ADMIN' | 'HSE_MANAGER' | 'TECHNICIAN' | 'AUDITOR';

export type AssetStatus = 'EN_SERVICE' | 'HORS_SERVICE' | 'REBUT' | 'EN_LOCATION';

export type ControlConclusion = 'CONFORME' | 'NON_CONFORME' | 'CONFORME_SOUS_RESERVE';

export type MissionStatus = 'A_PLANIFIER' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export type NCStatus = 'OUVERTE' | 'EN_COURS' | 'CLOTUREE';

export type ActionStatus = 'OUVERTE' | 'EN_COURS' | 'CLOTUREE' | 'VALIDEE';

export type ChecklistItemStatus = 'OK' | 'KO' | 'NA';

export type FieldType = 'BOOL' | 'NUM' | 'TEXT';

export type OutboxStatus = 'PENDING' | 'SENT' | 'ERROR';

export type OperationType = 'MAINTENANCE' | 'INSPECTION' | 'REPARATION' | 'MODIFICATION';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token_mock: string | null;
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  address?: string;
  created_at: string;
}

export interface Zone {
  id: string;
  site_id: string;
  name: string;
  site_name?: string;
}

export interface Asset {
  id: string;
  code_interne: string;
  designation: string;
  categorie: string;
  marque: string;
  modele: string;
  numero_serie: string;
  annee: number;
  statut: AssetStatus;
  criticite: SeverityLevel;
  site_id: string;
  zone_id: string;
  mise_en_service: string | null;
  created_at: string;
  site_name?: string;
  zone_name?: string;
  next_due_at?: string | null;
  is_overdue?: boolean;
}

export interface ControlType {
  id: string;
  code: string;
  label: string;
  description: string;
  periodicity_days: number;
  active: boolean;
}

export interface AssetControl {
  id: string;
  asset_id: string;
  control_type_id: string;
  start_date: string;
  last_done_at: string | null;
  next_due_at: string | null;
  control_type?: ControlType;
  asset?: Asset;
}

export interface ChecklistTemplate {
  id: string;
  control_type_id: string;
  asset_category: string | null;
  name: string;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  help_text: string | null;
  sort_order: number;
}

export interface Mission {
  id: string;
  control_type_id: string;
  scheduled_at: string;
  assigned_to: string;
  status: MissionStatus;
  site_id: string;
  created_at: string;
  control_type?: ControlType;
  site_name?: string;
  assigned_to_name?: string;
  assets?: Asset[];
}

export interface MissionAsset {
  id: string;
  mission_id: string;
  asset_id: string;
}

export interface Report {
  id: string;
  mission_id: string;
  asset_id: string;
  performed_at: string;
  performer: string;
  conclusion: ControlConclusion;
  summary: string;
  signed_by_name: string | null;
  signed_at: string | null;
  created_at: string;
  asset?: Asset;
  items?: ReportItemResult[];
}

export interface ReportItemResult {
  id: string;
  report_id: string;
  checklist_item_id: string;
  status: ChecklistItemStatus;
  value_num: number | null;
  value_text: string | null;
  comment: string | null;
  checklist_item?: ChecklistItem;
}

export interface NonConformity {
  id: string;
  report_id: string | null;
  asset_id: string;
  checklist_item_id: string | null;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: NCStatus;
  created_at: string;
  asset?: Asset;
  corrective_action?: CorrectiveAction;
}

export interface CorrectiveAction {
  id: string;
  nonconformity_id: string;
  owner: string;
  due_at: string;
  status: ActionStatus;
  closed_at: string | null;
  validated_by: string | null;
  description?: string;
}

export interface MaintenanceLog {
  id: string;
  asset_id: string;
  date: string;
  actor: string;
  operation_type: OperationType;
  description: string;
  parts_ref: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  entity_type: 'asset' | 'report' | 'action' | 'maintenance';
  entity_id: string;
  local_uri: string;
  mime: string;
  sha256: string | null;
  uploaded_at: string;
  synced: boolean;
}

export interface OutboxItem {
  id: string;
  type: string;
  payload_json: string;
  created_at: string;
  status: OutboxStatus;
  last_error: string | null;
}

export interface DashboardKPIs {
  totalAssets: number;
  overdueControls: number;
  dueSoon30Days: number;
  openNCs: number;
  overdueActions: number;
  pendingSyncItems: number;
}

export interface DueEcheance {
  id: string;
  asset_id: string;
  asset_code: string;
  asset_designation: string;
  control_type_label: string;
  next_due_at: string;
  days_remaining: number;
  is_overdue: boolean;
  site_name: string;
}
