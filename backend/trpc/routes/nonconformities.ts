import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure, mutationProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbNC {
  id: string;
  report_id: string | null;
  asset_id: string;
  checklist_item_id: string | null;
  title: string;
  description: string | null;
  severity: number;
  status: string;
  created_at: string;
  asset_code?: string;
  asset_designation?: string;
  site_name?: string;
}

interface DbAction {
  id: string;
  nonconformity_id: string;
  owner: string;
  description: string | null;
  due_at: string;
  status: string;
  closed_at: string | null;
  validated_by: string | null;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export const ncRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        assetId: z.string().optional(),
        severity: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      console.log("[NC] Fetching nonconformities with filters:", input);

      let query = `
        SELECT nc.*, 
               a.code_interne as asset_code,
               a.designation as asset_designation,
               s.name as site_name
        FROM nonconformities nc
        LEFT JOIN assets a ON nc.asset_id = a.id
        LEFT JOIN sites s ON a.site_id = s.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (input?.status) {
        query += ` AND nc.status = $${paramIndex++}`;
        params.push(input.status);
      }
      if (input?.assetId) {
        query += ` AND nc.asset_id = $${paramIndex++}`;
        params.push(input.assetId);
      }
      if (input?.severity) {
        query += ` AND nc.severity >= $${paramIndex++}`;
        params.push(input.severity);
      }

      query += " ORDER BY nc.created_at DESC";

      const ncs = await pgQuery<DbNC>(query, params);
      console.log("[NC] Found nonconformities:", ncs.length);

      return ncs.map((nc) => ({
        id: nc.id,
        report_id: nc.report_id,
        asset_id: nc.asset_id,
        checklist_item_id: nc.checklist_item_id,
        title: nc.title,
        description: nc.description || "",
        severity: nc.severity,
        status: nc.status,
        created_at: nc.created_at,
        asset_code: nc.asset_code || "",
        asset_designation: nc.asset_designation || "",
        site_name: nc.site_name || "",
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const ncs = await pgQuery<DbNC>(
        `SELECT nc.*, 
                a.code_interne as asset_code,
                a.designation as asset_designation,
                s.name as site_name
         FROM nonconformities nc
         LEFT JOIN assets a ON nc.asset_id = a.id
         LEFT JOIN sites s ON a.site_id = s.id
         WHERE nc.id = $1`,
        [input.id]
      );

      const nc = ncs[0];
      if (!nc) return null;

      const actions = await pgQuery<DbAction>(
        "SELECT * FROM corrective_actions WHERE nonconformity_id = $1 ORDER BY due_at",
        [input.id]
      );

      return {
        id: nc.id,
        report_id: nc.report_id,
        asset_id: nc.asset_id,
        checklist_item_id: nc.checklist_item_id,
        title: nc.title,
        description: nc.description || "",
        severity: nc.severity,
        status: nc.status,
        created_at: nc.created_at,
        asset_code: nc.asset_code || "",
        asset_designation: nc.asset_designation || "",
        site_name: nc.site_name || "",
        corrective_action: actions[0] || null,
      };
    }),

  create: mutationProcedure
    .input(
      z.object({
        report_id: z.string().optional(),
        asset_id: z.string(),
        checklist_item_id: z.string().optional(),
        title: z.string().min(1),
        description: z.string(),
        severity: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      const now = new Date().toISOString();

      await pgQuery(
        `INSERT INTO nonconformities (id, report_id, asset_id, checklist_item_id, title, description, severity, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'OUVERTE', $8)`,
        [id, input.report_id || null, input.asset_id, input.checklist_item_id || null, input.title, input.description, input.severity, now]
      );

      return {
        id,
        report_id: input.report_id || null,
        asset_id: input.asset_id,
        checklist_item_id: input.checklist_item_id || null,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: "OUVERTE",
        created_at: now,
      };
    }),

  updateStatus: mutationProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OUVERTE", "EN_COURS", "CLOTUREE"]),
      })
    )
    .mutation(async ({ input }) => {
      await pgQuery(
        "UPDATE nonconformities SET status = $1 WHERE id = $2",
        [input.status, input.id]
      );

      const ncs = await pgQuery<DbNC>(
        "SELECT * FROM nonconformities WHERE id = $1",
        [input.id]
      );

      return ncs[0] || null;
    }),

  actions: publicProcedure
    .input(z.object({ ncId: z.string() }))
    .query(async ({ input }) => {
      const actions = await pgQuery<DbAction>(
        "SELECT * FROM corrective_actions WHERE nonconformity_id = $1 ORDER BY due_at",
        [input.ncId]
      );
      return actions;
    }),

  createAction: mutationProcedure
    .input(
      z.object({
        nonconformity_id: z.string(),
        owner: z.string(),
        due_at: z.string(),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();

      await pgQuery(
        `INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status)
         VALUES ($1, $2, $3, $4, $5, 'OUVERTE')`,
        [id, input.nonconformity_id, input.owner, input.description, input.due_at]
      );

      return {
        id,
        nonconformity_id: input.nonconformity_id,
        owner: input.owner,
        due_at: input.due_at,
        status: "OUVERTE",
        closed_at: null,
        validated_by: null,
        description: input.description,
      };
    }),

  updateActionStatus: mutationProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OUVERTE", "EN_COURS", "CLOTUREE", "VALIDEE"]),
        validatedBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let query = "UPDATE corrective_actions SET status = $1";
      const params: any[] = [input.status];
      let paramIndex = 2;

      if (input.status === "CLOTUREE") {
        query += `, closed_at = $${paramIndex++}`;
        params.push(new Date().toISOString());
      }
      if (input.status === "VALIDEE" && input.validatedBy) {
        query += `, validated_by = $${paramIndex++}`;
        params.push(input.validatedBy);
      }

      query += ` WHERE id = $${paramIndex}`;
      params.push(input.id);

      await pgQuery(query, params);

      const actions = await pgQuery<DbAction>(
        "SELECT * FROM corrective_actions WHERE id = $1",
        [input.id]
      );

      return actions[0] || null;
    }),
});
