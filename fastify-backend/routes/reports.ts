import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { ReportSchema } from '../schemas.js';

export async function reportsRoutes(fastify: FastifyInstance, db: Client) {
  fastify.get('/reports', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['performed_at', 'conclusion', 'created_at'], default: 'performed_at' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
          missionId: { type: 'string' },
          assetId: { type: 'string' },
          conclusion: { type: 'string', enum: ['CONFORME', 'NON_CONFORME', 'CONFORME_SOUS_RESERVE'] },
          search: { type: 'string' },
        },
        additionalProperties: false
      },
    },
  }, async (request, reply) => {
    const { limit, offset, sortBy, sortOrder, missionId, assetId, conclusion, search } = request.query as any;
    let query = `SELECT r.*, a.code_interne as asset_code, a.designation as asset_designation, s.name as site_name, ct.label as control_type_label
      FROM reports r
      LEFT JOIN assets a ON r.asset_id = a.id
      LEFT JOIN sites s ON a.site_id = s.id
      LEFT JOIN missions m ON r.mission_id = m.id
      LEFT JOIN control_types ct ON m.control_type_id = ct.id
      WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    if (missionId) {
      query += ` AND r.mission_id = $${paramIndex++}`;
      params.push(missionId);
    }
    if (assetId) {
      query += ` AND r.asset_id = $${paramIndex++}`;
      params.push(assetId);
    }
    if (conclusion) {
      query += ` AND r.conclusion = $${paramIndex++}`;
      params.push(conclusion);
    }
    if (search) {
      query += ` AND (a.code_interne ILIKE $${paramIndex} OR a.designation ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    query += ` ORDER BY r.${sortBy} ${sortOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    const res = await db.query(query, params);
    return res.rows;
  });

  fastify.get('/reports/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('SELECT * FROM reports WHERE id = $1', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  fastify.post('/reports', { schema: { body: ReportSchema } }, async (request, reply) => {
    const report = request.body as any;
    const keys = Object.keys(report);
    const values = Object.values(report);
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO reports (${columns}) VALUES (${params}) RETURNING *`;
    const res = await db.query(sql, values);
    return res.rows[0];
  });

  fastify.put('/reports/:id', { schema: { body: ReportSchema } }, async (request, reply) => {
    const { id } = request.params as any;
    const report = request.body as any;
    const keys = Object.keys(report);
    const values = Object.values(report);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE reports SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  fastify.delete('/reports/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return { deleted: true };
  });

  fastify.post('/reports/import', async (request, reply) => {
    const reports = request.body as any[];
    // TODO: Insert reports in DB (bulk insert)
    return { imported: reports.length };
  });

  fastify.get('/reports/export', async (request, reply) => {
    const res = await db.query('SELECT * FROM reports');
    return res.rows;
  });
}
