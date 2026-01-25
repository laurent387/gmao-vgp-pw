import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure, mutationProcedure } from "../create-context";
import { TRPCError } from "@trpc/server";
import { pgQuery } from "../../db/postgres";

// =============================================
// TYPES & HELPERS
// =============================================

interface DbVGPTemplate {
  id: string;
  name: string;
  machine_type: string;
  version: number;
  active: boolean;
  referentiel: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface DbVGPSection {
  id: string;
  template_id: string;
  code: string;
  title: string;
  sort_order: number;
}

interface DbVGPItem {
  id: string;
  section_id: string;
  numero: number;
  label: string;
  help_text: string | null;
  sort_order: number;
  active: boolean;
  section_code?: string;
  section_title?: string;
}

interface DbVGPReport {
  id: string;
  client_id: string;
  site_id: string;
  numero_rapport: string;
  date_rapport: string;
  signataire: string;
  synthese: string | null;
  has_observations: boolean;
  pdf_path: string | null;
  pdf_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  client_name?: string;
  site_name?: string;
}

interface DbVGPRun {
  id: string;
  report_id: string;
  template_id: string;
  asset_id: string;
  date_inspection: string;
  verificateur: string;
  compteur_type: string | null;
  compteur_valeur: number | null;
  conditions_intervention: string | null;
  modes_fonctionnement: string | null;
  moyens_disposition: boolean;
  conclusion: string;
  particularites: string | null;
  statut: string;
  signed_by: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  asset_code?: string;
  asset_designation?: string;
  asset_marque?: string;
  asset_modele?: string;
  asset_numero_serie?: string;
  asset_annee?: number;
  asset_force?: string;
}

interface DbVGPItemResult {
  id: string;
  run_id: string;
  item_id: string;
  result: string;
  comment: string | null;
  photos: any;
  created_at: string;
  updated_at: string;
  item_numero?: number;
  item_label?: string;
  section_code?: string;
}

interface DbVGPObservation {
  id: string;
  run_id: string;
  asset_id: string;
  item_id: string | null;
  item_numero: number | null;
  description: string;
  recommandation: string | null;
  gravite: number;
  statut: string;
  is_auto: boolean;
  pieces_jointes: any;
  created_at: string;
  updated_at: string;
  asset_code?: string;
  asset_designation?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function generateReportNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VGP-${year}-${random}`;
}

// =============================================
// ROUTER VGP
// =============================================

export const vgpRouter = createTRPCRouter({
  
  // =============================================
  // TEMPLATES
  // =============================================
  
  listTemplates: publicProcedure
    .input(z.object({
      machineType: z.string().optional(),
      activeOnly: z.boolean().optional().default(true),
    }).optional())
    .query(async ({ input }) => {
      let query = `SELECT * FROM vgp_templates WHERE 1=1`;
      const params: any[] = [];
      let idx = 1;
      
      if (input?.activeOnly !== false) {
        query += ` AND active = true`;
      }
      if (input?.machineType) {
        query += ` AND machine_type = $${idx++}`;
        params.push(input.machineType);
      }
      
      query += ` ORDER BY name, version DESC`;
      
      const templates = await pgQuery<DbVGPTemplate>(query, params);
      return templates;
    }),
  
  getTemplateById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const templates = await pgQuery<DbVGPTemplate>(
        `SELECT * FROM vgp_templates WHERE id = $1`,
        [input.id]
      );
      
      if (!templates[0]) return null;
      
      const sections = await pgQuery<DbVGPSection>(
        `SELECT * FROM vgp_template_sections WHERE template_id = $1 ORDER BY sort_order`,
        [input.id]
      );
      
      const items = await pgQuery<DbVGPItem>(
        `SELECT i.*, s.code as section_code, s.title as section_title
         FROM vgp_template_items i
         JOIN vgp_template_sections s ON i.section_id = s.id
         WHERE s.template_id = $1
         ORDER BY s.sort_order, i.sort_order`,
        [input.id]
      );
      
      return {
        ...templates[0],
        sections: sections.map(s => ({
          ...s,
          items: items.filter(i => i.section_id === s.id)
        }))
      };
    }),
  
  createTemplate: mutationProcedure
    .input(z.object({
      name: z.string(),
      machineType: z.string().default("PRESS"),
      referentiel: z.string().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const id = `vgp_tpl_${generateId()}`;
      
      await pgQuery(
        `INSERT INTO vgp_templates (id, name, machine_type, version, active, referentiel, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, 1, true, $4, $5, $6, $7)`,
        [id, input.name, input.machineType, input.referentiel || null, JSON.stringify(input.metadata || {}), now, now]
      );
      
      return { id };
    }),
  
  duplicateTemplate: mutationProcedure
    .input(z.object({
      sourceId: z.string(),
      newName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      
      // Get source template
      const source = await pgQuery<DbVGPTemplate>(
        `SELECT * FROM vgp_templates WHERE id = $1`,
        [input.sourceId]
      );
      
      if (!source[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template source introuvable" });
      }
      
      // Get max version for this name
      const maxVersion = await pgQuery<{ max_version: number }>(
        `SELECT COALESCE(MAX(version), 0) as max_version FROM vgp_templates WHERE name = $1`,
        [input.newName]
      );
      const newVersion = (maxVersion[0]?.max_version || 0) + 1;
      
      const newId = `vgp_tpl_${generateId()}`;
      
      // Create new template
      await pgQuery(
        `INSERT INTO vgp_templates (id, name, machine_type, version, active, referentiel, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8)`,
        [newId, input.newName, source[0].machine_type, newVersion, source[0].referentiel, JSON.stringify(source[0].metadata || {}), now, now]
      );
      
      // Copy sections and items
      const sections = await pgQuery<DbVGPSection>(
        `SELECT * FROM vgp_template_sections WHERE template_id = $1 ORDER BY sort_order`,
        [input.sourceId]
      );
      
      for (const section of sections) {
        const newSectionId = `vgp_sec_${generateId()}`;
        
        await pgQuery(
          `INSERT INTO vgp_template_sections (id, template_id, code, title, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [newSectionId, newId, section.code, section.title, section.sort_order]
        );
        
