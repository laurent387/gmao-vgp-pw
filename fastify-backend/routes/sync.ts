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

      // Clients — all columns
      const clientsRes = await db.query(`
        SELECT id, name, created_at, siret, tva_number, contact_name, contact_email,
               contact_phone, address, access_instructions, billing_address, billing_email,
               internal_notes, status
        FROM clients ORDER BY name ASC
      `);
      changes.clients = clientsRes.rows;

      // Users (exclude password_hash)
      const usersRes = await db.query('SELECT id, email, name, role, created_at FROM users ORDER BY name ASC');
      changes.users = usersRes.rows;

      // Sites
      const sitesRes = await db.query(`
        SELECT id, client_id, name, address, created_at
        FROM sites ORDER BY name ASC
      `);
      changes.sites = sitesRes.rows;

      // Zones
      const zonesRes = await db.query(`
        SELECT id, site_id, name
        FROM zones ORDER BY name ASC
      `);
      changes.zones = zonesRes.rows;

      // Assets — all columns including new ones
      const assetsRes = await db.query(`
        SELECT id, code_interne, designation, categorie, marque, modele,
               numero_serie, annee, statut, criticite, site_id, zone_id,
               mise_en_service, created_at,
               COALESCE(vgp_enabled, false) as vgp_enabled,
               vgp_validity_months,
               force_nominale, compteur_type, compteur_valeur,
               caracteristiques::text, dispositifs_protection::text
        FROM assets ORDER BY code_interne ASC
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

      // Mission assets (junction)
      const missionAssetsRes = await db.query(`
        SELECT id, mission_id, asset_id
        FROM mission_assets ORDER BY mission_id
      `);
      changes.missionAssets = missionAssetsRes.rows;

      // Mission technicians (junction)
      const missionTechniciansRes = await db.query(`
        SELECT id, mission_id, technician_id, assigned_at
        FROM mission_technicians ORDER BY mission_id
      `);
      changes.missionTechnicians = missionTechniciansRes.rows;

      // Mission operations
      const missionOperationsRes = await db.query(`
        SELECT id, mission_id, operation_type, sort_order, created_at
        FROM mission_operations ORDER BY mission_id, sort_order
      `);
      changes.missionOperations = missionOperationsRes.rows;

      // Mission operation assets
      const missionOperationAssetsRes = await db.query(`
         SELECT id, mission_id, operation_type, asset_id, corrective_action_id, work_description,
           checklist_template_id, checklist_data::text, created_at, updated_at
        FROM mission_operation_assets ORDER BY mission_id
      `);
      changes.missionOperationAssets = missionOperationAssetsRes.rows;

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

      // Report item results
      const reportItemResultsRes = await db.query(`
        SELECT id, report_id, checklist_item_id, status, value_num, value_text, comment
        FROM report_item_results ORDER BY report_id
      `);
      changes.reportItemResults = reportItemResultsRes.rows;

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
           parts_refs, photo_ids, status, closed_at, validated_by
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
