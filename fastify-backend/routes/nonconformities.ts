import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { NonConformitySchema, NonConformityCreateSchema, NonConformityUpdateSchema } from '../schemas.js';
import { randomUUID } from 'crypto';

export async function nonconformitiesRoutes(fastify: FastifyInstance, db: Client) {
  fastify.get('/nonconformities', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['created_at', 'severity', 'status'], default: 'created_at' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
          assetId: { type: 'string' },
          status: { type: 'string', enum: ['OUVERTE', 'EN_COURS', 'CLOTUREE'] },
          severity: { type: 'integer', minimum: 1, maximum: 5 },
        },
        additionalProperties: false
      },
    },
  }, async (request, reply) => {
    const { limit, offset, sortBy, sortOrder, assetId, status, severity } = request.query as any;
    let query = `SELECT * FROM nonconformities WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    if (assetId) {
      query += ` AND asset_id = $${paramIndex++}`;
      params.push(assetId);
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(severity);
    }
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    const res = await db.query(query, params);
    return res.rows;
  });

  fastify.get('/nonconformities/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('SELECT * FROM nonconformities WHERE id = $1', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });

    const actionRes = await db.query(
      'SELECT * FROM corrective_actions WHERE nonconformity_id = $1 ORDER BY due_at ASC LIMIT 1',
      [id]
    );

    const nc = res.rows[0];
    const corrective_action = actionRes.rows[0] || null;

    return { ...nc, corrective_action };
  });

  fastify.post('/nonconformities', { schema: { body: NonConformityCreateSchema } }, async (request, reply) => {
    const nc = request.body as any;
    
    // Auto-generate required fields
    const id = `nc_${randomUUID()}`;
    const status = 'OUVERTE';
    const created_at = new Date().toISOString();
    
    const fullNC = {
      id,
      status,
      created_at,
      ...nc, // asset_id, title, description, severity, report_id, checklist_item_id
    };
    
    const keys = Object.keys(fullNC);
    const values = Object.values(fullNC);
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO nonconformities (${columns}) VALUES (${params}) RETURNING *`;
    const res = await db.query(sql, values);
    return res.rows[0];
  });

  fastify.put('/nonconformities/:id', { schema: { body: NonConformityUpdateSchema } }, async (request, reply) => {
    const { id } = request.params as any;
    const nc = request.body as any;
    
    // Validation métier
    if (nc.severity !== undefined && (nc.severity < 1 || nc.severity > 5)) {
      return reply.code(400).send({ error: 'Severity must be between 1 and 5' });
    }
    if (nc.status !== undefined && !['OUVERTE', 'EN_COURS', 'CLOTUREE'].includes(nc.status)) {
      return reply.code(400).send({ error: 'Invalid status' });
    }
    
    // Filter out undefined values
    const updates: Record<string, any> = {};
    if (nc.title !== undefined) updates.title = nc.title;
    if (nc.description !== undefined) updates.description = nc.description;
    if (nc.severity !== undefined) updates.severity = nc.severity;
    if (nc.status !== undefined) updates.status = nc.status;
    
    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }
    
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE nonconformities SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  fastify.delete('/nonconformities/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM nonconformities WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return { deleted: true };
  });

  fastify.post('/nonconformities/import', async (request, reply) => {
    const ncs = request.body as any[];
    // TODO: Insert ncs in DB (bulk insert)
    return { imported: ncs.length };
  });

  fastify.get('/nonconformities/export', async (request, reply) => {
    const res = await db.query('SELECT * FROM nonconformities');
    return res.rows;
  });
}
