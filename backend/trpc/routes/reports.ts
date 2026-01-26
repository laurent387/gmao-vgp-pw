import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure, mutationProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbReport {
  id: string;
  mission_id: string;
  asset_id: string;
  performed_at: string;
  performer: string;
  conclusion: string;
  summary: string | null;
  signed_by_name: string | null;
  signed_at: string | null;
  created_at: string;
  asset_code?: string;
  asset_designation?: string;
  site_name?: string;
  control_type_label?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export const reportsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        missionId: z.string().optional(),
        assetId: z.string().optional(),
        conclusion: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      console.log("[REPORTS] Fetching reports with filters:", input);

      let query = `
        SELECT r.*, 
               a.code_interne as asset_code,
               a.designation as asset_designation,
               s.name as site_name,
               ct.label as control_type_label
        FROM reports r
        LEFT JOIN assets a ON r.asset_id = a.id
        LEFT JOIN sites s ON a.site_id = s.id
        LEFT JOIN missions m ON r.mission_id = m.id
        LEFT JOIN control_types ct ON m.control_type_id = ct.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (input?.missionId) {
        query += ` AND r.mission_id = $${paramIndex++}`;
        params.push(input.missionId);
      }
      if (input?.assetId) {
        query += ` AND r.asset_id = $${paramIndex++}`;
        params.push(input.assetId);
      }
      if (input?.conclusion) {
        query += ` AND r.conclusion = $${paramIndex++}`;
        params.push(input.conclusion);
      }
      if (input?.search) {
        query += ` AND (
          a.code_interne ILIKE $${paramIndex} OR 
          a.designation ILIKE $${paramIndex} OR
          r.summary ILIKE $${paramIndex} OR
          r.performer ILIKE $${paramIndex}
        )`;
        params.push(`%${input.search}%`);
        paramIndex++;
      }

      query += " ORDER BY r.performed_at DESC";

      if (input?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(input.limit);
      }
      if (input?.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(input.offset);
      }

      const reports = await pgQuery<DbReport>(query, params);
      console.log("[REPORTS] Found reports:", reports.length);

      return reports.map((r) => ({
        id: r.id,
        mission_id: r.mission_id,
        asset_id: r.asset_id,
        performed_at: r.performed_at,
        performer: r.performer,
        conclusion: r.conclusion,
        summary: r.summary || "",
        signed_by_name: r.signed_by_name,
        signed_at: r.signed_at,
        created_at: r.created_at,
        asset_code: r.asset_code || "",
        asset_designation: r.asset_designation || "",
        site_name: r.site_name || "",
        control_type_label: r.control_type_label || "",
      }));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const reports = await pgQuery<DbReport>(
        `SELECT r.*, 
                a.code_interne as asset_code,
                a.designation as asset_designation,
                s.name as site_name,
                ct.label as control_type_label
         FROM reports r
         LEFT JOIN assets a ON r.asset_id = a.id
         LEFT JOIN sites s ON a.site_id = s.id
         LEFT JOIN missions m ON r.mission_id = m.id
         LEFT JOIN control_types ct ON m.control_type_id = ct.id
         WHERE r.id = $1`,
        [input.id]
      );

      const r = reports[0];
      if (!r) return null;

      const items = await pgQuery<any>(
        `SELECT rir.*, ci.label as checklist_item_label, ci.field_type
         FROM report_item_results rir
         LEFT JOIN checklist_items ci ON rir.checklist_item_id = ci.id
         WHERE rir.report_id = $1
         ORDER BY ci.sort_order`,
        [input.id]
      );

      return {
        id: r.id,
        mission_id: r.mission_id,
        asset_id: r.asset_id,
        performed_at: r.performed_at,
        performer: r.performer,
        conclusion: r.conclusion,
        summary: r.summary || "",
        signed_by_name: r.signed_by_name,
        signed_at: r.signed_at,
        created_at: r.created_at,
        asset_code: r.asset_code || "",
        asset_designation: r.asset_designation || "",
        site_name: r.site_name || "",
        control_type_label: r.control_type_label || "",
        items,
      };
    }),

  count: publicProcedure
    .input(
      z.object({
        conclusion: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      let query = "SELECT COUNT(*)::int as count FROM reports";
      const params: any[] = [];

      if (input?.conclusion) {
        query += " WHERE conclusion = $1";
        params.push(input.conclusion);
      }

      const result = await pgQuery<{ count: number }>(query, params);
      return result[0]?.count ?? 0;
    }),

  create: mutationProcedure
    .input(
      z.object({
        mission_id: z.string(),
        asset_id: z.string(),
        performer: z.string(),
        conclusion: z.enum(["CONFORME", "NON_CONFORME", "CONFORME_SOUS_RESERVE"]),
        summary: z.string(),
        signed_by_name: z.string().optional(),
        items: z.array(
          z.object({
            checklist_item_id: z.string(),
            status: z.enum(["OK", "KO", "NA"]),
            value_num: z.number().optional(),
            value_text: z.string().optional(),
            comment: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const reportId = generateId();
      const now = new Date().toISOString();

      await pgQuery(
        `INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          reportId,
          input.mission_id,
          input.asset_id,
          now,
          input.performer,
          input.conclusion,
          input.summary,
          input.signed_by_name || null,
          input.signed_by_name ? now : null,
          now,
        ]
      );

      for (const item of input.items) {
        const itemId = generateId();
        await pgQuery(
          `INSERT INTO report_item_results (id, report_id, checklist_item_id, status, value_num, value_text, comment)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [itemId, reportId, item.checklist_item_id, item.status, item.value_num || null, item.value_text || null, item.comment || null]
        );
      }

      console.log("[REPORTS] Created report:", reportId);

      return {
        id: reportId,
        mission_id: input.mission_id,
        asset_id: input.asset_id,
        performed_at: now,
        performer: input.performer,
        conclusion: input.conclusion,
        summary: input.summary,
        signed_by_name: input.signed_by_name || null,
        signed_at: input.signed_by_name ? now : null,
        created_at: now,
      };
    }),
});
