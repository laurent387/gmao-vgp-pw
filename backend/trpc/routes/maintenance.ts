import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbMaintenanceLog {
  id: string;
  asset_id: string;
  date: string;
  actor: string;
  operation_type: string;
  description: string;
  parts_ref: string | null;
  created_at: string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  status?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export const maintenanceRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        assetId: z.string().optional(),
        operationType: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      console.log("[MAINTENANCE] Fetching maintenance logs with filters:", input);

      let query = `
        SELECT ml.*,
               a.code_interne as asset_code,
               a.designation as asset_designation
        FROM maintenance_logs ml
        LEFT JOIN assets a ON ml.asset_id = a.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (input?.assetId) {
        query += ` AND ml.asset_id = $${paramIndex++}`;
        params.push(input.assetId);
      }
      if (input?.operationType) {
        query += ` AND ml.operation_type = $${paramIndex++}`;
        params.push(input.operationType);
      }

      query += " ORDER BY ml.date DESC";

      const logs = await pgQuery<DbMaintenanceLog>(query, params);
      console.log("[MAINTENANCE] Found maintenance logs:", logs.length);

      return logs.map((m) => ({
        id: m.id,
        asset_id: m.asset_id,
        date: m.date,
        actor: m.actor,
        operation_type: m.operation_type,
        description: m.description,
        parts_ref: m.parts_ref,
        assigned_to: m.assigned_to || null,
        assigned_to_name: m.assigned_to_name || null,
        status: m.status || "TERMINEE",
        created_at: m.created_at,
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const logs = await pgQuery<DbMaintenanceLog>(
        "SELECT * FROM maintenance_logs WHERE id = $1",
        [input.id]
      );
      return logs[0] || null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        asset_id: z.string(),
        date: z.string(),
        actor: z.string(),
        operation_type: z.enum(["MAINTENANCE", "INSPECTION", "REPARATION", "MODIFICATION"]),
        description: z.string(),
        parts_ref: z.string().optional(),
        assigned_to: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      const now = new Date().toISOString();

      let assignedToName: string | null = null;
      if (input.assigned_to) {
        const users = await pgQuery<{ name: string }>(
          "SELECT name FROM users WHERE id = $1",
          [input.assigned_to]
        );
        assignedToName = users[0]?.name || null;
      }

      await pgQuery(
        `INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, input.asset_id, input.date, input.actor, input.operation_type, input.description, input.parts_ref || null, now]
      );

      return {
        id,
        asset_id: input.asset_id,
        date: input.date,
        actor: input.actor,
        operation_type: input.operation_type,
        description: input.description,
        parts_ref: input.parts_ref || null,
        assigned_to: input.assigned_to || null,
        assigned_to_name: assignedToName,
        status: "PLANIFIEE",
        created_at: now,
      };
    }),

  listByTechnician: publicProcedure
    .input(
      z.object({
        technicianId: z.string(),
        status: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE"]).optional(),
      })
    )
    .query(async ({ input }) => {
      let query = `
        SELECT ml.*,
               a.code_interne as asset_code,
               a.designation as asset_designation
        FROM maintenance_logs ml
        LEFT JOIN assets a ON ml.asset_id = a.id
        WHERE ml.actor = (SELECT name FROM users WHERE id = $1)
      `;
      const params: any[] = [input.technicianId];

      query += " ORDER BY ml.date ASC";

      const logs = await pgQuery<DbMaintenanceLog>(query, params);

      return logs.map((m) => ({
        id: m.id,
        asset_id: m.asset_id,
        date: m.date,
        actor: m.actor,
        operation_type: m.operation_type,
        description: m.description,
        parts_ref: m.parts_ref,
        assigned_to: m.assigned_to || null,
        assigned_to_name: m.assigned_to_name || null,
        status: m.status || "TERMINEE",
        created_at: m.created_at,
      }));
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PLANIFIEE", "EN_COURS", "TERMINEE"]),
      })
    )
    .mutation(async ({ input }) => {
      const logs = await pgQuery<DbMaintenanceLog>(
        "SELECT * FROM maintenance_logs WHERE id = $1",
        [input.id]
      );

      if (!logs[0]) {
        throw new Error("Maintenance non trouvée");
      }

      return { ...logs[0], status: input.status };
    }),
});
