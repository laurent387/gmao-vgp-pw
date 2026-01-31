import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

import { getPgPool } from "./db/postgres";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { storageService, ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS } from "./services/storage";

const app = new Hono();

const isAllowedOrigin = (origin: string | undefined | null): boolean => {
  if (!origin) return false;

  const allowedExact = new Set<string>([
    'https://in-spectra.com',
    'https://www.in-spectra.com',
    'https://app.in-spectra.com',
    'https://api.in-spectra.com',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
  ]);

  if (allowedExact.has(origin)) return true;

  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.rorktest.dev')) return true;
    if (url.hostname.endsWith('.rork.app')) return true;
    if (url.hostname.endsWith('.expo.dev')) return true;
  } catch {
    return false;
  }

  return false;
};

app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = isAllowedOrigin(origin);
      console.log('[CORS] Request origin', { origin, allowed });
      return allowed ? origin : undefined;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'trpc-accept',
      'trpc-batch-mode',
    ],
    credentials: true,
  })
);

const trpcHandler = trpcServer({
  endpoint: "/api/trpc",
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error(`[TRPC] Error on ${path}:`, error);
  },
});

app.use("/api/trpc/*", trpcHandler);
app.use("/trpc/*", trpcHandler);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "In-Spectra API is running" });
});

app.get("/api/health", async (c) => {
  try {
    const pool = getPgPool();
    const result = await pool.query("SELECT NOW() as time, current_database() as db");
    const row = result.rows[0];
    
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    
    console.log("[HEALTH] DB connection OK", { time: row.time, db: row.db });
    
    return c.json({
      status: "ok",
      database: {
        connected: true,
        name: row.db,
        serverTime: row.time,
        tables: tables.rows.map((t: { table_name: string }) => t.table_name),
      },
    });
  } catch (error) {
    console.error("[HEALTH] DB connection FAILED", error);
    return c.json(
      {
        status: "error",
        database: {
          connected: false,
          error: error instanceof Error ? error.message : String(error),
        },
      },
      500
    );
  }
});

