import { FastifyInstance } from 'fastify';
import { Client as PgClient } from 'pg';

export async function zonesRoutes(fastify: FastifyInstance, db: PgClient) {
  // Liste des zones (avec nom site)
  fastify.get('/zones', async (request, reply) => {
    const { siteId, limit = 100, offset = 0, sortBy = 'name', sortOrder = 'ASC' } = request.query as any;
    let query = `
      SELECT z.*, s.name as site_name
      FROM zones z
      LEFT JOIN sites s ON z.site_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;
    if (siteId) {
      query += ` AND z.site_id = $${idx++}`;
      params.push(siteId);
    }
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    const res = await db.query(query, params);
    return res.rows;
  });

  // Détail d'une zone
  fastify.get('/zones/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query(
      `SELECT z.*, s.name as site_name
       FROM zones z
       LEFT JOIN sites s ON z.site_id = s.id
       WHERE z.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  // Création d'une zone
  fastify.post('/zones', async (request, reply) => {
    const zone = request.body as any;
    const keys = Object.keys(zone);
    const values = Object.values(zone);
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO zones (${columns}) VALUES (${params}) RETURNING *`;
    const res = await db.query(sql, values);
    return res.rows[0];
  });

  // Modification d'une zone
  fastify.put('/zones/:id', async (request, reply) => {
    const { id } = request.params as any;
    const zone = request.body as any;
    const keys = Object.keys(zone);
    const values = Object.values(zone);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE zones SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  // Suppression d'une zone
  fastify.delete('/zones/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM zones WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });
}
