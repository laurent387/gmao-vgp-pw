import { Type } from '@sinclair/typebox';

export const AssetSchema = Type.Object({
  id: Type.String(),
  code_interne: Type.String(),
  designation: Type.String(),
  categorie: Type.String(),
  marque: Type.Optional(Type.String()),
  modele: Type.Optional(Type.String()),
  numero_serie: Type.Optional(Type.String()),
  annee: Type.Optional(Type.Number()),
  statut: Type.String(),
  criticite: Type.Optional(Type.Number()),
  site_id: Type.String(),
  zone_id: Type.Optional(Type.String()),
  mise_en_service: Type.Optional(Type.String()),
  created_at: Type.String(),
});

// Partial schema for PATCH/PUT updates - all fields optional
export const AssetUpdateSchema = Type.Object({
  code_interne: Type.Optional(Type.String()),
  designation: Type.Optional(Type.String()),
  categorie: Type.Optional(Type.String()),
  marque: Type.Optional(Type.String()),
  modele: Type.Optional(Type.String()),
  numero_serie: Type.Optional(Type.String()),
  annee: Type.Optional(Type.Number()),
  statut: Type.Optional(Type.String()),
  criticite: Type.Optional(Type.Number()),
  site_id: Type.Optional(Type.String()),
  zone_id: Type.Optional(Type.String()),
  mise_en_service: Type.Optional(Type.String()),
  vgp_enabled: Type.Optional(Type.Boolean()),
  vgp_validity_months: Type.Optional(Type.Number()),
  next_control_date: Type.Optional(Type.String()),
});

export const MissionSchema = Type.Object({
  id: Type.String(),
  control_type_id: Type.String(),
  scheduled_at: Type.String(),
  assigned_to: Type.String(),
  status: Type.String(),
  site_id: Type.String(),
  created_at: Type.String(),
});

export const NonConformitySchema = Type.Object({
  id: Type.String(),
  report_id: Type.Optional(Type.String()),
  asset_id: Type.String(),
  checklist_item_id: Type.Optional(Type.String()),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  severity: Type.Number(),
  status: Type.String(),
  created_at: Type.String(),
});

// Schema for creating a new NC (fewer required fields)
export const NonConformityCreateSchema = Type.Object({
  asset_id: Type.String(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  severity: Type.Number(),
  report_id: Type.Optional(Type.String()),
  checklist_item_id: Type.Optional(Type.String()),
});

// Schema for updating a NC (all fields optional)
export const NonConformityUpdateSchema = Type.Object({
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  severity: Type.Optional(Type.Number()),
  status: Type.Optional(Type.String()),
});

export const ReportSchema = Type.Object({
  id: Type.String(),
  mission_id: Type.String(),
  asset_id: Type.String(),
  performed_at: Type.String(),
  performer: Type.String(),
  conclusion: Type.String(),
  summary: Type.Optional(Type.String()),
  signed_by_name: Type.Optional(Type.String()),
  signed_at: Type.Optional(Type.String()),
  created_at: Type.String(),
});

export const UserSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.String(),
  role: Type.String(),
  created_at: Type.String(),
});
