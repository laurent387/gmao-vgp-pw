import { UserRole } from '@/types';

/**
 * Client fields that can be controlled by permissions
 */
export type ClientField =
  | 'name'
  | 'id'
  | 'status'
  | 'contact_name'
  | 'contact_email'
  | 'contact_phone'
  | 'address'
  | 'access_instructions'
  | 'siret'
  | 'tva_number'
  | 'billing_address'
  | 'billing_email'
  | 'internal_notes'
  | 'created_at'
  | 'asset_count'
  | 'last_report_date'
  | 'next_due_date';

/**
 * Field visibility rules by role
 * 
 * ADMIN: Full access to all fields
 * HSE_MANAGER: Full access to all fields (same as ADMIN for clients)
 * TECHNICIAN: Can see identity, contact, address, access instructions - NO financial/internal info
 * AUDITOR: Read-only, same as TECHNICIAN
 * CLIENT (external, not in system yet): Public info only
 */

// Fields visible to all authenticated users
const PUBLIC_FIELDS: ClientField[] = [
  'name',
  'id',
  'status',
  'contact_name',
  'contact_email',
  'contact_phone',
  'address',
  'access_instructions',
  'created_at',
  'asset_count',
  'last_report_date',
  'next_due_date',
];

// Fields only visible to admin/managers
const ADMIN_ONLY_FIELDS: ClientField[] = [
  'siret',
  'tva_number',
  'billing_address',
  'billing_email',
  'internal_notes',
];

// All fields
const ALL_FIELDS: ClientField[] = [...PUBLIC_FIELDS, ...ADMIN_ONLY_FIELDS];

/**
 * Check if a user role can view a specific client field
 */
export function canViewClientField(role: UserRole | undefined | null, field: ClientField): boolean {
  if (!role) return false;

  // Admin and HSE_MANAGER can see everything
  if (role === 'ADMIN' || role === 'HSE_MANAGER') {
    return true;
  }

  // TECHNICIAN and AUDITOR can see public fields only
  if (role === 'TECHNICIAN' || role === 'AUDITOR') {
    return PUBLIC_FIELDS.includes(field);
  }

  return false;
}

/**
 * Check if a user role can edit client information
 */
export function canEditClient(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'HSE_MANAGER';
}

/**
 * Check if a user role can create new clients
 */
export function canCreateClient(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'HSE_MANAGER';
}

/**
 * Check if a user role can delete clients
 */
export function canDeleteClient(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === 'ADMIN';
}

/**
 * Get the list of visible fields for a role
 */
export function getVisibleClientFields(role: UserRole | undefined | null): ClientField[] {
  if (!role) return [];

  if (role === 'ADMIN' || role === 'HSE_MANAGER') {
    return ALL_FIELDS;
  }

  return PUBLIC_FIELDS;
}

/**
 * Check if a role can see admin-only sections (financial, internal notes)
 */
export function canViewAdminSection(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  return role === 'ADMIN' || role === 'HSE_MANAGER';
}

/**
 * Client status options
 */
export const CLIENT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif', color: '#10B981' },
  { value: 'INACTIVE', label: 'Inactif', color: '#94A3B8' },
  { value: 'PROSPECT', label: 'Prospect', color: '#F59E0B' },
  { value: 'SUSPENDED', label: 'Suspendu', color: '#EF4444' },
] as const;

export type ClientStatus = typeof CLIENT_STATUS_OPTIONS[number]['value'];

/**
 * Get status label and color
 */
export function getClientStatusInfo(status: string): { label: string; color: string } {
  const found = CLIENT_STATUS_OPTIONS.find((s) => s.value === status);
  return found || { label: status, color: '#94A3B8' };
}