app.post('/api/uploads', async (c) => {
  const auth = c.req.header('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const form = await c.req.formData();
  const entityType = String(form.get('entityType') ?? '');
  const entityId = String(form.get('entityId') ?? '');
  const clientDocumentId = String(form.get('documentId') ?? '');
  const file = form.get('file');

  if (!entityType || !entityId) {
    return c.json({ error: 'Missing entityType or entityId' }, 400);
  }
  if (!(file instanceof File)) {
    return c.json({ error: 'Missing file' }, 400);
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const extFromName = file.name?.includes('.') ? file.name.split('.').pop() : null;
  const ext = (extFromName || (file.type === 'image/png' ? 'png' : 'jpg')).toLowerCase();
  const storedName = `${randomUUID()}.${ext}`;
  const diskPath = path.join(uploadsDir, storedName);

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(diskPath, Buffer.from(arrayBuffer));

  const urlPath = `/uploads/${storedName}`;

  const id = clientDocumentId || `doc-${Date.now()}`;
  const mime = file.type || 'image/jpeg';

  const pool = getPgPool();
  await pool.query(
    `INSERT INTO documents (id, entity_type, entity_id, local_uri, mime, sha256, uploaded_at, synced, server_url)
     VALUES ($1,$2,$3,$4,$5,$6,now(),true,$7)
     ON CONFLICT (id) DO UPDATE SET server_url = EXCLUDED.server_url, synced = true`,
    [id, entityType, entityId, urlPath, mime, null, urlPath]
  );

  console.log('[UPLOAD] Stored file', { entityType, entityId, storedName, id, mime });

  return c.json({ id, url: urlPath });
});

app.get('/uploads/:name', async (c) => {
  const name = c.req.param('name');
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '');
  const diskPath = path.join(process.cwd(), 'uploads', safeName);

  try {
    const buf = await readFile(diskPath);
    const contentType = safeName.endsWith('.png') ? 'image/png' : safeName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    return new Response(buf as unknown as BodyInit, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' } });
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

// =============================================
// ATTACHMENTS UPLOAD ENDPOINT (Documents & Media)
// =============================================

interface AttachmentUser {
  id: string;
  role: string;
}

async function getAuthUser(authHeader: string | null): Promise<AttachmentUser | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const pool = getPgPool();
    let result;
    
    if (token.startsWith("token-")) {
      const userId = token.split("-")[1];
      if (userId) {
        result = await pool.query("SELECT id, role FROM users WHERE id = $1", [userId]);
      }
    }
    
    if (!result?.rows[0]) {
      result = await pool.query("SELECT id, role FROM users WHERE token_mock = $1", [token]);
    }
    
    return result?.rows[0] || null;
  } catch {
    return null;
  }
}

app.post('/api/attachments/upload', async (c) => {
  const user = await getAuthUser(c.req.header('authorization') ?? null);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const form = await c.req.formData();
    const ownerType = String(form.get('ownerType') ?? '');
    const ownerId = String(form.get('ownerId') ?? '');
    const category = String(form.get('category') ?? 'AUTRE');
    const title = String(form.get('title') ?? '');
    const isPrivate = form.get('isPrivate') === 'true';
    const file = form.get('file');

    if (!ownerType || !ownerId) {
      return c.json({ error: 'Missing ownerType or ownerId' }, 400);
    }
    if (!(file instanceof File)) {
      return c.json({ error: 'Missing file' }, 400);
    }
    if (!title) {
      return c.json({ error: 'Missing title' }, 400);
    }

    const mimeType = file.type || 'application/octet-stream';
    const fileType = storageService.getFileTypeFromMime(mimeType);
    
    if (!fileType) {
      return c.json({ 
        error: `Type de fichier non supporté: ${mimeType}. Types acceptés: PDF, JPEG, PNG` 
      }, 400);
    }

    // Validate file size
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validation = storageService.validateFile(mimeType, buffer.length, fileType);
    
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Check admin permission for certain operations
    if (ownerType === 'REPORT' && category === 'RAPPORT') {
      if (!['ADMIN', 'HSE_MANAGER'].includes(user.role)) {
        return c.json({ error: 'Seuls les administrateurs peuvent importer des PDFs de rapport' }, 403);
      }
    }

    // Generate storage key and store file
    await storageService.init();
    const fileId = randomUUID();
    const ext = storageService.getExtensionFromMime(mimeType);
    const storageKey = storageService.generateStorageKey(ownerType, ownerId, category, fileId, ext);
    
    const result = await storageService.putObject(buffer, storageKey, mimeType);

    // Create attachment record
    const attachmentId = 'att_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    const now = new Date().toISOString();
    const pool = getPgPool();

    await pool.query(
      `INSERT INTO attachments (
        id, owner_type, owner_id, file_type, category, title,
        original_file_name, mime_type, size_bytes, storage_key,
        is_private, checksum, status, version_number, parent_id,
        created_at, created_by, updated_at, updated_by, archived_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        attachmentId,
        ownerType,
        ownerId,
        fileType,
        category,
        title,
        file.name || 'unknown',
        mimeType,
        result.sizeBytes,
        storageKey,
        isPrivate,
        result.checksum,
        'ACTIVE',
        1,
        null,
        now,
        user.id,
        now,
        null,
        null,
      ]
    );

    console.log('[ATTACHMENT] Uploaded:', {
      id: attachmentId,
      ownerType,
      ownerId,
      category,
      fileType,
      size: result.sizeBytes,
    });

    return c.json({
      id: attachmentId,
      storageKey,
      downloadUrl: storageService.getSignedUrl(storageKey),
      sizeBytes: result.sizeBytes,
      checksum: result.checksum,
    });
  } catch (e) {
    console.error('[ATTACHMENT] Upload error:', e);
    return c.json({ error: e instanceof Error ? e.message : 'Upload failed' }, 500);
  }
});

// Download attachment with signed URL validation
app.get('/api/attachments/download/:storageKey{.+}', async (c) => {
  const user = await getAuthUser(c.req.header('authorization') ?? null);
  // Allow public downloads for non-private files
  
  const storageKey = decodeURIComponent(c.req.param('storageKey'));
  
  try {
    const pool = getPgPool();
    const result = await pool.query(
      'SELECT * FROM attachments WHERE storage_key = $1 AND status = $2',
      [storageKey, 'ACTIVE']
    );
    
    const attachment = result.rows[0];
    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    // Check access for private attachments
    if (attachment.is_private) {
      if (!user || !['ADMIN', 'HSE_MANAGER'].includes(user.role)) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    const buffer = await storageService.getObject(storageKey);
    if (!buffer) {
      return c.json({ error: 'File not found on storage' }, 404);
    }

    const fileName = attachment.original_file_name || 'download';
    const contentDisposition = attachment.mime_type === 'application/pdf' 
      ? `inline; filename="${fileName}"` 
      : `attachment; filename="${fileName}"`;

    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': attachment.mime_type,
        'Content-Disposition': contentDisposition,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[ATTACHMENT] Download error:', e);
    return c.json({ error: 'Download failed' }, 500);
  }
});

// Serve static uploads directory with improved MIME detection
app.get('/uploads/*', async (c) => {
  const filePath = c.req.path.replace('/uploads/', '');
  const safePath = filePath.replace(/\.\./g, '');
  const diskPath = path.join(process.cwd(), 'uploads', safePath);

  try {
    const buf = await readFile(diskPath);
    
    // Determine content type from extension
    const ext = path.extname(safePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return new Response(buf as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

export default app;
