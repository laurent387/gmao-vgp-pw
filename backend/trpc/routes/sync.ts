import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../create-context";
import { pgQuery, getPgPool } from "../../db/postgres";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

const OutboxItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.any(),
});

interface SyncItemResult {
  id: string;
  success: boolean;
  serverId: string | null;
  error: string | null;
}

async function processCreateReport(payload: any): Promise<string> {
  const id = payload.id || generateId();
  const now = new Date().toISOString();

  await pgQuery(
    `INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       conclusion = EXCLUDED.conclusion,
       summary = EXCLUDED.summary,
       signed_by_name = EXCLUDED.signed_by_name,
       signed_at = EXCLUDED.signed_at`,
    [
      id,
      payload.mission_id,
      payload.asset_id,
      payload.performed_at || now,
      payload.performer,
      payload.conclusion,
      payload.summary || "",
      payload.signed_by_name || null,
      payload.signed_at || null,
      now,
    ]
  );

  if (payload.items && Array.isArray(payload.items)) {
    for (const item of payload.items) {
      const itemId = item.id || generateId();
      await pgQuery(
        `INSERT INTO report_item_results (id, report_id, checklist_item_id, status, value_num, value_text, comment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           value_num = EXCLUDED.value_num,
           value_text = EXCLUDED.value_text,
           comment = EXCLUDED.comment`,
        [itemId, id, item.checklist_item_id, item.status, item.value_num || null, item.value_text || null, item.comment || null]
      );
    }
  }

  if (payload.conclusion === "NON_CONFORME" || payload.conclusion === "CONFORME_SOUS_RESERVE") {
    const acRows = await pgQuery<{ id: string; next_due_at: string | null }>(
      "SELECT id, next_due_at FROM asset_controls WHERE asset_id = $1",
      [payload.asset_id]
    );
    if (acRows.length > 0) {
      const ctRows = await pgQuery<{ periodicity_days: number }>(
        `SELECT ct.periodicity_days FROM asset_controls ac
         JOIN control_types ct ON ac.control_type_id = ct.id
         WHERE ac.asset_id = $1 LIMIT 1`,
        [payload.asset_id]
      );
      const periodicity = ctRows[0]?.periodicity_days || 365;
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + periodicity);

      await pgQuery(
        "UPDATE asset_controls SET last_done_at = $1, next_due_at = $2 WHERE asset_id = $3",
        [now, nextDue.toISOString(), payload.asset_id]
      );
    }
  }

  console.log("[SYNC] Created report:", id);
  return id;
}

async function processCreateNC(payload: any): Promise<string> {
  const id = payload.id || generateId();
  const now = new Date().toISOString();

  await pgQuery(
    `INSERT INTO nonconformities (id, report_id, asset_id, checklist_item_id, title, description, severity, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       severity = EXCLUDED.severity,
       status = EXCLUDED.status`,
    [
      id,
      payload.report_id || null,
      payload.asset_id,
      payload.checklist_item_id || null,
      payload.title,
      payload.description || "",
      payload.severity || 3,
      payload.status || "OUVERTE",
      now,
    ]
  );

  if (payload.corrective_action) {
    const actionId = payload.corrective_action.id || generateId();
    await pgQuery(
      `INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         owner = EXCLUDED.owner,
         description = EXCLUDED.description,
         due_at = EXCLUDED.due_at,
         status = EXCLUDED.status`,
      [
        actionId,
        id,
        payload.corrective_action.owner,
        payload.corrective_action.description || "",
        payload.corrective_action.due_at,
        payload.corrective_action.status || "OUVERTE",
      ]
    );
  }

  console.log("[SYNC] Created NC:", id);
  return id;
}

