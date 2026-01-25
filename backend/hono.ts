import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { randomUUID } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

import { getPgPool } from "./db/postgres";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

const trpcHandler = trpcServer({
  endpoint: "/api/trpc",
  router: appRouter,
  createContext,
});

app.use("/api/trpc/*", trpcHandler);
app.use("/trpc/*", trpcHandler);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "In-Spectra API is running" });
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
    const contentType = safeName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return new Response(buf as unknown as BodyInit, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' } });
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

export default app;
