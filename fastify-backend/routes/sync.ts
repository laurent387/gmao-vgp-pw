import { FastifyInstance } from 'fastify';
import { Client } from 'pg';

export async function syncRoutes(fastify: FastifyInstance, db: Client) {
  // GET /sync/pull - Pull all entities for offline sync
  fastify.get('/sync/pull', async (request, reply) => {
    // Verify JWT
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    console.log('[SYNC] Pull request via Fastify');

    try {
      const changes: Record<string, any[]> = {};

      // Clients
      const clientsRes = await db.query('SELECT id, name, created_at FROM clients ORDER BY name ASC');
      changes.clients = clientsRes.rows;

      // Users (exclude password_hash)
      const usersRes = await db.query('SELECT id, email, name, role, created_at FROM users ORDER BY name ASC');
      changes.users = usersRes.rows;

      // Sites
      const sitesRes = await db.query(`
        SELECT s.id, s.client_id, s.name, s.address, s.created_at
        FROM sites s ORDER BY s.name ASC
      `);
      changes.sites = sitesRes.rows;

      // Zones
      const zonesRes = await db.query(`
        SELECT z.id, z.site_id, z.name
        FROM zones z ORDER BY z.name ASC
      `);
      changes.zones = zonesRes.rows;

      // Assets
      const assetsRes = await db.query(`
        SELECT a.id, a.code_interne, a.designation, a.categorie, a.marque, a.modele,
               a.numero_serie, a.annee, a.statut, a.criticite, a.site_id, a.zone_id,
               a.mise_en_service, a.created_at,
               COALESCE(a.vgp_enabled, false) as vgp_enabled,
               a.vgp_validity_months
        FROM assets a ORDER BY a.code_interne ASC
      `);
      changes.assets = assetsRes.rows;

      // Control types
      const controlTypesRes = await db.query(`
        SELECT id, code, label, description, periodicity_days, active
        FROM control_types WHERE active = true ORDER BY label ASC
      `);
      changes.controlTypes = controlTypesRes.rows;

      // Asset controls
      const assetControlsRes = await db.query(`
        SELECT id, asset_id, control_type_id, start_date, last_done_at, next_due_at
        FROM asset_controls ORDER BY next_due_at ASC
      `);
      changes.assetControls = assetControlsRes.rows;

      // Missions
      const missionsRes = await db.query(`
        SELECT id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at
        FROM missions ORDER BY scheduled_at DESC
      `);
      changes.missions = missionsRes.rows;

      // Checklist templates
      const checklistTemplatesRes = await db.query(`
        SELECT id, control_type_id, asset_category, name
        FROM checklist_templates ORDER BY name ASC
      `);
      changes.checklistTemplates = checklistTemplatesRes.rows;

      // Checklist items
      const checklistItemsRes = await db.query(`
        SELECT id, template_id, label, field_type, required, help_text, sort_order
        FROM checklist_items ORDER BY template_id, sort_order ASC
      `);
      changes.checklistItems = checklistItemsRes.rows;

      // Reports
      const reportsRes = await db.query(`
        SELECT id, mission_id, asset_id, performed_at, performer,
               conclusion, summary, signed_by_name, signed_at, created_at
        FROM reports ORDER BY created_at DESC
      `);
      changes.reports = reportsRes.rows;

      // Nonconformities
      const nonconformitiesRes = await db.query(`
        SELECT id, report_id, asset_id, checklist_item_id, title,
               description, severity, status, created_at
        FROM nonconformities ORDER BY created_at DESC
      `);
      changes.nonconformities = nonconformitiesRes.rows;

      // Corrective actions
      const correctiveActionsRes = await db.query(`
        SELECT id, nonconformity_id, owner, description, due_at,
               status, closed_at, validated_by
        FROM corrective_actions ORDER BY due_at ASC
      `);
      changes.correctiveActions = correctiveActionsRes.rows;

      // Maintenance logs
      const maintenanceLogsRes = await db.query(`
        SELECT id, asset_id, date, actor, operation_type,
               description, parts_ref, created_at
        FROM maintenance_logs ORDER BY created_at DESC
      `);
      changes.maintenanceLogs = maintenanceLogsRes.rows;

      const summary = Object.keys(changes).map(k => `${k}:${changes[k]?.length || 0}`).join(', ');
      console.log('[SYNC] Pull complete:', summary);

      return {
        timestamp: new Date().toISOString(),
        changes,
      };
    } catch (e: any) {
      console.error('[SYNC] Pull failed:', e);
      return reply.code(500).send({ error: 'Sync pull failed', details: e.message });
    }
  });
}
