import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  mutationProcedure,
} from "../create-context";
import { pgQuery } from "../../db/postgres";
import { storageService } from "../../services/storage";

interface DbAttachment {
  id: string;
  owner_type: string;
  owner_id: string;
  file_type: string;
  category: string;
  title: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  is_private: boolean;
  checksum: string | null;
  status: string;
  version_number: number;
  parent_id: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
  archived_at: string | null;
  uploader_name?: string;
}

function generateId(): string {
  return "att_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function isoNow(): string {
  return new Date().toISOString();
}

const ownerTypeSchema = z.enum(["EQUIPMENT", "REPORT", "VGP_REPORT", "VGP_RUN"]);
const categorySchema = z.enum([
  "DOCUMENTATION",
  "CERTIFICAT_LEGAL",
  "RAPPORT",
  "PLAQUE_IDENTIFICATION",
  "PHOTO",
  "AUTRE",
]);
const fileTypeSchema = z.enum(["PDF", "IMAGE"]);

export const attachmentsRouter = createTRPCRouter({
  /**
   * List attachments for an owner
   */
  list: publicProcedure
    .input(
      z.object({
        ownerType: ownerTypeSchema,
        ownerId: z.string(),
        category: categorySchema.optional(),
        includeArchived: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        console.log("[ATTACHMENTS] Listing attachments:", input);

        let query = `
          SELECT a.*, u.name as uploader_name
          FROM attachments a
          LEFT JOIN users u ON a.created_by = u.id
          WHERE a.owner_type = $1 AND a.owner_id = $2
        `;
        const params: any[] = [input.ownerType, input.ownerId];
        let paramIndex = 3;

        if (input.category) {
          query += ` AND a.category = $${paramIndex++}`;
          params.push(input.category);
        }

        if (!input.includeArchived) {
          query += ` AND a.status = 'ACTIVE'`;
        }

        // Filter private attachments for non-admin users
        const userRole = (ctx as any)?.user?.role;
        if (userRole && !["ADMIN", "HSE_MANAGER"].includes(userRole)) {
          query += ` AND a.is_private = FALSE`;
        }

        query += " ORDER BY a.category, a.created_at DESC";

        const attachments = await pgQuery<DbAttachment>(query, params);
        console.log("[ATTACHMENTS] Found:", attachments.length);

        return attachments.map((a) => ({
          ...a,
          download_url: storageService.getSignedUrl(a.storage_key),
        }));
      } catch (error) {
        console.error("[ATTACHMENTS] Error in list query:", error);
        throw error;
      }
    }),

  /**
   * Get a single attachment by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const attachments = await pgQuery<DbAttachment>(
        `SELECT a.*, u.name as uploader_name
         FROM attachments a
         LEFT JOIN users u ON a.created_by = u.id
         WHERE a.id = $1`,
        [input.id]
      );

      const a = attachments[0];
      if (!a) return null;

      // Check access for private attachments
      const userRole = (ctx as any)?.user?.role;
      if (a.is_private && userRole && !["ADMIN", "HSE_MANAGER"].includes(userRole)) {
        return null;
      }

      return {
        ...a,
        download_url: storageService.getSignedUrl(a.storage_key),
      };
    }),

  /**
   * Create attachment metadata (file upload is handled separately via REST)
   */
  create: protectedProcedure
    .input(
      z.object({
        ownerType: ownerTypeSchema,
        ownerId: z.string(),
        fileType: fileTypeSchema,
        category: categorySchema,
        title: z.string().min(1, "Titre requis"),
        originalFileName: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
        storageKey: z.string(),
        checksum: z.string().optional(),
        isPrivate: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any)?.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const id = generateId();
      const now = isoNow();

      await pgQuery(
        `INSERT INTO attachments (
          id, owner_type, owner_id, file_type, category, title,
          original_file_name, mime_type, size_bytes, storage_key,
          is_private, checksum, status, version_number, parent_id,
          created_at, created_by, updated_at, updated_by, archived_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          id,
          input.ownerType,
          input.ownerId,
          input.fileType,
          input.category,
          input.title,
          input.originalFileName,
          input.mimeType,
          input.sizeBytes,
          input.storageKey,
          input.isPrivate,
          input.checksum || null,
          "ACTIVE",
          1,
          null,
          now,
          userId,
          now,
          null,
          null,
        ]
      );

      console.log("[ATTACHMENTS] Created:", {
        id,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        title: input.title,
      });

      return { id, storageKey: input.storageKey };
    }),

  /**
   * Update attachment metadata
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        category: categorySchema.optional(),
        isPrivate: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any)?.user?.id;
      const userRole = (ctx as any)?.user?.role;

      // Check if user can edit (admin only for now)
      if (!["ADMIN", "HSE_MANAGER"].includes(userRole)) {
        throw new Error("Permission denied");
      }

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (input.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        params.push(input.title);
      }
      if (input.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        params.push(input.category);
      }
      if (input.isPrivate !== undefined) {
        updates.push(`is_private = $${paramIndex++}`);
        params.push(input.isPrivate);
      }

      if (updates.length === 0) {
        throw new Error("No updates provided");
      }

      updates.push(`updated_at = $${paramIndex++}`);
      params.push(isoNow());
      updates.push(`updated_by = $${paramIndex++}`);
      params.push(userId);

      params.push(input.id);

      await pgQuery(
        `UPDATE attachments SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
        params
      );

      console.log("[ATTACHMENTS] Updated:", input.id);

      return { success: true };
    }),

  /**
   * Replace an attachment with a new version
   */
  replace: adminProcedure
    .input(
      z.object({
        id: z.string(),
        originalFileName: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
        storageKey: z.string(),
        checksum: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any)?.user?.id;

      // Get current attachment
      const current = await pgQuery<DbAttachment>(
        "SELECT * FROM attachments WHERE id = $1",
        [input.id]
      );

      if (!current[0]) throw new Error("Attachment not found");

      const old = current[0];
      const now = isoNow();

      // Archive the old version
      await pgQuery(
        `UPDATE attachments SET status = 'ARCHIVED', archived_at = $1, updated_by = $2 WHERE id = $3`,
        [now, userId, old.id]
      );

      // Create new version
      const newId = generateId();
      const newVersion = old.version_number + 1;

      await pgQuery(
        `INSERT INTO attachments (
          id, owner_type, owner_id, file_type, category, title,
          original_file_name, mime_type, size_bytes, storage_key,
          is_private, checksum, status, version_number, parent_id,
          created_at, created_by, updated_at, updated_by, archived_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          newId,
          old.owner_type,
          old.owner_id,
          old.file_type,
          old.category,
          old.title,
          input.originalFileName,
          input.mimeType,
          input.sizeBytes,
          input.storageKey,
          old.is_private,
          input.checksum || null,
          "ACTIVE",
          newVersion,
          old.parent_id || old.id,
          now,
          userId,
          now,
          null,
          null,
        ]
      );

      console.log("[ATTACHMENTS] Replaced:", {
        oldId: old.id,
        newId,
        version: newVersion,
      });

      return { id: newId, version: newVersion };
    }),

  /**
   * Delete an attachment (soft delete)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string(), permanent: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx as any)?.user?.id;

      // Get attachment info for storage cleanup
      const attachments = await pgQuery<DbAttachment>(
        "SELECT * FROM attachments WHERE id = $1",
        [input.id]
      );

      if (!attachments[0]) throw new Error("Attachment not found");

      const attachment = attachments[0];

      if (input.permanent) {
        // Permanent delete: remove from DB and storage
        await pgQuery("DELETE FROM attachments WHERE id = $1", [input.id]);
        await storageService.deleteObject(attachment.storage_key);
        console.log("[ATTACHMENTS] Permanently deleted:", input.id);
      } else {
        // Soft delete: mark as archived
        await pgQuery(
          `UPDATE attachments SET status = 'ARCHIVED', archived_at = $1, updated_by = $2 WHERE id = $3`,
          [isoNow(), userId, input.id]
        );
        console.log("[ATTACHMENTS] Soft deleted:", input.id);
      }

      return { success: true };
    }),

  /**
   * Get version history for an attachment
   */
  getHistory: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Get the parent ID or use current ID
      const current = await pgQuery<DbAttachment>(
        "SELECT parent_id, id FROM attachments WHERE id = $1",
        [input.id]
      );

      if (!current[0]) return [];

      const parentId = current[0].parent_id || current[0].id;

      const history = await pgQuery<DbAttachment>(
        `SELECT a.*, u.name as uploader_name
         FROM attachments a
         LEFT JOIN users u ON a.created_by = u.id
         WHERE a.id = $1 OR a.parent_id = $1
         ORDER BY a.version_number DESC`,
        [parentId]
      );

      return history;
    }),

  /**
   * Count attachments for an owner
   */
  count: publicProcedure
    .input(
      z.object({
        ownerType: ownerTypeSchema,
        ownerId: z.string(),
        category: categorySchema.optional(),
      })
    )
    .query(async ({ input }) => {
      let query = `
        SELECT COUNT(*)::int as count
        FROM attachments
        WHERE owner_type = $1 AND owner_id = $2 AND status = 'ACTIVE'
      `;
      const params: any[] = [input.ownerType, input.ownerId];

      if (input.category) {
        query += ` AND category = $3`;
        params.push(input.category);
      }

      const result = await pgQuery<{ count: number }>(query, params);
      return result[0]?.count ?? 0;
    }),

  /**
   * Check if equipment has plate photo
   */
  hasPlatePhoto: publicProcedure
    .input(z.object({ assetId: z.string() }))
    .query(async ({ input }) => {
      const result = await pgQuery<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM attachments 
         WHERE owner_type = 'EQUIPMENT' AND owner_id = $1 
         AND category = 'PLAQUE_IDENTIFICATION' AND status = 'ACTIVE'`,
        [input.assetId]
      );
      return (result[0]?.count ?? 0) > 0;
    }),

  /**
   * Get report PDF attachment
   */
  getReportPdf: publicProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ input }) => {
      const attachments = await pgQuery<DbAttachment>(
        `SELECT a.*, u.name as uploader_name
         FROM attachments a
         LEFT JOIN users u ON a.created_by = u.id
         WHERE a.owner_type = 'REPORT' AND a.owner_id = $1 
         AND a.category = 'RAPPORT' AND a.file_type = 'PDF' AND a.status = 'ACTIVE'
         ORDER BY a.created_at DESC
         LIMIT 1`,
        [input.reportId]
      );

      if (!attachments[0]) return null;

      return {
        ...attachments[0],
        download_url: storageService.getSignedUrl(attachments[0].storage_key),
      };
    }),
});
