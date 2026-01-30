import {
  canViewClientField,
  canEditClient,
  canCreateClient,
  canDeleteClient,
  canViewAdminSection,
  getVisibleClientFields,
  getClientStatusInfo,
  ClientField,
} from '../clientPermissions';

describe('clientPermissions', () => {
  describe('canViewClientField', () => {
    // Public fields that all roles can see
    const publicFields: ClientField[] = [
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

    // Admin-only fields
    const adminOnlyFields: ClientField[] = [
      'siret',
      'tva_number',
      'billing_address',
      'billing_email',
      'internal_notes',
    ];

    describe('ADMIN role', () => {
      it('should be able to view all public fields', () => {
        publicFields.forEach((field) => {
          expect(canViewClientField('ADMIN', field)).toBe(true);
        });
      });

      it('should be able to view all admin-only fields', () => {
        adminOnlyFields.forEach((field) => {
          expect(canViewClientField('ADMIN', field)).toBe(true);
        });
      });
    });

    describe('HSE_MANAGER role', () => {
      it('should be able to view all public fields', () => {
        publicFields.forEach((field) => {
          expect(canViewClientField('HSE_MANAGER', field)).toBe(true);
        });
      });

      it('should be able to view all admin-only fields', () => {
        adminOnlyFields.forEach((field) => {
          expect(canViewClientField('HSE_MANAGER', field)).toBe(true);
        });
      });
    });

    describe('TECHNICIAN role', () => {
      it('should be able to view all public fields', () => {
        publicFields.forEach((field) => {
          expect(canViewClientField('TECHNICIAN', field)).toBe(true);
        });
      });

      it('should NOT be able to view admin-only fields', () => {
        adminOnlyFields.forEach((field) => {
          expect(canViewClientField('TECHNICIAN', field)).toBe(false);
        });
      });
    });

    describe('AUDITOR role', () => {
      it('should be able to view all public fields', () => {
        publicFields.forEach((field) => {
          expect(canViewClientField('AUDITOR', field)).toBe(true);
        });
      });

      it('should NOT be able to view admin-only fields', () => {
        adminOnlyFields.forEach((field) => {
          expect(canViewClientField('AUDITOR', field)).toBe(false);
        });
      });
    });

    describe('null/undefined role', () => {
      it('should return false for any field', () => {
        expect(canViewClientField(null, 'name')).toBe(false);
        expect(canViewClientField(undefined, 'name')).toBe(false);
        expect(canViewClientField(null, 'siret')).toBe(false);
      });
    });
  });

  describe('canEditClient', () => {
    it('should allow ADMIN to edit', () => {
      expect(canEditClient('ADMIN')).toBe(true);
    });

    it('should allow HSE_MANAGER to edit', () => {
      expect(canEditClient('HSE_MANAGER')).toBe(true);
    });

    it('should NOT allow TECHNICIAN to edit', () => {
      expect(canEditClient('TECHNICIAN')).toBe(false);
    });

    it('should NOT allow AUDITOR to edit', () => {
      expect(canEditClient('AUDITOR')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(canEditClient(null)).toBe(false);
      expect(canEditClient(undefined)).toBe(false);
    });
  });

  describe('canCreateClient', () => {
    it('should allow ADMIN to create', () => {
      expect(canCreateClient('ADMIN')).toBe(true);
    });

    it('should allow HSE_MANAGER to create', () => {
      expect(canCreateClient('HSE_MANAGER')).toBe(true);
    });

    it('should NOT allow TECHNICIAN to create', () => {
      expect(canCreateClient('TECHNICIAN')).toBe(false);
    });

    it('should NOT allow AUDITOR to create', () => {
      expect(canCreateClient('AUDITOR')).toBe(false);
    });
  });

  describe('canDeleteClient', () => {
    it('should allow ADMIN to delete', () => {
      expect(canDeleteClient('ADMIN')).toBe(true);
    });

    it('should NOT allow HSE_MANAGER to delete', () => {
      expect(canDeleteClient('HSE_MANAGER')).toBe(false);
    });

    it('should NOT allow TECHNICIAN to delete', () => {
      expect(canDeleteClient('TECHNICIAN')).toBe(false);
    });
  });

  describe('canViewAdminSection', () => {
    it('should return true for ADMIN', () => {
      expect(canViewAdminSection('ADMIN')).toBe(true);
    });

    it('should return true for HSE_MANAGER', () => {
      expect(canViewAdminSection('HSE_MANAGER')).toBe(true);
    });

    it('should return false for TECHNICIAN', () => {
      expect(canViewAdminSection('TECHNICIAN')).toBe(false);
    });

    it('should return false for AUDITOR', () => {
      expect(canViewAdminSection('AUDITOR')).toBe(false);
    });
  });

  describe('getVisibleClientFields', () => {
    it('should return all fields for ADMIN', () => {
      const fields = getVisibleClientFields('ADMIN');
      expect(fields).toContain('name');
      expect(fields).toContain('siret');
      expect(fields).toContain('internal_notes');
    });

    it('should return only public fields for TECHNICIAN', () => {
      const fields = getVisibleClientFields('TECHNICIAN');
      expect(fields).toContain('name');
      expect(fields).not.toContain('siret');
      expect(fields).not.toContain('internal_notes');
    });

    it('should return empty array for null role', () => {
      expect(getVisibleClientFields(null)).toEqual([]);
    });
  });

  describe('getClientStatusInfo', () => {
    it('should return correct info for ACTIVE status', () => {
      const info = getClientStatusInfo('ACTIVE');
      expect(info.label).toBe('Actif');
      expect(info.color).toBe('#10B981');
    });

    it('should return correct info for INACTIVE status', () => {
      const info = getClientStatusInfo('INACTIVE');
      expect(info.label).toBe('Inactif');
    });

    it('should return correct info for PROSPECT status', () => {
      const info = getClientStatusInfo('PROSPECT');
      expect(info.label).toBe('Prospect');
    });

    it('should return correct info for SUSPENDED status', () => {
      const info = getClientStatusInfo('SUSPENDED');
      expect(info.label).toBe('Suspendu');
    });

    it('should return fallback for unknown status', () => {
      const info = getClientStatusInfo('UNKNOWN');
      expect(info.label).toBe('UNKNOWN');
    });
  });
});
