import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { UserSchema } from '../schemas.js';

export async function usersRoutes(fastify: FastifyInstance, db: Client) {
  fastify.get('/users', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['name', 'email', 'created_at'], default: 'name' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' },
        },
        additionalProperties: false
      },
    },
  }, async (request, reply) => {
    const { limit, offset, sortBy, sortOrder } = request.query as any;
    const res = await db.query(
      `SELECT * FROM users ORDER BY ${sortBy} ${sortOrder} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  });

  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  fastify.post('/users', { schema: { body: UserSchema } }, async (request, reply) => {
    const user = request.body as any;
    const keys = Object.keys(user);
    const values = Object.values(user);
    const columns = keys.map((k) => `"${k}"`).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO users (${columns}) VALUES (${params}) RETURNING *`;
    const res = await db.query(sql, values);
    return res.rows[0];
  });

  fastify.put('/users/:id', { schema: { body: UserSchema } }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.body as any;
    const keys = Object.keys(user);
    const values = Object.values(user);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE users SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return { deleted: true };
  });

  fastify.post('/users/import', async (request, reply) => {
    const users = request.body as any[];
    // TODO: Insert users in DB (bulk insert)
    return { imported: users.length };
  });

  fastify.get('/users/export', async (request, reply) => {
    const res = await db.query('SELECT * FROM users');
    return res.rows;
  });

  // GET /users/responsible - Get users who can be assigned as responsible for actions
  fastify.get('/users/responsible', async (request, reply) => {
    const res = await db.query(
      `SELECT id, name, email, role FROM users 
       WHERE can_be_responsible = true 
       AND role NOT IN ('CLIENT', 'AUDITOR')
       ORDER BY name ASC`
    );
    return res.rows;
  });

  // GET /users/technicians - Get all technicians
  fastify.get('/users/technicians', async (request, reply) => {
    const res = await db.query(
      `SELECT id, name, email, role FROM users 
       WHERE role IN ('TECHNICIAN', 'HSE_MANAGER', 'ADMIN')
       ORDER BY name ASC`
    );
    return res.rows;
  });

  // PATCH /users/:id/can-be-responsible - Toggle can_be_responsible flag (admin only)
  fastify.patch('/users/:id/can-be-responsible', async (request, reply) => {
    const { id } = request.params as any;
    const { canBeResponsible } = request.body as { canBeResponsible: boolean };
    
    // Check that user is not a client
    const userCheck = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }
    if (userCheck.rows[0].role === 'CLIENT') {
      return reply.code(400).send({ error: 'Clients cannot be responsible' });
    }
    
    const res = await db.query(
      'UPDATE users SET can_be_responsible = $1 WHERE id = $2 RETURNING id, name, email, role, can_be_responsible',
      [canBeResponsible, id]
    );
    return res.rows[0];
  });
}
