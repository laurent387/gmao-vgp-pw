import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { AssetSchema, AssetUpdateSchema } from '../schemas.js';

export async function assetsRoutes(fastify: FastifyInstance, db: Client) {
  // Liste des catégories d'assets
  fastify.get('/assets/categories', async () => {
    const res = await db.query('SELECT DISTINCT categorie FROM assets ORDER BY categorie');
    return res.rows.map((r) => r.categorie);
  });

  // List assets (pagination, tri)
  fastify.get('/assets', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['code_interne', 'designation', 'marque', 'modele', 'categorie', 'statut', 'created_at', 'criticite'], default: 'code_interne' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' },
          clientId: { type: 'string' },
          siteId: { type: 'string' },
          zoneId: { type: 'string' },
          categorie: { type: 'string' },
          statut: { type: 'string' },
          search: { type: 'string' },
        },
        additionalProperties: false
      },
    },
  }, async (request, reply) => {
    const { limit, offset, sortBy, sortOrder, clientId, siteId, zoneId, categorie, statut, search } = request.query as any;

    const sortColumnMap: Record<string, string> = {
      code_interne: 'a.code_interne',
      designation: 'a.designation',
      marque: 'a.marque',
      modele: 'a.modele',
      categorie: 'a.categorie',
      statut: 'a.statut',
      created_at: 'a.created_at',
      criticite: 'a.criticite',
    };
    const safeSort = sortColumnMap[sortBy] || 'a.code_interne';
    const safeOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    let query = `
      SELECT a.*
      FROM assets a
      LEFT JOIN sites s ON a.site_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (clientId) {
      query += ` AND s.client_id = $${paramIndex++}`;
      params.push(clientId);
    }
    if (siteId) {
      query += ` AND a.site_id = $${paramIndex++}`;
      params.push(siteId);
    }
    if (zoneId) {
      query += ` AND a.zone_id = $${paramIndex++}`;
      params.push(zoneId);
    }
    if (categorie) {
      query += ` AND a.categorie = $${paramIndex++}`;
      params.push(categorie);
    }
    if (statut) {
      query += ` AND a.statut = $${paramIndex++}`;
      params.push(statut);
    }
    if (search) {
      query += ` AND (
        a.code_interne ILIKE $${paramIndex} OR
        a.designation ILIKE $${paramIndex} OR
        a.marque ILIKE $${paramIndex} OR
        a.modele ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${safeSort} ${safeOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const res = await db.query(query, params);
    return res.rows;
  });

  // Get asset by id
  fastify.get('/assets/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('SELECT * FROM assets WHERE id = $1', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  // Create asset
  fastify.post('/assets', { schema: { body: AssetSchema } }, async (request, reply) => {
    const asset = request.body as any;
    const keys = Object.keys(asset);
    const values = Object.values(asset);
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO assets (${columns}) VALUES (${params}) RETURNING *`;
    const res = await db.query(sql, values);
    return res.rows[0];
  });

  // Update asset (partial update supported)
  fastify.put('/assets/:id', { schema: { body: AssetUpdateSchema } }, async (request, reply) => {
    const { id } = request.params as any;
    const asset = request.body as any;
    
    // Filter out undefined/null values
    const keys = Object.keys(asset).filter(k => asset[k] !== undefined && asset[k] !== null);
    if (keys.length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }
    
    const values = keys.map(k => asset[k]);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE assets SET ${set}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`;
    
    try {
      const res = await db.query(sql, [...values, id]);
      if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
      return res.rows[0];
    } catch (e: any) {
      console.error('Error updating asset:', e);
      // Try without updated_at if column doesn't exist
      const sqlFallback = `UPDATE assets SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
      const res = await db.query(sqlFallback, [...values, id]);
      if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
      return res.rows[0];
    }
  });

  // Delete asset
  fastify.delete('/assets/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return { deleted: true };
  });

  // Import assets (JSON)
  fastify.post('/assets/import', async (request, reply) => {
    const assets = request.body as any[];
    // TODO: Insert assets in DB (bulk insert)
    return { imported: assets.length };
  });

  // Export assets (JSON)
  fastify.get('/assets/export', async (request, reply) => {
    const res = await db.query('SELECT * FROM assets');
    return res.rows;
  });
}
