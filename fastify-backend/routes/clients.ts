import { FastifyInstance } from 'fastify';
import { Client as PgClient } from 'pg';

export async function clientsRoutes(fastify: FastifyInstance, db: PgClient) {
  // Liste des clients
  fastify.get('/clients', async (request, reply) => {
    const res = await db.query('SELECT * FROM clients ORDER BY name ASC');
    return res.rows;
  });

  // Détail d'un client
  fastify.get('/clients/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  // Création d'un client
  fastify.post('/clients', async (request, reply) => {
    const client = request.body as any;
    const keys = Object.keys(client);
    const values = Object.values(client);
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO clients (${columns}) VALUES (${params}) RETURNING *`;
    const res = await db.query(sql, values);
    return res.rows[0];
  });

  // Modification d'un client
  fastify.put('/clients/:id', async (request, reply) => {
    const { id } = request.params as any;
    const client = request.body as any;
    const keys = Object.keys(client);
    const values = Object.values(client);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE clients SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  // Suppression d'un client
  fastify.delete('/clients/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });
}
