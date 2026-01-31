import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomBytes } from "crypto";

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

// Helper to unwrap input that may be wrapped or arrive as undefined with z.any()
// Priority: ctx.rawJson.json > ctx.rawJson > input
function unwrapInput<T>(input: any, ctx?: any): T {
  const rawJson = (ctx as any)?.rawJson;

  // superjson envelope: { json: { ... }, meta: {...} }
  if (rawJson?.json) {
    return rawJson.json;
  }

  // Direct JSON object in rawJson
  if (rawJson && typeof rawJson === 'object' && Object.keys(rawJson).length > 0) {
    return rawJson;
  }

  // Already parsed by tRPC
  if (input && typeof input === 'object' && Object.keys(input).length > 0) {
    return input;
  }

  // Try to parse input from URL for GET queries
  try {
    const url = (ctx as any)?.req?.url;
    if (url) {
      const searchParams = new URL(url).searchParams;
      const inputParam = searchParams.get('input');
      if (inputParam) {
        const decoded = JSON.parse(inputParam);
        if (decoded?.json) return decoded.json;
        if (decoded && typeof decoded === 'object') return decoded;
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback to empty object
  return {} as T;
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
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ email: string; name: string; role: string; sendPasswordEmail?: boolean }>(input, ctx);
      
      if (!data?.email || !data?.name || !data?.role) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email, nom et rôle requis" });
      }

      const id = generateId();
      const now = isoNow();
      const token = `token_${generateId()}`;
      const tempPassword = generateTempPassword();
      const passwordHash = hashPassword(tempPassword);

      await pgQuery(
        `INSERT INTO users (id, email, name, role, token_mock, password_hash, must_change_password, password_updated_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, NULL, $7)`,
        [id, data.email, data.name, data.role, token, passwordHash, now]
      );

      let emailSent = false;
      if (data.sendPasswordEmail !== false) {
        try {
          await sendEmail({
            to: data.email,
            subject: "Votre compte In‑Spectra",
            text: `Bonjour ${data.name},\n\nVotre compte In‑Spectra est créé.\nMot de passe temporaire : ${tempPassword}\n\nMerci de changer ce mot de passe dès votre première connexion.`,
          });
          emailSent = true;
        } catch (error: any) {
          console.error("[ADMIN] Failed to send password email:", error?.message || error);
        }
      }

      return { id, email: data.email, name: data.name, role: data.role, created_at: now, emailSent };
    }),

  updateUser: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string; email?: string; name?: string; role?: string }>(input, ctx);
      
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID utilisateur requis" });
      }

      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (data.email) {
        updates.push(`email = $${idx++}`);
        params.push(data.email);
      }
      if (data.name) {
        updates.push(`name = $${idx++}`);
        params.push(data.name);
      }
      if (data.role) {
        updates.push(`role = $${idx++}`);
        params.push(data.role);
      }

      if (updates.length === 0) return null;

      params.push(data.id);
      await pgQuery(`UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const users = await pgQuery<any>("SELECT * FROM users WHERE id = $1", [data.id]);
      return users[0] || null;
    }),

  deleteUser: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID utilisateur requis" });
      }
      await pgQuery("DELETE FROM users WHERE id = $1", [data.id]);
      return { success: true };
    }),

  sendPasswordResetToUser: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ userId: string }>(input, ctx);
      if (!data.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID utilisateur requis" });
      }

      // Get user info
      const users = await pgQuery<{ id: string; email: string; name: string }>(
        "SELECT id, email, name FROM users WHERE id = $1",
        [data.userId]
      );
      const user = users[0];
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur non trouvé" });
      }

      // Generate secure token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await pgQuery(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()`,
        [user.id, token, expiresAt]
      );

      // Generate reset link
      const frontendUrl = process.env.FRONTEND_URL || "https://app.in-spectra.com";
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;

      // Send email with reset link
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe - In-Spectra",
        text: `Bonjour ${user.name},\n\nUn administrateur a demandé la réinitialisation de votre mot de passe.\n\nCliquez sur le lien suivant pour définir un nouveau mot de passe :\n${resetLink}\n\nCe lien expire dans 1 heure.\n\nCordialement,\nL'équipe In-Spectra`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Réinitialisation de mot de passe</h2>
            <p>Bonjour <strong>${user.name}</strong>,</p>
            <p>Un administrateur a demandé la réinitialisation de votre mot de passe.</p>
            <p style="margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">L'équipe In-Spectra</p>
          </div>
        `,
      });

      console.log("[ADMIN] Password reset link sent to:", user.email);
      return { success: true };
    }),

  sendTestEmail: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ to: string; subject?: string; text?: string }>(input, ctx);
      if (!data.to) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email destinataire requis" });
      }
      try {
        await sendEmail({
          to: data.to,
          subject: data.subject || "Test email In‑Spectra",
          text: data.text || "Email de test envoyé depuis In‑Spectra.",
        });

        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error?.message || "Email send failed",
        });
      }
    }),

  // ============ CLIENTS ============
  listClients: adminProcedure.query(async () => {
    const clients = await pgQuery<any>(
      `SELECT id, name, siret, tva_number, contact_name, contact_email, contact_phone, 
              address, access_instructions, billing_address, billing_email, internal_notes, 
              status, created_at 
       FROM clients ORDER BY name`
    );
    return clients;
  }),

  getClient: protectedProcedure
    .input(z.any())
    .query(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data?.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID client requis" });
      }
      const clients = await pgQuery<any>(
        `SELECT id, name, siret, tva_number, contact_name, contact_email, contact_phone, 
                address, access_instructions, billing_address, billing_email, internal_notes, 
                status, created_at 
         FROM clients WHERE id = $1`,
        [data.id]
      );
      return clients[0] || null;
    }),

  getClientStats: protectedProcedure
    .input(z.any())
    .query(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data?.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID client requis" });
      }
      // Get site count
      const siteCountResult = await pgQuery<{ count: string }>(
        "SELECT COUNT(*) as count FROM sites WHERE client_id = $1",
        [data.id]
      );
      const site_count = parseInt(siteCountResult[0]?.count || '0', 10);

      // Get asset count (assets in sites belonging to this client)
      const assetCountResult = await pgQuery<{ count: string }>(
        `SELECT COUNT(*) as count FROM assets a 
         JOIN sites s ON a.site_id = s.id 
         WHERE s.client_id = $1`,
        [data.id]
      );
      const asset_count = parseInt(assetCountResult[0]?.count || '0', 10);

      // Get last report date
      const lastReportResult = await pgQuery<{ performed_at: string }>(
        `SELECT r.performed_at FROM reports r
         JOIN assets a ON r.asset_id = a.id
         JOIN sites s ON a.site_id = s.id
         WHERE s.client_id = $1
         ORDER BY r.performed_at DESC LIMIT 1`,
        [data.id]
      );
      const last_report_date = lastReportResult[0]?.performed_at || null;

      // Get next due date from asset_controls
      const nextDueResult = await pgQuery<{ next_due_at: string }>(
        `SELECT ac.next_due_at FROM asset_controls ac
         JOIN assets a ON ac.asset_id = a.id
         JOIN sites s ON a.site_id = s.id
         WHERE s.client_id = $1 AND ac.next_due_at IS NOT NULL
         ORDER BY ac.next_due_at ASC LIMIT 1`,
        [data.id]
      );
      const next_due_date = nextDueResult[0]?.next_due_at || null;

      return { site_count, asset_count, last_report_date, next_due_date };
    }),

  createClient: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ name: string }>(input, ctx);
      if (!data.name) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nom du client requis" });
      }
      const id = generateId();
      const now = isoNow();
      await pgQuery(
        "INSERT INTO clients (id, name, status, created_at) VALUES ($1, $2, 'ACTIVE', $3)",
        [id, data.name, now]
      );
      return { id, name: data.name, status: 'ACTIVE', created_at: now };
    }),

  updateClient: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string; name: string }>(input, ctx);
      if (!data.id || !data.name) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID et nom requis" });
      }
      await pgQuery("UPDATE clients SET name = $1 WHERE id = $2", [data.name, data.id]);
      const clients = await pgQuery<any>(
        `SELECT id, name, siret, tva_number, contact_name, contact_email, contact_phone, 
                address, access_instructions, billing_address, billing_email, internal_notes, 
                status, created_at 
         FROM clients WHERE id = $1`,
        [data.id]
      );
      return clients[0] || null;
    }),

  updateClientFull: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{
        id: string;
        name?: string;
        siret?: string | null;
        tva_number?: string | null;
        contact_name?: string | null;
        contact_email?: string | null;
        contact_phone?: string | null;
        address?: string | null;
        access_instructions?: string | null;
        billing_address?: string | null;
        billing_email?: string | null;
        internal_notes?: string | null;
        status?: string;
      }>(input, ctx);

      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID client requis" });
      }

      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      const fields = [
        'name', 'siret', 'tva_number', 'contact_name', 'contact_email', 'contact_phone',
        'address', 'access_instructions', 'billing_address', 'billing_email', 'internal_notes', 'status'
      ];

      for (const field of fields) {
        if ((data as any)[field] !== undefined) {
          updates.push(`${field} = $${idx++}`);
          params.push((data as any)[field]);
        }
      }

      if (updates.length === 0) return null;

      params.push(data.id);
      await pgQuery(`UPDATE clients SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const clients = await pgQuery<any>(
        `SELECT id, name, siret, tva_number, contact_name, contact_email, contact_phone, 
                address, access_instructions, billing_address, billing_email, internal_notes, 
                status, created_at 
         FROM clients WHERE id = $1`,
        [data.id]
      );
      return clients[0] || null;
    }),

  deleteClient: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID client requis" });
      }
      await pgQuery("DELETE FROM clients WHERE id = $1", [data.id]);
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
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ name: string; address?: string; client_id?: string }>(input, ctx);
      if (!data.name) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nom du site requis" });
      }
      const id = generateId();
      const now = isoNow();

      let clientId = data.client_id;
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
        [id, clientId, data.name, data.address || null, now]
      );

      return { id, name: data.name, address: data.address || null, client_id: clientId, created_at: now };
    }),

  updateSite: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string; name?: string; address?: string; client_id?: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID site requis" });
      }
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (data.name) {
        updates.push(`name = $${idx++}`);
        params.push(data.name);
      }
      if (data.address !== undefined) {
        updates.push(`address = $${idx++}`);
        params.push(data.address);
      }
      if (data.client_id !== undefined) {
        updates.push(`client_id = $${idx++}`);
        params.push(data.client_id);
      }

      if (updates.length === 0) return null;

      params.push(data.id);
      await pgQuery(`UPDATE sites SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const sites = await pgQuery<any>("SELECT * FROM sites WHERE id = $1", [data.id]);
      return sites[0] || null;
    }),

  deleteSite: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID site requis" });
      }
      await pgQuery("DELETE FROM zones WHERE site_id = $1", [data.id]);
      await pgQuery("DELETE FROM sites WHERE id = $1", [data.id]);
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
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ site_id: string; name: string }>(input, ctx);
      if (!data.site_id || !data.name) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID site et nom requis" });
      }
      const id = generateId();

      await pgQuery(
        "INSERT INTO zones (id, site_id, name) VALUES ($1, $2, $3)",
        [id, data.site_id, data.name]
      );

      return { id, site_id: data.site_id, name: data.name };
    }),

  updateZone: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string; name?: string; site_id?: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID zone requis" });
      }
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (data.name) {
        updates.push(`name = $${idx++}`);
        params.push(data.name);
      }
      if (data.site_id) {
        updates.push(`site_id = $${idx++}`);
        params.push(data.site_id);
      }

      if (updates.length === 0) return null;

      params.push(data.id);
      await pgQuery(`UPDATE zones SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const zones = await pgQuery<any>("SELECT * FROM zones WHERE id = $1", [data.id]);
      return zones[0] || null;
    }),

  deleteZone: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID zone requis" });
      }
      await pgQuery("DELETE FROM zones WHERE id = $1", [data.id]);
      return { success: true };
    }),

  // ============ CONTROL TYPES ============
  listControlTypes: protectedProcedure.query(async () => {
    return pgQuery<any>("SELECT * FROM control_types ORDER BY label");
  }),

  createControlType: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ code: string; label: string; description?: string; periodicity_days: number }>(input, ctx);
      if (!data.code || !data.label || !data.periodicity_days) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Code, label et périodicité requis" });
      }
      const id = generateId();

      await pgQuery(
        `INSERT INTO control_types (id, code, label, description, periodicity_days, active)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [id, data.code, data.label, data.description || null, data.periodicity_days]
      );

      return { id, ...data, active: true };
    }),

  updateControlType: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string; code?: string; label?: string; description?: string; periodicity_days?: number; active?: boolean }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID type de contrôle requis" });
      }
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (data.code) {
        updates.push(`code = $${idx++}`);
        params.push(data.code);
      }
      if (data.label) {
        updates.push(`label = $${idx++}`);
        params.push(data.label);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${idx++}`);
        params.push(data.description);
      }
      if (data.periodicity_days) {
        updates.push(`periodicity_days = $${idx++}`);
        params.push(data.periodicity_days);
      }
      if (data.active !== undefined) {
        updates.push(`active = $${idx++}`);
        params.push(data.active);
      }

      if (updates.length === 0) return null;

      params.push(data.id);
      await pgQuery(`UPDATE control_types SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const types = await pgQuery<any>("SELECT * FROM control_types WHERE id = $1", [data.id]);
      return types[0] || null;
    }),

  deleteControlType: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID type de contrôle requis" });
      }
      await pgQuery("UPDATE control_types SET active = false WHERE id = $1", [data.id]);
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
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ control_type_id: string; asset_category?: string; name: string }>(input, ctx);
      if (!data.control_type_id || !data.name) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Type de contrôle et nom requis" });
      }
      const id = generateId();

      await pgQuery(
        `INSERT INTO checklist_templates (id, control_type_id, asset_category, name)
         VALUES ($1, $2, $3, $4)`,
        [id, data.control_type_id, data.asset_category || null, data.name]
      );

      return { id, ...data };
    }),

  deleteChecklistTemplate: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID template requis" });
      }
      await pgQuery("DELETE FROM checklist_items WHERE template_id = $1", [data.id]);
      await pgQuery("DELETE FROM checklist_templates WHERE id = $1", [data.id]);
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
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ template_id: string; label: string; field_type: string; required?: boolean; help_text?: string; sort_order?: number }>(input, ctx);
      if (!data.template_id || !data.label || !data.field_type) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Template, label et type requis" });
      }
      const id = generateId();

      await pgQuery(
        `INSERT INTO checklist_items (id, template_id, label, field_type, required, help_text, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, data.template_id, data.label, data.field_type, data.required !== false, data.help_text || null, data.sort_order || 0]
      );

      return { id, ...data };
    }),

  updateChecklistItem: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string; label?: string; field_type?: string; required?: boolean; help_text?: string; sort_order?: number }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID item requis" });
      }
      const updates: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (data.label) {
        updates.push(`label = $${idx++}`);
        params.push(data.label);
      }
      if (data.field_type) {
        updates.push(`field_type = $${idx++}`);
        params.push(data.field_type);
      }
      if (data.required !== undefined) {
        updates.push(`required = $${idx++}`);
        params.push(data.required);
      }
      if (data.help_text !== undefined) {
        updates.push(`help_text = $${idx++}`);
        params.push(data.help_text);
      }
      if (data.sort_order !== undefined) {
        updates.push(`sort_order = $${idx++}`);
        params.push(data.sort_order);
      }

      if (updates.length === 0) return null;

      params.push(data.id);
      await pgQuery(`UPDATE checklist_items SET ${updates.join(", ")} WHERE id = $${idx}`, params);

      const items = await pgQuery<any>("SELECT * FROM checklist_items WHERE id = $1", [data.id]);
      return items[0] || null;
    }),

  deleteChecklistItem: adminProcedure
    .input(z.any())
    .mutation(async ({ input, ctx }) => {
      const data = unwrapInput<{ id: string }>(input, ctx);
      if (!data.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ID item requis" });
      }
      await pgQuery("DELETE FROM checklist_items WHERE id = $1", [data.id]);
      return { success: true };
    }),
});
