import { z } from "zod";

import { createTRPCRouter, protectedProcedure, adminProcedure } from "../create-context";
import { ensurePgSchema, getPgPool, pgQuery } from "../../db/postgres";

function generateId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function isoNow(): string {
  return new Date().toISOString();
}

type SeedCounts = {
  users: number;
  sites: number;
  zones: number;
  assets: number;
  controlTypes: number;
  assetControls: number;
  missions: number;
  missionAssets: number;
  reports: number;
  reportItemResults: number;
  nonconformities: number;
  correctiveActions: number;
  maintenanceLogs: number;
};

const TABLES_DELETE_ORDER: string[] = [
  "outbox",
  "documents",
  "maintenance_logs",
  "corrective_actions",
  "nonconformities",
  "report_item_results",
  "reports",
  "mission_assets",
  "missions",
  "checklist_items",
  "checklist_templates",
  "asset_controls",
  "control_types",
  "assets",
  "zones",
  "sites",
  "clients",
  "users",
];

export const adminRouter = createTRPCRouter({
  // ============ USERS ============
  listUsers: adminProcedure.query(async () => {
    const users = await pgQuery<any>(
      "SELECT id, email, name, role, created_at FROM users ORDER BY name"
    );
    return users;
  }),

  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.enum(["ADMIN", "HSE_MANAGER", "TECHNICIAN", "AUDITOR"]),
        password: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      const now = isoNow();
      const token = `token_${generateId()}`;

      await pgQuery(
        `INSERT INTO users (id, email, name, role, token_mock, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, input.email, input.name, input.role, token, now]
      );

      return { id, email: input.email, name: input.name, role: input.role, created_at: now };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        name: z.string().min(1).optional(),
        role: z.enum(["ADMIN", "HSE_MANAGER", "TECHNICIAN", "AUDITOR"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.email) {
        updates.push(`email = $${idx++}`);
        params.push(input.email);
      }
      if (input.name) {
        updates.push(`name = $${idx++}`);
        params.push(input.name);
      }
      if (input.role) {
        updates.push(`role = $${idx++}`);
        params.push(input.role);
      }

      if (updates.length === 0) return null;

      params.push(input.id);
      await pgQuery(`UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const users = await pgQuery<any>("SELECT * FROM users WHERE id = $1", [input.id]);
      return users[0] || null;
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await pgQuery("DELETE FROM users WHERE id = $1", [input.id]);
      return { success: true };
    }),

  // ============ SITES ============
  listSites: protectedProcedure.query(async () => {
    const sites = await pgQuery<any>(
      `SELECT s.*, c.name as client_name FROM sites s 
       LEFT JOIN clients c ON s.client_id = c.id 
       ORDER BY s.name`
    );
    return sites;
  }),

  createSite: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        client_id: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      const now = isoNow();

      let clientId = input.client_id;
      if (!clientId) {
        const clients = await pgQuery<any>("SELECT id FROM clients LIMIT 1");
        if (clients.length === 0) {
          const newClientId = generateId();
          await pgQuery(
            "INSERT INTO clients (id, name, created_at) VALUES ($1, $2, $3)",
            [newClientId, "Client par défaut", now]
          );
          clientId = newClientId;
        } else {
          clientId = clients[0].id;
        }
      }

      await pgQuery(
        `INSERT INTO sites (id, client_id, name, address, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, clientId, input.name, input.address || null, now]
      );

      return { id, name: input.name, address: input.address || null, client_id: clientId, created_at: now };
    }),

  updateSite: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.name) {
        updates.push(`name = $${idx++}`);
        params.push(input.name);
      }
      if (input.address !== undefined) {
        updates.push(`address = $${idx++}`);
        params.push(input.address);
      }

      if (updates.length === 0) return null;

      params.push(input.id);
      await pgQuery(`UPDATE sites SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const sites = await pgQuery<any>("SELECT * FROM sites WHERE id = $1", [input.id]);
      return sites[0] || null;
    }),

  deleteSite: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await pgQuery("DELETE FROM zones WHERE site_id = $1", [input.id]);
      await pgQuery("DELETE FROM sites WHERE id = $1", [input.id]);
      return { success: true };
    }),

  // ============ ZONES ============
  listZones: protectedProcedure
    .input(z.object({ siteId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let query = `SELECT z.*, s.name as site_name FROM zones z 
                   LEFT JOIN sites s ON z.site_id = s.id`;
      const params: any[] = [];

      if (input?.siteId) {
        query += " WHERE z.site_id = $1";
        params.push(input.siteId);
      }

      query += " ORDER BY s.name, z.name";
      return pgQuery<any>(query, params);
    }),

  createZone: adminProcedure
    .input(
      z.object({
        site_id: z.string(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();

      await pgQuery(
        "INSERT INTO zones (id, site_id, name) VALUES ($1, $2, $3)",
        [id, input.site_id, input.name]
      );

      return { id, site_id: input.site_id, name: input.name };
    }),

  updateZone: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        site_id: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.name) {
        updates.push(`name = $${idx++}`);
        params.push(input.name);
      }
      if (input.site_id) {
        updates.push(`site_id = $${idx++}`);
        params.push(input.site_id);
      }

      if (updates.length === 0) return null;

      params.push(input.id);
      await pgQuery(`UPDATE zones SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const zones = await pgQuery<any>("SELECT * FROM zones WHERE id = $1", [input.id]);
      return zones[0] || null;
    }),

  deleteZone: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await pgQuery("DELETE FROM zones WHERE id = $1", [input.id]);
      return { success: true };
    }),

  // ============ CONTROL TYPES ============
  listControlTypes: protectedProcedure.query(async () => {
    return pgQuery<any>("SELECT * FROM control_types ORDER BY label");
  }),

  createControlType: adminProcedure
    .input(
      z.object({
        code: z.string().min(1),
        label: z.string().min(1),
        description: z.string().optional(),
        periodicity_days: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();

      await pgQuery(
        `INSERT INTO control_types (id, code, label, description, periodicity_days, active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [id, input.code, input.label, input.description || null, input.periodicity_days]
      );

      return { id, ...input, active: true };
    }),

  updateControlType: adminProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().min(1).optional(),
        label: z.string().min(1).optional(),
        description: z.string().optional(),
        periodicity_days: z.number().min(1).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.code) {
        updates.push(`code = $${idx++}`);
        params.push(input.code);
      }
      if (input.label) {
        updates.push(`label = $${idx++}`);
        params.push(input.label);
      }
      if (input.description !== undefined) {
        updates.push(`description = $${idx++}`);
        params.push(input.description);
      }
      if (input.periodicity_days) {
        updates.push(`periodicity_days = $${idx++}`);
        params.push(input.periodicity_days);
      }
      if (input.active !== undefined) {
        updates.push(`active = $${idx++}`);
        params.push(input.active);
      }

      if (updates.length === 0) return null;

      params.push(input.id);
      await pgQuery(`UPDATE control_types SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const types = await pgQuery<any>("SELECT * FROM control_types WHERE id = $1", [input.id]);
      return types[0] || null;
    }),

  deleteControlType: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await pgQuery("UPDATE control_types SET active = false WHERE id = $1", [input.id]);
      return { success: true };
    }),

  // ============ CHECKLIST TEMPLATES ============
  listChecklistTemplates: protectedProcedure
    .input(z.object({ controlTypeId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let query = `SELECT ct.*, ctype.label as control_type_label 
                   FROM checklist_templates ct
                   LEFT JOIN control_types ctype ON ct.control_type_id = ctype.id`;
      const params: any[] = [];

      if (input?.controlTypeId) {
        query += " WHERE ct.control_type_id = $1";
        params.push(input.controlTypeId);
      }

      query += " ORDER BY ct.name";
      return pgQuery<any>(query, params);
    }),

  createChecklistTemplate: adminProcedure
    .input(
      z.object({
        control_type_id: z.string(),
        asset_category: z.string().optional(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();

      await pgQuery(
        `INSERT INTO checklist_templates (id, control_type_id, asset_category, name)
         VALUES ($1, $2, $3, $4)`,
        [id, input.control_type_id, input.asset_category || null, input.name]
      );

      return { id, ...input };
    }),

  deleteChecklistTemplate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await pgQuery("DELETE FROM checklist_items WHERE template_id = $1", [input.id]);
      await pgQuery("DELETE FROM checklist_templates WHERE id = $1", [input.id]);
      return { success: true };
    }),

  // ============ CHECKLIST ITEMS ============
  listChecklistItems: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ input }) => {
      return pgQuery<any>(
        "SELECT * FROM checklist_items WHERE template_id = $1 ORDER BY sort_order",
        [input.templateId]
      );
    }),

  createChecklistItem: adminProcedure
    .input(
      z.object({
        template_id: z.string(),
        label: z.string().min(1),
        field_type: z.enum(["BOOL", "NUM", "TEXT"]),
        required: z.boolean().default(true),
        help_text: z.string().optional(),
        sort_order: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();

      await pgQuery(
        `INSERT INTO checklist_items (id, template_id, label, field_type, required, help_text, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, input.template_id, input.label, input.field_type, input.required, input.help_text || null, input.sort_order]
      );

      return { id, ...input };
    }),

  updateChecklistItem: adminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).optional(),
        field_type: z.enum(["BOOL", "NUM", "TEXT"]).optional(),
        required: z.boolean().optional(),
        help_text: z.string().optional(),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (input.label) {
        updates.push(`label = $${idx++}`);
        params.push(input.label);
      }
      if (input.field_type) {
        updates.push(`field_type = $${idx++}`);
        params.push(input.field_type);
      }
      if (input.required !== undefined) {
        updates.push(`required = $${idx++}`);
        params.push(input.required);
      }
      if (input.help_text !== undefined) {
        updates.push(`help_text = $${idx++}`);
        params.push(input.help_text);
      }
      if (input.sort_order !== undefined) {
        updates.push(`sort_order = $${idx++}`);
        params.push(input.sort_order);
      }

      if (updates.length === 0) return null;

      params.push(input.id);
      await pgQuery(`UPDATE checklist_items SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const items = await pgQuery<any>("SELECT * FROM checklist_items WHERE id = $1", [input.id]);
      return items[0] || null;
    }),

  deleteChecklistItem: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await pgQuery("DELETE FROM checklist_items WHERE id = $1", [input.id]);
      return { success: true };
    }),

  // ============ SEED ============
  seedPostgres: protectedProcedure
    .input(
      z.object({
        forceReset: z.boolean().default(false),
        assetsPerSite: z.number().min(1).max(50).default(10),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[ADMIN] seedPostgres called", input);

      await ensurePgSchema();

      const pool = getPgPool();
      const client = await pool.connect();

      const counts: SeedCounts = {
        users: 0,
        sites: 0,
        zones: 0,
        assets: 0,
        controlTypes: 0,
        assetControls: 0,
        missions: 0,
        missionAssets: 0,
        reports: 0,
        reportItemResults: 0,
        nonconformities: 0,
        correctiveActions: 0,
        maintenanceLogs: 0,
      };

      try {
        await client.query("BEGIN");

        if (input.forceReset) {
          console.log("[ADMIN] forceReset enabled -> clearing tables");
          for (const t of TABLES_DELETE_ORDER) {
            await client.query(`DELETE FROM ${t};`);
          }
        } else {
          const existingUsers = await client.query<{ c: string }>(
            "SELECT COUNT(*)::text as c FROM users;"
          );
          const c = Number(existingUsers.rows[0]?.c ?? "0");
          if (c > 0) {
            console.log("[ADMIN] Users already exist, skipping seed. Use forceReset=true to reseed.");
            await client.query("ROLLBACK");
            return {
              ok: true as const,
              skipped: true as const,
              reason: "Database already seeded (users > 0).",
              counts,
            };
          }
        }

        const now = isoNow();

        const users = [
          { id: generateId(), email: "technicien@inspectra.fr", name: "Jean Dupont", role: "TECHNICIAN", token_mock: "mock_token_tech" },
          { id: generateId(), email: "hse@inspectra.fr", name: "Marie Martin", role: "HSE_MANAGER", token_mock: "mock_token_hse" },
          { id: generateId(), email: "admin@inspectra.fr", name: "Admin Système", role: "ADMIN", token_mock: "mock_token_admin" },
          { id: generateId(), email: "auditeur@inspectra.fr", name: "Pierre Auditeur", role: "AUDITOR", token_mock: "mock_token_auditor" },
        ] as const;

        for (const u of users) {
          await client.query(
            `INSERT INTO users (id, email, name, role, token_mock, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
            [u.id, u.email, u.name, u.role, u.token_mock, now]
          );
          counts.users++;
        }

        const clientId = generateId();
        await client.query(
          "INSERT INTO clients (id, name, created_at) VALUES ($1, $2, $3)",
          [clientId, "Client Principal", now]
        );

        const controlTypes = [
          { id: generateId(), code: "VGP_PERIODIQUE", label: "VGP Périodique", description: "Vérification Générale Périodique annuelle", periodicity_days: 365, active: true },
          { id: generateId(), code: "VGP_RENFORCE", label: "VGP Renforcée", description: "VGP semestrielle pour équipements à usage intensif", periodicity_days: 180, active: true },
        ] as const;

        for (const ct of controlTypes) {
          await client.query(
            `INSERT INTO control_types (id, code, label, description, periodicity_days, active) VALUES ($1, $2, $3, $4, $5, $6)`,
            [ct.id, ct.code, ct.label, ct.description, ct.periodicity_days, ct.active]
          );
          counts.controlTypes++;
        }

        const sites = [
          { id: generateId(), name: "Carrefour Logistique Lyon", address: "123 Rue de l'Industrie, 69000 Lyon", zones: ["Zone A - Production", "Zone B - Stockage"] },
          { id: generateId(), name: "Amazon Fulfilment Satolas", address: "45 Zone Industrielle Est, 69125 Lyon-Saint-Exupéry", zones: ["Réception", "Expédition", "Picking"] },
          { id: generateId(), name: "Michelin Clermont-Ferrand", address: "12 Place des Carmes, 63000 Clermont-Ferrand", zones: ["Atelier Nord", "Atelier Sud", "Magasin"] },
        ] as const;

        const zoneIdsBySite: Record<string, string[]> = {};

        for (const s of sites) {
          await client.query(
            `INSERT INTO sites (id, client_id, name, address, created_at) VALUES ($1, $2, $3, $4, $5)`,
            [s.id, clientId, s.name, s.address, now]
          );
          counts.sites++;

          zoneIdsBySite[s.id] = [];
          for (const zn of s.zones) {
            const zid = generateId();
            await client.query(`INSERT INTO zones (id, site_id, name) VALUES ($1, $2, $3)`, [zid, s.id, zn]);
            zoneIdsBySite[s.id].push(zid);
            counts.zones++;
          }
        }

        const assetTemplates = [
          { prefix: "CHE", designation: "Chariot élévateur", categorie: "Chariot élévateur", marque: "Toyota", modele: "8FBE15" },
          { prefix: "NAC", designation: "Nacelle élévatrice", categorie: "Nacelle", marque: "JLG", modele: "450AJ" },
          { prefix: "PON", designation: "Pont roulant", categorie: "Pont roulant", marque: "Demag", modele: "EKDR 5" },
        ] as const;

        const assetsBySite: Record<string, string[]> = {};

        for (const s of sites) {
          assetsBySite[s.id] = [];
          const zoneIds = zoneIdsBySite[s.id];

          for (let i = 0; i < input.assetsPerSite; i++) {
            const t = assetTemplates[i % assetTemplates.length];
            const assetId = generateId();
            const code = `${t.prefix}-${String(i + 1).padStart(3, "0")}`;
            const zoneId = zoneIds[i % zoneIds.length];

            await client.query(
              `INSERT INTO assets (id, code_interne, designation, categorie, marque, modele, numero_serie, annee, statut, criticite, site_id, zone_id, mise_en_service, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
              [assetId, code, `${t.designation} ${t.marque} ${t.modele}`, t.categorie, t.marque, t.modele, `${t.prefix}${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`, 2019 + (i % 6), "EN_SERVICE", 1 + (i % 5), s.id, zoneId, now, now]
            );
            counts.assets++;
            assetsBySite[s.id].push(assetId);

            const acId = generateId();
            await client.query(
              `INSERT INTO asset_controls (id, asset_id, control_type_id, start_date, last_done_at, next_due_at) VALUES ($1, $2, $3, $4, $5, $6)`,
              [acId, assetId, controlTypes[0].id, now, now, now]
            );
            counts.assetControls++;
          }
        }

        const missionId = generateId();
        const chosenSite = sites[0];
        await client.query(
          `INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [missionId, controlTypes[0].id, now, users[0].id, "TERMINEE", chosenSite.id, now]
        );
        counts.missions++;

        const chosenAssetIds = assetsBySite[chosenSite.id].slice(0, Math.min(3, assetsBySite[chosenSite.id].length));

        for (const assetId of chosenAssetIds) {
          const maId = generateId();
          await client.query(`INSERT INTO mission_assets (id, mission_id, asset_id) VALUES ($1,$2,$3)`, [maId, missionId, assetId]);
          counts.missionAssets++;

          const reportId = generateId();
          await client.query(
            `INSERT INTO reports (id, mission_id, asset_id, performed_at, performer, conclusion, summary, signed_by_name, signed_at, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [reportId, missionId, assetId, now, users[0].name, "CONFORME", "Contrôle effectué sans anomalie.", users[0].name, now, now]
          );
          counts.reports++;

          const ncId = generateId();
          await client.query(
            `INSERT INTO nonconformities (id, report_id, asset_id, checklist_item_id, title, description, severity, status, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [ncId, reportId, assetId, null, "Marquage effacé", "Marquages de charge et sécurité illisibles.", 3, "OUVERTE", now]
          );
          counts.nonconformities++;

          const actionId = generateId();
          await client.query(
            `INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status, closed_at, validated_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [actionId, ncId, users[0].id, "Remplacer les autocollants de sécurité.", now, "OUVERTE", null, null]
          );
          counts.correctiveActions++;

          const maintId = generateId();
          await client.query(
            `INSERT INTO maintenance_logs (id, asset_id, date, actor, operation_type, description, parts_ref, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [maintId, assetId, now, users[0].name, "INSPECTION", "Graissage général des points de lubrification", null, now]
          );
          counts.maintenanceLogs++;
        }

        await client.query("COMMIT");
        console.log("[ADMIN] Seed completed", counts);

        return { ok: true as const, skipped: false as const, counts };
      } catch (e) {
        await client.query("ROLLBACK");
        const message = e instanceof Error ? e.message : "Unknown error";
        console.error("[ADMIN] Seed failed", message);
        throw new Error(message);
      } finally {
        client.release();
      }
    }),
});
