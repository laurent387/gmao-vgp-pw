import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure, mutationProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbMission {
  id: string;
  control_type_id: string;
  scheduled_at: string;
  assigned_to: string;
  status: string;
  site_id: string;
  created_at: string;
  control_type_label?: string;
  site_name?: string;
  assigned_to_name?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export const missionsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        siteId: z.string().optional(),
        status: z.string().optional(),
        assignedTo: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      console.log("[MISSIONS] Fetching missions with filters:", input);

      let query = `
        SELECT m.*, 
               ct.label as control_type_label,
               s.name as site_name,
               u.name as assigned_to_name,
               (SELECT COUNT(*) FROM mission_assets ma WHERE ma.mission_id = m.id) as asset_count
        FROM missions m
        LEFT JOIN control_types ct ON m.control_type_id = ct.id
        LEFT JOIN sites s ON m.site_id = s.id
        LEFT JOIN users u ON m.assigned_to = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (input?.siteId) {
        query += ` AND m.site_id = $${paramIndex++}`;
        params.push(input.siteId);
      }
      if (input?.status) {
        query += ` AND m.status = $${paramIndex++}`;
        params.push(input.status);
      }
      if (input?.assignedTo) {
        query += ` AND m.assigned_to = $${paramIndex++}`;
        params.push(input.assignedTo);
      }

      query += " ORDER BY m.scheduled_at DESC";

      const missions = await pgQuery<DbMission & { asset_count: string }>(query, params);
      console.log("[MISSIONS] Found missions:", missions.length);

      return missions.map((m) => ({
        id: m.id,
        control_type_id: m.control_type_id,
        scheduled_at: m.scheduled_at,
        assigned_to: m.assigned_to,
        status: m.status,
        site_id: m.site_id,
        created_at: m.created_at,
        control_type_label: m.control_type_label || "",
        site_name: m.site_name || "",
        assigned_to_name: m.assigned_to_name || "",
        asset_count: parseInt(m.asset_count || "0", 10),
      }));
    }),

  getById: publicProcedure
    .input(z.any())
    .query(async ({ input, ctx }) => {
      const raw = (input ?? {}) as any;
      const body = (ctx as any)?.rawJson ?? {};
      const url = new URL(ctx.req.url);
      let queryInput: any = null;
      const queryParam = url.searchParams.get("input");
      if (queryParam) {
        try {
          queryInput = JSON.parse(queryParam);
        } catch (e) {
          console.warn("[MISSIONS] Unable to parse query input", e);
        }
      }

      const id =
        (typeof raw === "string" ? raw : undefined) ??
        raw.id ??
        raw.json?.id ??
        raw[0]?.id ??
        raw[0]?.json?.id ??
        body.id ??
        body.json?.id ??
        body?.[0]?.id ??
        body?.[0]?.json?.id ??
        queryInput?.id ??
        queryInput?.json?.id ??
        queryInput?.[0]?.id ??
        queryInput?.[0]?.json?.id;

      console.log("[MISSIONS] getById input:", { id, raw, body, queryInput });

      if (!id || typeof id !== "string") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Mission id is required" });
      }

      const missions = await pgQuery<DbMission & { asset_count: string }>(
        `SELECT m.*, 
                ct.label as control_type_label,
                s.name as site_name,
                u.name as assigned_to_name,
                (SELECT COUNT(*) FROM mission_assets ma WHERE ma.mission_id = m.id) as asset_count
         FROM missions m
         LEFT JOIN control_types ct ON m.control_type_id = ct.id
         LEFT JOIN sites s ON m.site_id = s.id
         LEFT JOIN users u ON m.assigned_to = u.id
         WHERE m.id = $1`,
        [id]
      );

      const m = missions[0];
      if (!m) return null;

      return {
        id: m.id,
        control_type_id: m.control_type_id,
        scheduled_at: m.scheduled_at,
        assigned_to: m.assigned_to,
        status: m.status,
        site_id: m.site_id,
        created_at: m.created_at,
        control_type_label: m.control_type_label || "",
        site_name: m.site_name || "",
        assigned_to_name: m.assigned_to_name || "",
        asset_count: parseInt(m.asset_count || "0", 10),
      };
    }),

  create: mutationProcedure
    .input(
      z.object({
        control_type_id: z.string(),
        scheduled_at: z.string(),
        assigned_to: z.string(),
        site_id: z.string(),
        asset_ids: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const missionId = generateId();
      const now = new Date().toISOString();

      await pgQuery(
        `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [missionId, input.control_type_id, input.scheduled_at, input.assigned_to, "PLANIFIEE", input.site_id, now]
      );

      for (const assetId of input.asset_ids) {
        const maId = generateId();
        await pgQuery(
          "INSERT INTO mission_assets (id, mission_id, asset_id) VALUES ($1, $2, $3)",
          [maId, missionId, assetId]
        );
      }

      console.log("[MISSIONS] Created mission:", missionId, "with", input.asset_ids.length, "assets");

      return {
        id: missionId,
        control_type_id: input.control_type_id,
        scheduled_at: input.scheduled_at,
        assigned_to: input.assigned_to,
        status: "PLANIFIEE",
        site_id: input.site_id,
        created_at: now,
        control_type_label: "",
        site_name: "",
        assigned_to_name: "",
      };
    }),

  updateStatus: mutationProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["A_PLANIFIER", "PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"]),
      })
    )
    .mutation(async ({ input }) => {
      await pgQuery(
        "UPDATE missions SET status = $1 WHERE id = $2",
        [input.status, input.id]
      );

      const missions = await pgQuery<DbMission>(
        "SELECT * FROM missions WHERE id = $1",
        [input.id]
      );

      return missions[0] || null;
    }),

  getAssets: publicProcedure
    .input(z.any())
    .query(async ({ input, ctx }) => {
      const raw = (input ?? {}) as any;
      const body = (ctx as any)?.rawJson ?? {};
      const url = new URL(ctx.req.url);
      let queryInput: any = null;
      const queryParam = url.searchParams.get("input");
      if (queryParam) {
        try {
          queryInput = JSON.parse(queryParam);
        } catch (e) {
          console.warn("[MISSIONS] Unable to parse query input", e);
        }
      }

      const missionId =
        (typeof raw === "string" ? raw : undefined) ??
        raw.missionId ??
        raw.json?.missionId ??
        raw[0]?.missionId ??
        raw[0]?.json?.missionId ??
        body.missionId ??
        body.json?.missionId ??
        body?.[0]?.missionId ??
        body?.[0]?.json?.missionId ??
        queryInput?.missionId ??
        queryInput?.json?.missionId ??
        queryInput?.[0]?.missionId ??
        queryInput?.[0]?.json?.missionId;

      if (!missionId || typeof missionId !== "string") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "missionId requis" });
      }

      const assets = await pgQuery<any>(
        `SELECT a.*, s.name as site_name, z.name as zone_name
         FROM mission_assets ma
         JOIN assets a ON ma.asset_id = a.id
         LEFT JOIN sites s ON a.site_id = s.id
         LEFT JOIN zones z ON a.zone_id = z.id
         WHERE ma.mission_id = $1`,
        [missionId]
      );

      return assets;
    }),
});