        const items = await pgQuery<DbVGPItem>(
          `SELECT * FROM vgp_template_items WHERE section_id = $1 ORDER BY sort_order`,
          [section.id]
        );
        
        for (const item of items) {
          const newItemId = `vgp_item_${generateId()}`;
          await pgQuery(
            `INSERT INTO vgp_template_items (id, section_id, numero, label, help_text, sort_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [newItemId, newSectionId, item.numero, item.label, item.help_text, item.sort_order, item.active]
          );
        }
      }
      
      return { id: newId, version: newVersion };
    }),
  
  updateTemplateItem: mutationProcedure
    .input(z.object({
      itemId: z.string(),
      label: z.string().optional(),
      helpText: z.string().nullable().optional(),
      active: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;
      
      if (input.label !== undefined) {
        updates.push(`label = $${idx++}`);
        params.push(input.label);
      }
      if (input.helpText !== undefined) {
        updates.push(`help_text = $${idx++}`);
        params.push(input.helpText);
      }
      if (input.active !== undefined) {
        updates.push(`active = $${idx++}`);
        params.push(input.active);
      }
      
      if (updates.length === 0) return { success: true };
      
      params.push(input.itemId);
      await pgQuery(
        `UPDATE vgp_template_items SET ${updates.join(', ')} WHERE id = $${idx}`,
        params
      );
      
      return { success: true };
    }),
  
  // =============================================
  // REPORTS (regroupement multi-machines)
  // =============================================
  
  listReports: publicProcedure
    .input(z.object({
      clientId: z.string().optional(),
      siteId: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }).optional())
    .query(async ({ input }) => {
      let query = `
        SELECT r.*, c.name as client_name, s.name as site_name
        FROM vgp_reports r
        LEFT JOIN clients c ON r.client_id = c.id
        LEFT JOIN sites s ON r.site_id = s.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;
      
      if (input?.clientId) {
        query += ` AND r.client_id = $${idx++}`;
        params.push(input.clientId);
      }
      if (input?.siteId) {
        query += ` AND r.site_id = $${idx++}`;
        params.push(input.siteId);
      }
      
      query += ` ORDER BY r.date_rapport DESC LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(input?.limit || 50, input?.offset || 0);
      
      const reports = await pgQuery<DbVGPReport>(query, params);
      return reports;
    }),
  
  getReportById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const reports = await pgQuery<DbVGPReport>(
        `SELECT r.*, c.name as client_name, s.name as site_name
         FROM vgp_reports r
         LEFT JOIN clients c ON r.client_id = c.id
         LEFT JOIN sites s ON r.site_id = s.id
         WHERE r.id = $1`,
        [input.id]
      );
      
      if (!reports[0]) return null;
      
      // Get all runs for this report
      const runs = await pgQuery<DbVGPRun>(
        `SELECT r.*, 
                a.code_interne as asset_code,
                a.designation as asset_designation,
                a.marque as asset_marque,
                a.modele as asset_modele,
                a.numero_serie as asset_numero_serie,
                a.annee as asset_annee,
                a.force_nominale as asset_force
         FROM vgp_inspection_runs r
         LEFT JOIN assets a ON r.asset_id = a.id
         WHERE r.report_id = $1
         ORDER BY a.code_interne`,
        [input.id]
      );
      
      // Get observation count per run
      const obsCount = await pgQuery<{ run_id: string; count: string }>(
        `SELECT run_id, COUNT(*) as count FROM vgp_observations WHERE run_id = ANY($1) GROUP BY run_id`,
        [runs.map(r => r.id)]
      );
      
      const obsMap = new Map(obsCount.map(o => [o.run_id, parseInt(o.count)]));
      
      return {
        ...reports[0],
        runs: runs.map(r => ({
          ...r,
          observationCount: obsMap.get(r.id) || 0
        }))
      };
    }),
  
  createReport: mutationProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const createReportSchema = z.object({
        clientId: z.string(),
        siteId: z.string(),
        signataire: z.string().min(1),
        assetIds: z.array(z.string()).min(1),
        templateId: z.string(),
        dateRapport: z.string().optional(),
      });

      const raw = (input ?? {}) as any;
      const body = (ctx as any)?.rawJson ?? {};
      const candidate =
        raw?.json ??
        raw?.input ??
        body?.json ??
        body?.input ??
        (Object.keys(raw || {}).length > 0 ? raw : body);

      const data = createReportSchema.parse(candidate);

      console.log("[VGP] createReport input", data);
      if (!data.signataire || data.signataire.trim().length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le signataire est requis",
        });
      }
      if (!data.templateId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le template est requis",
        });
      }
      if (!data.assetIds || data.assetIds.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Au moins un équipement est requis",
        });
      }
      const now = new Date().toISOString();
      const reportId = `vgp_rpt_${generateId()}`;
      const numeroRapport = generateReportNumber();
      
      // Create report
      await pgQuery(
        `INSERT INTO vgp_reports (id, client_id, site_id, numero_rapport, date_rapport, signataire, has_observations, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)`,
        [reportId, data.clientId, data.siteId, numeroRapport, data.dateRapport || now, data.signataire, now, now]
      );
      
      // Create runs for each asset
      const runIds: string[] = [];
      for (const assetId of data.assetIds) {
        const runId = `vgp_run_${generateId()}`;
        runIds.push(runId);
        
        await pgQuery(
          `INSERT INTO vgp_inspection_runs (id, report_id, template_id, asset_id, date_inspection, verificateur, conclusion, statut, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'EN_COURS', 'BROUILLON', $7, $8)`,
          [runId, reportId, data.templateId, assetId, data.dateRapport || now, data.signataire, now, now]
        );
        
        // Pre-create all item results with NA
        const items = await pgQuery<{ id: string }>(
          `SELECT i.id FROM vgp_template_items i
           JOIN vgp_template_sections s ON i.section_id = s.id
           WHERE s.template_id = $1 AND i.active = true`,
          [data.templateId]
        );
        
        for (const item of items) {
          await pgQuery(
            `INSERT INTO vgp_item_results (id, run_id, item_id, result, created_at, updated_at)
             VALUES ($1, $2, $3, 'NA', $4, $5)`,
            [`vgp_res_${generateId()}`, runId, item.id, now, now]
          );
        }
      }
      
      return { 
        reportId, 
        numeroRapport, 
        runIds 
      };
    }),
  
  // =============================================
  // INSPECTION RUNS (fiche par machine)
  // =============================================
  
  getRunById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const runs = await pgQuery<DbVGPRun>(
        `SELECT r.*, 
                a.code_interne as asset_code,
                a.designation as asset_designation,
                a.marque as asset_marque,
                a.modele as asset_modele,
                a.numero_serie as asset_numero_serie,
                a.annee as asset_annee,
                a.force_nominale as asset_force
         FROM vgp_inspection_runs r
         LEFT JOIN assets a ON r.asset_id = a.id
         WHERE r.id = $1`,
        [input.id]
      );
      
      if (!runs[0]) return null;
      
      // Get template with sections/items
      const template = await pgQuery<DbVGPTemplate>(
        `SELECT * FROM vgp_templates WHERE id = $1`,
        [runs[0].template_id]
      );
      
      const sections = await pgQuery<DbVGPSection>(
        `SELECT * FROM vgp_template_sections WHERE template_id = $1 ORDER BY sort_order`,
        [runs[0].template_id]
      );
      
      const items = await pgQuery<DbVGPItem>(
        `SELECT i.*, s.code as section_code FROM vgp_template_items i
         JOIN vgp_template_sections s ON i.section_id = s.id
         WHERE s.template_id = $1 AND i.active = true
         ORDER BY s.sort_order, i.sort_order`,
        [runs[0].template_id]
      );
      
      // Get results
      const results = await pgQuery<DbVGPItemResult>(
        `SELECT r.*, i.numero as item_numero, i.label as item_label, s.code as section_code
         FROM vgp_item_results r
         JOIN vgp_template_items i ON r.item_id = i.id
         JOIN vgp_template_sections s ON i.section_id = s.id
         WHERE r.run_id = $1
         ORDER BY s.sort_order, i.sort_order`,
        [input.id]
      );
      
      // Get observations
      const observations = await pgQuery<DbVGPObservation>(
        `SELECT * FROM vgp_observations WHERE run_id = $1 ORDER BY item_numero`,
        [input.id]
      );
      
      const resultsMap = new Map(results.map(r => [r.item_id, r]));
      
      return {
        ...runs[0],
        template: template[0],
        sections: sections.map(s => ({
          ...s,
          items: items.filter(i => i.section_id === s.id).map(i => ({
            ...i,
            result: resultsMap.get(i.id) || null
          }))
        })),
        observations
      };
    }),
  
  updateRunHeader: mutationProcedure
    .input(z.object({
      runId: z.string(),
      compteurType: z.string().optional(),
      compteurValeur: z.number().optional(),
      conditionsIntervention: z.string().optional(),
      modesFonctionnement: z.string().optional(),
      moyensDisposition: z.boolean().optional(),
      particularites: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const updates: string[] = ['updated_at = $1'];
      const params: any[] = [now];
      let idx = 2;
      
      if (input.compteurType !== undefined) {
        updates.push(`compteur_type = $${idx++}`);
        params.push(input.compteurType);
      }
      if (input.compteurValeur !== undefined) {
        updates.push(`compteur_valeur = $${idx++}`);
        params.push(input.compteurValeur);
      }
      if (input.conditionsIntervention !== undefined) {
        updates.push(`conditions_intervention = $${idx++}`);
        params.push(input.conditionsIntervention);
      }
      if (input.modesFonctionnement !== undefined) {
        updates.push(`modes_fonctionnement = $${idx++}`);
        params.push(input.modesFonctionnement);
      }
      if (input.moyensDisposition !== undefined) {
        updates.push(`moyens_disposition = $${idx++}`);
        params.push(input.moyensDisposition);
      }
      if (input.particularites !== undefined) {
        updates.push(`particularites = $${idx++}`);
        params.push(input.particularites);
      }
      
      params.push(input.runId);
      await pgQuery(
        `UPDATE vgp_inspection_runs SET ${updates.join(', ')} WHERE id = $${idx}`,
        params
      );
      
      return { success: true };
    }),
  
  // =============================================
  // ITEM RESULTS (saisie checklist)
  // =============================================
  
  updateItemResult: mutationProcedure
    .input(z.object({
      runId: z.string(),
      itemId: z.string(),
      result: z.enum(['OUI', 'NON', 'NA']),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      
      // Upsert result
      await pgQuery(
        `INSERT INTO vgp_item_results (id, run_id, item_id, result, comment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (run_id, item_id) DO UPDATE SET result = $4, comment = $5, updated_at = $7`,
        [`vgp_res_${generateId()}`, input.runId, input.itemId, input.result, input.comment || null, now, now]
      );
      
      // Get item info for auto-observation
      const items = await pgQuery<{ id: string; numero: number; label: string; asset_id: string }>(
        `SELECT i.id, i.numero, i.label, r.asset_id
         FROM vgp_template_items i
         JOIN vgp_template_sections s ON i.section_id = s.id
         JOIN vgp_inspection_runs r ON s.template_id = r.template_id
         WHERE i.id = $1 AND r.id = $2`,
        [input.itemId, input.runId]
      );
      
      const item = items[0];
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item introuvable" });
      }
      
      // Auto-observation logic
      if (input.result === 'NON') {
        // Create or update auto-observation
        const existingObs = await pgQuery<{ id: string }>(
          `SELECT id FROM vgp_observations WHERE run_id = $1 AND item_id = $2 AND is_auto = true`,
          [input.runId, input.itemId]
        );
        
        const description = `Non conformité au point ${item.numero} : ${item.label}`;
        
        if (existingObs.length > 0) {
          await pgQuery(
            `UPDATE vgp_observations SET description = $1, statut = 'OUVERTE', updated_at = $2 WHERE id = $3`,
            [description, now, existingObs[0].id]
          );
        } else {
          await pgQuery(
            `INSERT INTO vgp_observations (id, run_id, asset_id, item_id, item_numero, description, gravite, statut, is_auto, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 3, 'OUVERTE', true, $7, $8)`,
            [`vgp_obs_${generateId()}`, input.runId, item.asset_id, input.itemId, item.numero, description, now, now]
          );
        }
      } else {
        // If result is OUI or NA, mark auto-observation as resolved
        await pgQuery(
          `UPDATE vgp_observations SET statut = 'RESOLUE', updated_at = $1 WHERE run_id = $2 AND item_id = $3 AND is_auto = true`,
          [now, input.runId, input.itemId]
        );
      }
      
      return { success: true };
    }),
  
  // =============================================
  // OBSERVATIONS
  // =============================================
  
  listObservations: publicProcedure
    .input(z.object({
      runId: z.string().optional(),
      assetId: z.string().optional(),
      reportId: z.string().optional(),
      statut: z.string().optional(),
      gravite: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      let query = `
        SELECT o.*, a.code_interne as asset_code, a.designation as asset_designation
        FROM vgp_observations o
        LEFT JOIN assets a ON o.asset_id = a.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;
      
      if (input?.runId) {
        query += ` AND o.run_id = $${idx++}`;
        params.push(input.runId);
      }
      if (input?.assetId) {
        query += ` AND o.asset_id = $${idx++}`;
        params.push(input.assetId);
      }
      if (input?.reportId) {
        query += ` AND o.run_id IN (SELECT id FROM vgp_inspection_runs WHERE report_id = $${idx++})`;
        params.push(input.reportId);
      }
      if (input?.statut) {
        query += ` AND o.statut = $${idx++}`;
        params.push(input.statut);
      }
      if (input?.gravite) {
        query += ` AND o.gravite = $${idx++}`;
        params.push(input.gravite);
      }
      
      query += ` ORDER BY o.gravite DESC, o.item_numero`;
      
      const observations = await pgQuery<DbVGPObservation>(query, params);
      return observations;
    }),
  
  createObservation: mutationProcedure
    .input(z.object({
      runId: z.string(),
      assetId: z.string(),
      itemId: z.string().optional(),
      itemNumero: z.number().optional(),
      description: z.string(),
      recommandation: z.string().optional(),
      gravite: z.number().min(1).max(5).optional().default(3),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const id = `vgp_obs_${generateId()}`;
      
      await pgQuery(
        `INSERT INTO vgp_observations (id, run_id, asset_id, item_id, item_numero, description, recommandation, gravite, statut, is_auto, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OUVERTE', false, $9, $10)`,
        [id, input.runId, input.assetId, input.itemId || null, input.itemNumero || null, input.description, input.recommandation || null, input.gravite, now, now]
      );
      
      return { id };
    }),
  
  updateObservation: mutationProcedure
    .input(z.object({
      id: z.string(),
      description: z.string().optional(),
      recommandation: z.string().optional(),
      gravite: z.number().optional(),
      statut: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      const updates: string[] = ['updated_at = $1'];
      const params: any[] = [now];
      let idx = 2;
      
      if (input.description !== undefined) {
        updates.push(`description = $${idx++}`);
        params.push(input.description);
      }
      if (input.recommandation !== undefined) {
        updates.push(`recommandation = $${idx++}`);
        params.push(input.recommandation);
      }
      if (input.gravite !== undefined) {
        updates.push(`gravite = $${idx++}`);
        params.push(input.gravite);
      }
      if (input.statut !== undefined) {
        updates.push(`statut = $${idx++}`);
        params.push(input.statut);
      }
      
      params.push(input.id);
      await pgQuery(
        `UPDATE vgp_observations SET ${updates.join(', ')} WHERE id = $${idx}`,
        params
      );
      
      return { success: true };
    }),
  
  // =============================================
  // VALIDATION & CONCLUSION
  // =============================================
  
  validateRun: mutationProcedure
    .input(z.object({
      runId: z.string(),
      conclusion: z.enum(['CONFORME', 'NON_CONFORME', 'CONFORME_SOUS_RESERVE']),
      signedBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      
      await pgQuery(
        `UPDATE vgp_inspection_runs 
         SET conclusion = $1, statut = 'VALIDE', signed_by = $2, signed_at = $3, updated_at = $4
         WHERE id = $5`,
        [input.conclusion, input.signedBy || null, now, now, input.runId]
      );
      
      // Update report has_observations flag
      const obsCount = await pgQuery<{ count: string }>(
        `SELECT COUNT(*) as count FROM vgp_observations o
         JOIN vgp_inspection_runs r ON o.run_id = r.id
         WHERE r.id = $1 AND o.statut = 'OUVERTE'`,
        [input.runId]
      );
      
      const run = await pgQuery<{ report_id: string }>(
        `SELECT report_id FROM vgp_inspection_runs WHERE id = $1`,
        [input.runId]
      );
      
      if (run[0]) {
        const totalObs = await pgQuery<{ count: string }>(
          `SELECT COUNT(*) as count FROM vgp_observations o
           JOIN vgp_inspection_runs r ON o.run_id = r.id
           WHERE r.report_id = $1 AND o.statut = 'OUVERTE'`,
          [run[0].report_id]
        );
        
        await pgQuery(
          `UPDATE vgp_reports SET has_observations = $1, updated_at = $2 WHERE id = $3`,
          [parseInt(totalObs[0]?.count || '0') > 0, now, run[0].report_id]
        );
      }
      
      return { success: true };
    }),
  
  finalizeReport: mutationProcedure
    .input(z.object({
      reportId: z.string(),
      synthese: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const now = new Date().toISOString();
      
      // Check all runs are validated
      const pendingRuns = await pgQuery<{ count: string }>(
        `SELECT COUNT(*) as count FROM vgp_inspection_runs WHERE report_id = $1 AND statut != 'VALIDE'`,
        [input.reportId]
      );
      
      if (parseInt(pendingRuns[0]?.count || '0') > 0) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Toutes les fiches doivent être validées avant de finaliser le rapport" 
        });
      }
      
      // Check observations
      const obsCount = await pgQuery<{ count: string }>(
        `SELECT COUNT(*) as count FROM vgp_observations o
         JOIN vgp_inspection_runs r ON o.run_id = r.id
         WHERE r.report_id = $1 AND o.statut = 'OUVERTE'`,
        [input.reportId]
      );
      
      const hasObs = parseInt(obsCount[0]?.count || '0') > 0;
      const synthese = input.synthese || (hasObs ? 'Rapport avec observations' : 'Aucune observation constatée');
      
      await pgQuery(
        `UPDATE vgp_reports SET synthese = $1, has_observations = $2, updated_at = $3 WHERE id = $4`,
        [synthese, hasObs, now, input.reportId]
      );
      
      return { success: true, hasObservations: hasObs };
    }),
  
  // =============================================
  // PDF GENERATION
  // =============================================
  
  generatePDF: mutationProcedure
    .input(z.object({
      reportId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get full report data
      const reports = await pgQuery<DbVGPReport>(
        `SELECT r.*, c.name as client_name, s.name as site_name, s.address as site_address
         FROM vgp_reports r
         LEFT JOIN clients c ON r.client_id = c.id
         LEFT JOIN sites s ON r.site_id = s.id
         WHERE r.id = $1`,
        [input.reportId]
      );
      
      if (!reports[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rapport introuvable" });
      }
      
      const report = reports[0];
      
      // Get all runs with details
      const runs = await pgQuery<DbVGPRun & { site_address?: string }>(
        `SELECT r.*, 
                a.code_interne as asset_code,
                a.designation as asset_designation,
                a.marque as asset_marque,
                a.modele as asset_modele,
                a.numero_serie as asset_numero_serie,
                a.annee as asset_annee,
                a.force_nominale as asset_force
         FROM vgp_inspection_runs r
         LEFT JOIN assets a ON r.asset_id = a.id
         WHERE r.report_id = $1
         ORDER BY a.code_interne`,
        [input.reportId]
      );
      
      // Get observations for all runs
      const observations = await pgQuery<DbVGPObservation>(
        `SELECT o.*, a.code_interne as asset_code
         FROM vgp_observations o
         LEFT JOIN assets a ON o.asset_id = a.id
         WHERE o.run_id = ANY($1)
         ORDER BY o.run_id, o.item_numero`,
        [runs.map(r => r.id)]
      );
      
      // Generate PDF content (simplified HTML -> could be enhanced with proper PDF lib)
      const pdfContent = generatePDFContent(report, runs, observations);
      
      // For now, store as HTML (in production, use puppeteer/pdfkit)
      const pdfPath = `/var/www/in-spectra-reports/${report.numero_rapport}.html`;
      const pdfUrl = `https://api.in-spectra.com/reports/${report.numero_rapport}.html`;
      
      // Update report with PDF path
      await pgQuery(
        `UPDATE vgp_reports SET pdf_path = $1, pdf_url = $2, updated_at = $3 WHERE id = $4`,
        [pdfPath, pdfUrl, new Date().toISOString(), input.reportId]
      );
      
      return { 
        success: true, 
        pdfUrl,
        pdfContent // Return content for frontend to handle
      };
    }),
});

// =============================================
// PDF CONTENT GENERATOR
// =============================================

function generatePDFContent(
  report: DbVGPReport & { site_address?: string },
  runs: (DbVGPRun & { site_address?: string })[],
  observations: DbVGPObservation[]
): string {
  const obsMap = new Map<string, DbVGPObservation[]>();
  observations.forEach(o => {
    const existing = obsMap.get(o.run_id) || [];
    existing.push(o);
    obsMap.set(o.run_id, existing);
  });
  
  const dateFormatted = new Date(report.date_rapport).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport VGP - ${report.numero_rapport}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .page-break { page-break-after: always; }
    h1 { color: #1a5f4a; border-bottom: 3px solid #4ad7b8; padding-bottom: 10px; }
    h2 { color: #1a5f4a; margin-top: 30px; }
    h3 { color: #333; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #4ad7b8; }
    .synthese { padding: 20px; border-radius: 8px; margin: 20px 0; }
    .synthese.conforme { background: #e6f7f0; border: 2px solid #4ad7b8; }
    .synthese.non-conforme { background: #fef2f2; border: 2px solid #ef4444; }
    .observation { background: #fff7ed; border-left: 4px solid #f97316; padding: 10px; margin: 10px 0; }
    .section-title { background: #1a5f4a; color: white; padding: 8px 15px; margin-top: 20px; }
    .machine-header { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <!-- PAGE DE GARDE -->
  <div class="header">
    <div class="logo">IN-SPECTRA</div>
    <div>Organisme de contrôle</div>
  </div>
  
  <h1>RAPPORT DE VÉRIFICATION GÉNÉRALE PÉRIODIQUE</h1>
  
  <table>
    <tr><th width="200">N° Rapport</th><td><strong>${report.numero_rapport}</strong></td></tr>
    <tr><th>Entreprise</th><td>${report.client_name || '-'}</td></tr>
    <tr><th>Site</th><td>${report.site_name || '-'}</td></tr>
    <tr><th>Adresse</th><td>${report.site_address || '-'}</td></tr>
    <tr><th>Date de vérification</th><td>${dateFormatted}</td></tr>
    <tr><th>Vérificateur / Signataire</th><td>${report.signataire}</td></tr>
    <tr><th>Nombre de machines</th><td>${runs.length}</td></tr>
  </table>
  
  <div class="synthese ${report.has_observations ? 'non-conforme' : 'conforme'}">
    <h3>SYNTHÈSE</h3>
    <p><strong>${report.has_observations ? '⚠️ RAPPORT AVEC OBSERVATIONS' : '✅ AUCUNE OBSERVATION CONSTATÉE'}</strong></p>
    ${report.synthese ? `<p>${report.synthese}</p>` : ''}
  </div>
  
  <div class="page-break"></div>
  
  <!-- PRÉAMBULE -->
  <h2>PRÉAMBULE</h2>
  
  <h3>Objet</h3>
  <p>Le présent rapport a pour objet de rendre compte des vérifications générales périodiques effectuées conformément aux dispositions du Code du travail (articles R.4323-23 à R.4323-27).</p>
  
  <h3>Limites de la vérification</h3>
  <p>Les vérifications portent sur les parties visibles et accessibles des équipements, sans démontage. Les essais sont réalisés en conditions sûres (à vide si applicable).</p>
  
  <h3>Conservation</h3>
  <p>Ce rapport doit être conservé pendant au moins 5 ans et tenu à disposition de l'inspection du travail.</p>
  
  <h3>Confidentialité</h3>
  <p>Ce document est confidentiel et destiné uniquement au client mentionné.</p>
  
  <div class="page-break"></div>
  
  <!-- SOMMAIRE -->
  <h2>SOMMAIRE</h2>
  
  <table>
    <tr><th>N°</th><th>Équipement</th><th>Conclusion</th><th>Observations</th></tr>
    ${runs.map((run, idx) => {
      const runObs = obsMap.get(run.id) || [];
      const openObs = runObs.filter(o => o.statut === 'OUVERTE').length;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${run.asset_code} - ${run.asset_designation}</td>
          <td>${run.conclusion === 'CONFORME' ? '✅ Conforme' : run.conclusion === 'NON_CONFORME' ? '❌ Non conforme' : '⚠️ Sous réserve'}</td>
          <td>${openObs > 0 ? `${openObs} observation(s)` : 'Aucune'}</td>
        </tr>
      `;
    }).join('')}
  </table>
  
  ${observations.filter(o => o.statut === 'OUVERTE').length > 0 ? `
  <h3>Récapitulatif des observations</h3>
  <table>
    <tr><th>Machine</th><th>Point</th><th>Description</th><th>Gravité</th></tr>
    ${observations.filter(o => o.statut === 'OUVERTE').map(o => `
      <tr>
        <td>${o.asset_code || '-'}</td>
        <td>${o.item_numero || '-'}</td>
        <td>${o.description}</td>
        <td>${'⭐'.repeat(o.gravite)}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}
  
  <div class="page-break"></div>
  
  <!-- DÉTAIL PAR MACHINE -->
  ${runs.map((run, idx) => {
    const runObs = obsMap.get(run.id) || [];
    const openObs = runObs.filter(o => o.statut === 'OUVERTE');
    
    return `
    <h2>MACHINE ${idx + 1} : ${run.asset_code}</h2>
    
    <div class="machine-header">
      <h3>Identification</h3>
      <table>
        <tr><th>Nature</th><td>${run.asset_designation || '-'}</td></tr>
        <tr><th>Marque</th><td>${run.asset_marque || '-'}</td></tr>
        <tr><th>Modèle</th><td>${run.asset_modele || '-'}</td></tr>
        <tr><th>Réf. interne</th><td>${run.asset_code || '-'}</td></tr>
        <tr><th>N° série</th><td>${run.asset_numero_serie || '-'}</td></tr>
        <tr><th>Année mise en service</th><td>${run.asset_annee || '-'}</td></tr>
        <tr><th>Force nominale</th><td>${run.asset_force || '-'}</td></tr>
        <tr><th>Compteur</th><td>${run.compteur_type ? `${run.compteur_valeur} ${run.compteur_type}` : '-'}</td></tr>
      </table>
    </div>
    
    <h3>Mission / Référentiel</h3>
    <p>Vérification générale périodique selon Code du travail Art. R.4323-23 à R.4323-27</p>
    
    <h3>Moyens mis à disposition</h3>
    <p>${run.moyens_disposition ? '✅ Oui' : '❌ Non'}</p>
    
    <h3>Conditions d'intervention</h3>
    <p>${run.conditions_intervention || 'Machine à l\'arrêt, zone sécurisée, opérateur présent'}</p>
    
    <h3>Résultat de la vérification</h3>
    <div class="synthese ${run.conclusion === 'CONFORME' ? 'conforme' : 'non-conforme'}">
      <strong>${run.conclusion === 'CONFORME' ? '✅ Aucune anomalie décelée' : run.conclusion === 'NON_CONFORME' ? '❌ Anomalies constatées' : '⚠️ Conforme sous réserve'}</strong>
    </div>
    
    ${run.particularites ? `
    <h3>Particularités / Dispositifs de protection</h3>
    <p>${run.particularites}</p>
    ` : ''}
    
    ${openObs.length > 0 ? `
    <h3>Observations</h3>
    ${openObs.map(obs => `
      <div class="observation">
        <strong>Point ${obs.item_numero || '?'}</strong> : ${obs.description}
        ${obs.recommandation ? `<br><em>Recommandation : ${obs.recommandation}</em>` : ''}
      </div>
    `).join('')}
    ` : ''}
    
    ${idx < runs.length - 1 ? '<div class="page-break"></div>' : ''}
    `;
  }).join('')}
  
  <!-- FOOTER -->
  <div class="footer">
    <p><strong>Note :</strong> Les vérifications portent sur les parties visibles et accessibles. Les essais ont été réalisés dans des conditions sûres (à vide si applicable).</p>
    <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} - IN-SPECTRA</p>
  </div>
</body>
</html>
  `;
}