async function processUpdateAction(payload: any): Promise<string> {
  const id = payload.id;
  if (!id) throw new Error("Missing action id");

  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (payload.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    params.push(payload.status);
  }
  if (payload.closed_at !== undefined) {
    updates.push(`closed_at = $${paramIndex++}`);
    params.push(payload.closed_at);
  }
  if (payload.validated_by !== undefined) {
    updates.push(`validated_by = $${paramIndex++}`);
    params.push(payload.validated_by);
  }
  if (payload.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(payload.description);
  }
  if (payload.due_at !== undefined) {
    updates.push(`due_at = $${paramIndex++}`);
    params.push(payload.due_at);
  }
  if (payload.owner !== undefined) {
    updates.push(`owner = $${paramIndex++}`);
    params.push(payload.owner);
  }

  if (updates.length > 0) {
    params.push(id);
    await pgQuery(
      `UPDATE corrective_actions SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      params
    );
  }

  console.log("[SYNC] Updated action:", id);
  return id;
}

async function processCreateMaintenance(payload: any): Promise<string> {
  const id = payload.id || generateId();
  const now = new Date().toISOString();

  await pgQuery(
    `INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       date = EXCLUDED.date,
       actor = EXCLUDED.actor,
       operation_type = EXCLUDED.operation_type,
       description = EXCLUDED.description,
       parts_ref = EXCLUDED.parts_ref`,
    [
      id,
      payload.asset_id,
      payload.date || now,
      payload.actor,
      payload.operation_type,
      payload.description,
      payload.parts_ref || null,
      now,
    ]
  );

  console.log("[SYNC] Created maintenance:", id);
  return id;
}

async function processCreateMission(payload: any): Promise<string> {
  const id = payload.id || generateId();
  const now = new Date().toISOString();

  await pgQuery(
    `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       scheduled_at = EXCLUDED.scheduled_at,
       assigned_to = EXCLUDED.assigned_to,
       status = EXCLUDED.status`,
    [
      id,
      payload.control_type_id,
      payload.scheduled_at,
      payload.assigned_to,
      payload.status || "PLANIFIEE",
      payload.site_id,
      now,
    ]
  );

  if (payload.asset_ids && Array.isArray(payload.asset_ids)) {
    await pgQuery("DELETE FROM mission_assets WHERE mission_id = $1", [id]);

    for (const assetId of payload.asset_ids) {
      const maId = generateId();
      await pgQuery(
        "INSERT INTO mission_assets (id, mission_id, asset_id) VALUES ($1, $2, $3)",
        [maId, id, assetId]
      );
    }
  }

  console.log("[SYNC] Created mission:", id);
  return id;
}

async function processUploadDocument(payload: any): Promise<string> {
  const id = payload.documentId || payload.id || generateId();

  console.log("[SYNC] Document upload handled via /api/uploads endpoint, marking as processed:", id);
  return id;
}

export const syncRouter = createTRPCRouter({
  push: protectedProcedure
    .input(
      z.object({
        items: z.array(OutboxItemSchema),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[SYNC] Received ${input.items.length} items to sync`);

      const results: SyncItemResult[] = [];

      for (const item of input.items) {
        let serverId: string | null = null;
        let success = false;
        let error: string | null = null;

        try {
          switch (item.type) {
            case "CREATE_REPORT":
              serverId = await processCreateReport(item.payload);
              success = true;
              break;

            case "CREATE_NC":
              serverId = await processCreateNC(item.payload);
              success = true;
              break;

            case "UPDATE_ACTION":
              serverId = await processUpdateAction(item.payload);
              success = true;
              break;

            case "CREATE_MAINTENANCE":
              serverId = await processCreateMaintenance(item.payload);
              success = true;
              break;

            case "CREATE_MISSION":
              serverId = await processCreateMission(item.payload);
              success = true;
              break;

            case "UPLOAD_DOCUMENT":
              serverId = await processUploadDocument(item.payload);
              success = true;
              break;

            default:
              console.warn(`[SYNC] Unknown item type: ${item.type}`);
              error = `Unknown sync type: ${item.type}`;
          }
        } catch (e) {
          error = e instanceof Error ? e.message : "Unknown error";
          console.error(`[SYNC] Error processing ${item.type}:`, error);
        }

        results.push({
          id: item.id,
          success,
          serverId,
          error,
        });
      }

      const synced = results.filter((r) => r.success).length;
      console.log(`[SYNC] Processed ${synced}/${input.items.length} items successfully`);

      return {
        synced,
        results,
      };
    }),

  pull: protectedProcedure
    .input(
      z.object({
        lastSyncAt: z.string().optional(),
        entities: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      console.log(`[SYNC] Pull request since ${input.lastSyncAt || "beginning"}`);

      const since = input.lastSyncAt ? new Date(input.lastSyncAt) : new Date(0);
      const entities = input.entities || ["sites", "zones", "assets", "controlTypes", "missions", "users"];

      const changes: Record<string, any[]> = {};

      if (entities.includes("users")) {
        changes.users = await pgQuery(
          "SELECT id, email, name, role, created_at FROM users WHERE created_at >= $1 ORDER BY created_at",
          [since.toISOString()]
        );
      }

      if (entities.includes("sites")) {
        changes.sites = await pgQuery(
          `SELECT s.*, c.name as client_name 
           FROM sites s 
           LEFT JOIN clients c ON s.client_id = c.id 
           WHERE s.created_at >= $1 ORDER BY s.created_at`,
          [since.toISOString()]
        );
      }

      if (entities.includes("zones")) {
        const zonesRaw = await pgQuery<any>(
          `SELECT z.*, s.name as site_name 
           FROM zones z 
           LEFT JOIN sites s ON z.site_id = s.id`,
          []
        );
        changes.zones = zonesRaw;
      }

      if (entities.includes("assets")) {
        changes.assets = await pgQuery(
          `SELECT a.*, s.name as site_name, z.name as zone_name,
                  ac.next_due_at,
                  CASE WHEN ac.next_due_at < NOW() THEN true ELSE false END as is_overdue
           FROM assets a
           LEFT JOIN sites s ON a.site_id = s.id
           LEFT JOIN zones z ON a.zone_id = z.id
           LEFT JOIN asset_controls ac ON ac.asset_id = a.id
           WHERE a.created_at >= $1 ORDER BY a.created_at`,
          [since.toISOString()]
        );
      }

      if (entities.includes("controlTypes")) {
        changes.controlTypes = await pgQuery(
          "SELECT * FROM control_types WHERE active = true",
          []
        );
      }

      if (entities.includes("missions")) {
        changes.missions = await pgQuery(
          `SELECT m.*, ct.label as control_type_label, s.name as site_name, u.name as assigned_to_name
           FROM missions m
           LEFT JOIN control_types ct ON m.control_type_id = ct.id
           LEFT JOIN sites s ON m.site_id = s.id
           LEFT JOIN users u ON m.assigned_to = u.id
           WHERE m.created_at >= $1 ORDER BY m.created_at`,
          [since.toISOString()]
        );
      }

      if (entities.includes("nonconformities")) {
        changes.nonconformities = await pgQuery(
          `SELECT nc.*, a.code_interne as asset_code, a.designation as asset_designation
           FROM nonconformities nc
           LEFT JOIN assets a ON nc.asset_id = a.id
           WHERE nc.created_at >= $1 ORDER BY nc.created_at`,
          [since.toISOString()]
        );
      }

      if (entities.includes("correctiveActions")) {
        changes.correctiveActions = await pgQuery(
          `SELECT ca.* FROM corrective_actions ca
           JOIN nonconformities nc ON ca.nonconformity_id = nc.id
           WHERE nc.created_at >= $1 ORDER BY ca.due_at`,
          [since.toISOString()]
        );
      }

      if (entities.includes("reports")) {
        changes.reports = await pgQuery(
          `SELECT r.*, a.code_interne as asset_code, a.designation as asset_designation
           FROM reports r
           LEFT JOIN assets a ON r.asset_id = a.id
           WHERE r.created_at >= $1 ORDER BY r.created_at`,
          [since.toISOString()]
        );
      }

      if (entities.includes("maintenanceLogs")) {
        changes.maintenanceLogs = await pgQuery(
          `SELECT ml.*, a.code_interne as asset_code, a.designation as asset_designation
           FROM maintenance_logs ml
           LEFT JOIN assets a ON ml.asset_id = a.id
           WHERE ml.created_at >= $1 ORDER BY ml.created_at`,
          [since.toISOString()]
        );
      }

      if (entities.includes("checklistTemplates")) {
        changes.checklistTemplates = await pgQuery(
          "SELECT * FROM checklist_templates",
          []
        );
      }

      if (entities.includes("checklistItems")) {
        changes.checklistItems = await pgQuery(
          "SELECT * FROM checklist_items ORDER BY template_id, sort_order",
          []
        );
      }

      console.log("[SYNC] Pull complete, entities:", Object.keys(changes).map(k => `${k}:${changes[k]?.length || 0}`).join(", "));

      return {
        timestamp: new Date().toISOString(),
        changes,
      };
    }),

  status: publicProcedure.query(async () => {
    let dbStatus = "unknown";
    try {
      const pool = getPgPool();
      await pool.query("SELECT 1");
      dbStatus = "connected";
    } catch (e) {
      dbStatus = "disconnected";
    }

    return {
      serverTime: new Date().toISOString(),
      version: "1.0.0",
      status: "healthy",
      database: dbStatus,
    };
  }),
});
