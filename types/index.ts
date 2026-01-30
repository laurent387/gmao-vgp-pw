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

export interface Client {
  id: string;
  name: string;
  siret?: string | null;
  tva_number?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  access_instructions?: string | null;
  billing_address?: string | null;
  billing_email?: string | null;
  internal_notes?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'SUSPENDED';
  created_at: string;
  // Computed stats (optional, from getClientStats)
  asset_count?: number;
  site_count?: number;
  last_report_date?: string | null;
  next_due_date?: string | null;
}

export interface Site {
  id: string;
  client_id: string;
  name: string;
  address?: string;
  created_at: string;
  client_name?: string;
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
  vgp_enabled?: boolean;
  vgp_validity_months?: number | null;
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
  entity_type: 'asset' | 'report' | 'action' | 'maintenance' | 'nc';
  entity_id: string;
  local_uri: string;
  mime: string;
  sha256: string | null;
  uploaded_at: string;
  synced: boolean;
  server_url?: string | null;
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

// =============================================
// VGP PRESSES TYPES
// =============================================

export type VGPItemResult = 'OUI' | 'NON' | 'NA';
export type VGPConclusion = 'EN_COURS' | 'CONFORME' | 'NON_CONFORME' | 'CONFORME_SOUS_RESERVE';
export type VGPRunStatus = 'BROUILLON' | 'VALIDE';
export type VGPObservationStatus = 'OUVERTE' | 'RESOLUE' | 'TRAITEE';

export interface VGPTemplate {
  id: string;
  name: string;
  machine_type: string;
  version: number;
  active: boolean;
  referentiel: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  sections?: VGPTemplateSection[];
}

export interface VGPTemplateSection {
  id: string;
  template_id: string;
  code: string;
  title: string;
  sort_order: number;
  items?: VGPTemplateItem[];
}

export interface VGPTemplateItem {
  id: string;
  section_id: string;
  numero: number;
  label: string;
  help_text: string | null;
  sort_order: number;
  active: boolean;
  section_code?: string;
  section_title?: string;
  result?: VGPItemResultRecord | null;
}

export interface VGPReport {
  id: string;
  client_id: string;
  site_id: string;
  numero_rapport: string;
  date_rapport: string;
  signataire: string;
  synthese: string | null;
  has_observations: boolean;
  pdf_path: string | null;
  pdf_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  client_name?: string;
  site_name?: string;
  runs?: VGPInspectionRun[];
}

export interface VGPInspectionRun {
  id: string;
  report_id: string;
  template_id: string;
  asset_id: string;
  date_inspection: string;
  verificateur: string;
  compteur_type: string | null;
  compteur_valeur: number | null;
  conditions_intervention: string | null;
  modes_fonctionnement: string | null;
  moyens_disposition: boolean;
  conclusion: VGPConclusion;
  particularites: string | null;
  statut: VGPRunStatus;
  signed_by: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  asset_code?: string;
  asset_designation?: string;
  asset_marque?: string;
  asset_modele?: string;
  asset_numero_serie?: string;
  asset_annee?: number;
  asset_force?: string;
  observationCount?: number;
  template?: VGPTemplate;
  sections?: VGPTemplateSection[];
  observations?: VGPObservation[];
}

export interface VGPItemResultRecord {
  id: string;
  run_id: string;
  item_id: string;
  result: VGPItemResult;
  comment: string | null;
  photos: any;
  created_at: string;
  updated_at: string;
  item_numero?: number;
  item_label?: string;
  section_code?: string;
}

export interface VGPObservation {
  id: string;
  run_id: string;
  asset_id: string;
  item_id: string | null;
  item_numero: number | null;
  description: string;
  recommandation: string | null;
  gravite: number;
  statut: VGPObservationStatus;
  is_auto: boolean;
  pieces_jointes: any;
  created_at: string;
  updated_at: string;
  asset_code?: string;
  asset_designation?: string;
}

// =============================================
// ATTACHMENTS & DOCUMENTS MODULE
// =============================================

export type AttachmentOwnerType = 'EQUIPMENT' | 'REPORT' | 'VGP_REPORT' | 'VGP_RUN';
export type AttachmentFileType = 'PDF' | 'IMAGE';
export type AttachmentCategory = 
  | 'DOCUMENTATION'
  | 'CERTIFICAT_LEGAL'
  | 'RAPPORT'
  | 'PLAQUE_IDENTIFICATION'
  | 'PHOTO'
  | 'AUTRE';
export type AttachmentStatus = 'ACTIVE' | 'ARCHIVED';

export interface Attachment {
  id: string;
  owner_type: AttachmentOwnerType;
  owner_id: string;
  file_type: AttachmentFileType;
  category: AttachmentCategory;
  title: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  is_private: boolean;
  checksum: string | null;
  status: AttachmentStatus;
  version_number: number;
  parent_id: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
  archived_at: string | null;
  // Virtual fields
  download_url?: string;
  uploader_name?: string;
}

export interface AttachmentUploadInput {
  ownerType: AttachmentOwnerType;
  ownerId: string;
  category: AttachmentCategory;
  title: string;
  isPrivate?: boolean;
}

export interface AttachmentUpdateInput {
  title?: string;
  category?: AttachmentCategory;
  isPrivate?: boolean;
}
