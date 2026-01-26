import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

interface DbAsset {
  id: string;
  code_interne: string;
  designation: string;
  categorie: string;
  marque: string | null;
  modele: string | null;
  numero_serie: string | null;
  annee: number | null;
  statut: string;
  criticite: number;
  site_id: string;
  zone_id: string;
  mise_en_service: string | null;
  created_at: string;
  site_name?: string;
  zone_name?: string;
  next_due_at?: string | null;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export const assetsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        siteId: z.string().optional(),
        zoneId: z.string().optional(),
        status: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      console.log("[ASSETS] Fetching assets with filters:", input);
      
      let query = `
        SELECT a.*, 
               s.name as site_name, 
               z.name as zone_name,
               ac.next_due_at
        FROM assets a
        LEFT JOIN sites s ON a.site_id = s.id
        LEFT JOIN zones z ON a.zone_id = z.id
        LEFT JOIN asset_controls ac ON a.id = ac.asset_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (input?.siteId) {
        query += ` AND a.site_id = $${paramIndex++}`;
        params.push(input.siteId);
      }
      if (input?.zoneId) {
        query += ` AND a.zone_id = $${paramIndex++}`;
        params.push(input.zoneId);
      }
      if (input?.status) {
        query += ` AND a.statut = $${paramIndex++}`;
        params.push(input.status);
      }
      if (input?.category) {
        query += ` AND a.categorie = $${paramIndex++}`;
        params.push(input.category);
      }
      if (input?.search) {
        query += ` AND (LOWER(a.code_interne) LIKE $${paramIndex} OR LOWER(a.designation) LIKE $${paramIndex})`;
        params.push(`%${input.search.toLowerCase()}%`);
        paramIndex++;
      }

      query += " ORDER BY a.code_interne";

      const assets = await pgQuery<DbAsset>(query, params);
      console.log("[ASSETS] Found assets:", assets.length);

      const now = new Date();
      return assets.map((a) => {
        const nextDue = a.next_due_at ? new Date(a.next_due_at) : null;
        const isOverdue = nextDue ? nextDue < now : false;
        
        return {
          id: a.id,
          code_interne: a.code_interne,
          designation: a.designation,
          categorie: a.categorie,
          marque: a.marque || "",
          modele: a.modele || "",
          numero_serie: a.numero_serie || "",
          annee: a.annee || 0,
          statut: a.statut,
          criticite: a.criticite,
          site_id: a.site_id,
          zone_id: a.zone_id,
          mise_en_service: a.mise_en_service,
          created_at: a.created_at,
          site_name: a.site_name || "",
          zone_name: a.zone_name || "",
          next_due_at: a.next_due_at,
          is_overdue: isOverdue,
        };
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const assets = await pgQuery<DbAsset>(
        `SELECT a.*, 
                s.name as site_name, 
                z.name as zone_name,
                ac.next_due_at
         FROM assets a
         LEFT JOIN sites s ON a.site_id = s.id
         LEFT JOIN zones z ON a.zone_id = z.id
         LEFT JOIN asset_controls ac ON a.id = ac.asset_id
         WHERE a.id = $1`,
        [input.id]
      );
      
      const a = assets[0];
      if (!a) return null;

      const now = new Date();
      const nextDue = a.next_due_at ? new Date(a.next_due_at) : null;
      const isOverdue = nextDue ? nextDue < now : false;

      return {
        id: a.id,
        code_interne: a.code_interne,
        designation: a.designation,
        categorie: a.categorie,
        marque: a.marque || "",
        modele: a.modele || "",
        numero_serie: a.numero_serie || "",
        annee: a.annee || 0,
        statut: a.statut,
        criticite: a.criticite,
        site_id: a.site_id,
        zone_id: a.zone_id,
        mise_en_service: a.mise_en_service,
        created_at: a.created_at,
        site_name: a.site_name || "",
        zone_name: a.zone_name || "",
        next_due_at: a.next_due_at,
        is_overdue: isOverdue,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        code_interne: z.string().min(1),
        designation: z.string().min(1),
        categorie: z.string().min(1),
        marque: z.string().min(1),
        modele: z.string().min(1),
        numero_serie: z.string().min(1),
        annee: z.number().min(1900).max(2100),
        statut: z.enum(["EN_SERVICE", "HORS_SERVICE", "REBUT", "EN_LOCATION"]),
        criticite: z.number().min(1).max(5),
        site_id: z.string(),
        zone_id: z.string(),
        mise_en_service: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      const now = new Date().toISOString();

      await pgQuery(
        `INSERT INTO assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [id, input.code_interne, input.designation, input.categorie, input.marque, input.modele, input.numero_serie, input.annee, input.statut, input.criticite, input.site_id, input.zone_id, input.mise_en_service || null, now]
      );

      return {
        id,
        ...input,
        mise_en_service: input.mise_en_service || null,
        created_at: now,
        site_name: "",
        zone_name: "",
        next_due_at: null,
        is_overdue: false,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          designation: z.string().optional(),
          statut: z.enum(["EN_SERVICE", "HORS_SERVICE", "REBUT", "EN_LOCATION"]).optional(),
          criticite: z.number().min(1).max(5).optional(),
          site_id: z.string().optional(),
          zone_id: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (input.data.designation !== undefined) {
        updates.push(`designation = $${paramIndex++}`);
        params.push(input.data.designation);
      }
      if (input.data.statut !== undefined) {
        updates.push(`statut = $${paramIndex++}`);
        params.push(input.data.statut);
      }
      if (input.data.criticite !== undefined) {
        updates.push(`criticite = $${paramIndex++}`);
        params.push(input.data.criticite);
      }
      if (input.data.site_id !== undefined) {
        updates.push(`site_id = $${paramIndex++}`);
        params.push(input.data.site_id);
      }
      if (input.data.zone_id !== undefined) {
        updates.push(`zone_id = $${paramIndex++}`);
        params.push(input.data.zone_id);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      params.push(input.id);
      await pgQuery(
        `UPDATE assets SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
        params
      );

      const assets = await pgQuery<DbAsset>(
        "SELECT * FROM assets WHERE id = $1",
        [input.id]
      );

      return assets[0] || null;
    }),

  categories: publicProcedure.query(async () => {
    const result = await pgQuery<{ categorie: string }>(
      "SELECT DISTINCT categorie FROM assets ORDER BY categorie"
    );
    return result.map((r) => r.categorie);
  }),
});
