import { FastifyInstance } from 'fastify';
import { Client as PgClient } from 'pg';

export async function sitesRoutes(fastify: FastifyInstance, db: PgClient) {
  // Liste des sites (avec nom client)
  fastify.get('/sites', async (request, reply) => {
    const { clientId, limit = 100, offset = 0, sortBy = 'name', sortOrder = 'ASC' } = request.query as any;
    let query = `
      SELECT s.*, c.name as client_name
      FROM sites s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;
    if (clientId) {
      query += ` AND s.client_id = $${idx++}`;
      params.push(clientId);
    }
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);
    const res = await db.query(query, params);
    return res.rows;
  });

  // Détail d'un site
  fastify.get('/sites/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query(
      `SELECT s.*, c.name as client_name
       FROM sites s
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE s.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  // Création d'un site
  fastify.post('/sites', async (request, reply) => {
    const site = request.body as any;
    const keys = Object.keys(site);
    const values = Object.values(site);
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO sites (${columns}) VALUES (${params}) RETURNING *`;
    const res = await db.query(sql, values);
    return res.rows[0];
  });

  // Modification d'un site
  fastify.put('/sites/:id', async (request, reply) => {
    const { id } = request.params as any;
    const site = request.body as any;
    const keys = Object.keys(site);
    const values = Object.values(site);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE sites SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  // Suppression d'un site
  fastify.delete('/sites/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM sites WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });
}
