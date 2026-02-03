import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import fastifyMultipart from '@fastify/multipart';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Ensure uploads directory exists
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/home/deploy/rork-in-spectra-asset---control/uploads';

export async function attachmentsRoutes(fastify: FastifyInstance, db: Client) {
  // Register multipart plugin
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  });

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // POST /attachments/upload - Upload file with multipart form
  fastify.post('/attachments/upload', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      // Get form fields
      const fields: Record<string, string> = {};
      for await (const part of Object.values(data.fields)) {
        if (part && typeof part === 'object' && 'fieldname' in part && 'value' in part) {
          fields[(part as any).fieldname] = String((part as any).value);
        }
      }

      const ownerType = fields.ownerType || 'UNKNOWN';
      const ownerId = fields.ownerId || '';
      const category = fields.category || 'AUTRE';
      const title = fields.title || data.filename;
      const isPrivate = fields.isPrivate === 'true';

      // Generate unique filename
      const fileExt = path.extname(data.filename);
      const storageKey = `${randomUUID()}${fileExt}`;
      const filePath = path.join(UPLOADS_DIR, storageKey);

      // Save file to disk
      const buffer = await data.toBuffer();
      fs.writeFileSync(filePath, buffer);

      const sizeBytes = buffer.length;
      const mimeType = data.mimetype;
      const fileType = mimeType.startsWith('image/') ? 'IMAGE' : 'PDF';

      // Save to database
      const id = `att_${randomUUID()}`;

      await db.query(
        `INSERT INTO attachments (id, owner_type, owner_id, category, title, file_type, mime_type, original_file_name, size_bytes, storage_key, is_private, status, version_number, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE', 1, NOW(), NOW())`,
        [id, ownerType, ownerId, category, title, fileType, mimeType, data.filename, sizeBytes, storageKey, isPrivate]
      );

      const downloadUrl = `/uploads/${storageKey}`;
      console.log('[Attachments] Uploaded:', { id, storageKey, sizeBytes, ownerType, ownerId });

      return {
        id,
        storageKey,
        downloadUrl,
        sizeBytes,
      };
    } catch (e) {
      console.error('[Attachments] Upload error:', e);
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });

  // GET /attachments - List attachments with optional filters
  fastify.get('/attachments', async (request, reply) => {
    const { ownerType, ownerId, limit = 50, offset = 0 } = request.query as any;
    
    let query = 'SELECT * FROM attachments';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (ownerType) {
      params.push(ownerType);
      conditions.push(`owner_type = $${params.length}`);
    }
    
    if (ownerId) {
      params.push(ownerId);
      conditions.push(`owner_id = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    try {
      const res = await db.query(query, params);
      return res.rows;
    } catch (e) {
      console.error('Error fetching attachments:', e);
      return [];
    }
  });

  // GET /attachments/:id
  fastify.get('/attachments/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('SELECT * FROM attachments WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return res.rows[0];
  });

  // POST /attachments - Create new attachment
  fastify.post('/attachments', async (request, reply) => {
    const { owner_type, owner_id, filename, url, mime_type, size } = request.body as any;
    
    const id = `att_${Date.now()}`;
    const res = await db.query(
      `INSERT INTO attachments (id, owner_type, owner_id, filename, url, mime_type, size, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [id, owner_type, owner_id, filename, url, mime_type, size]
    );
    
    return res.rows[0];
  });

  // DELETE /attachments/:id
  fastify.delete('/attachments/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM attachments WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return { deleted: true };
  });
}
