import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, adminProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";
import { sendEmail } from "../../services/email";
import { generateTempPassword, hashPassword } from "../../services/password";

function generateId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function isoNow(): string {
  return new Date().toISOString();
}


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
        sendPasswordEmail: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = generateId();
      const now = isoNow();
      const token = `token_${generateId()}`;
      const tempPassword = generateTempPassword();
      const passwordHash = hashPassword(tempPassword);

      await pgQuery(
        `INSERT INTO users (id, email, name, role, token_mock, password_hash, must_change_password, password_updated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, NULL, $7)`,
        [id, input.email, input.name, input.role, token, passwordHash, now]
      );

      let emailSent = false;
      if (input.sendPasswordEmail !== false) {
        try {
          await sendEmail({
            to: input.email,
            subject: "Votre compte In‑Spectra",
            text: `Bonjour ${input.name},\n\nVotre compte In‑Spectra est créé.\nMot de passe temporaire : ${tempPassword}\n\nMerci de changer ce mot de passe dès votre première connexion.`,
          });
          emailSent = true;
        } catch (error: any) {
          console.error("[ADMIN] Failed to send password email:", error?.message || error);
        }
      }

      return { id, email: input.email, name: input.name, role: input.role, created_at: now, emailSent };
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

  sendTestEmail: adminProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1).optional(),
        text: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await sendEmail({
          to: input.to,
          subject: input.subject || "Test email In‑Spectra",
          text: input.text || "Email de test envoyé depuis In‑Spectra.",
        });

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Email send failed",
        });
      }
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
});
