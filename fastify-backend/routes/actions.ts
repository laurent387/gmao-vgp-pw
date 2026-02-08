import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { Type } from '@sinclair/typebox';
import { randomUUID } from 'crypto';

const ActionCreateSchema = Type.Object({
  nonconformity_id: Type.String(),
  owner: Type.String(),
  description: Type.Optional(Type.String()),
  due_at: Type.String(),
  status: Type.Optional(Type.String({ default: 'OUVERTE' })),
});

const ActionUpdateSchema = Type.Object({
  status: Type.Optional(Type.String()),
  owner: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  due_at: Type.Optional(Type.String()),
  closed_at: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  validated_by: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export async function actionsRoutes(fastify: FastifyInstance, db: Client) {
  // GET /actions - List all actions
  fastify.get('/actions', async (request, reply) => {
    const { nonconformity_id, status, assetId, limit = 50, offset = 0 } = request.query as any;
    
    let query = 'SELECT ca.* FROM corrective_actions ca';
    const params: any[] = [];
    let paramIndex = 1;

    if (assetId) {
      query += ' JOIN nonconformities nc ON ca.nonconformity_id = nc.id';
    }
    
    query += ' WHERE 1=1';

    if (nonconformity_id) {
      query += ` AND ca.nonconformity_id = $${paramIndex++}`;
      params.push(nonconformity_id);
    }
    if (status) {
      query += ` AND ca.status = $${paramIndex++}`;
      params.push(status);
    }
    if (assetId) {
      query += ` AND nc.asset_id = $${paramIndex++}`;
      params.push(assetId);
    }
    
    query += ` ORDER BY ca.due_at ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const res = await db.query(query, params);
    return res.rows;
  });

  // GET /actions/:id
  fastify.get('/actions/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('SELECT * FROM corrective_actions WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return res.rows[0];
  });

  // POST /actions - Create action
  fastify.post('/actions', { schema: { body: ActionCreateSchema } }, async (request, reply) => {
    const action = request.body as any;
    const id = `action_${randomUUID()}`;
    const status = action.status || 'OUVERTE';
    
    const sql = `
      INSERT INTO corrective_actions (id, nonconformity_id, owner, description, due_at, status, closed_at, validated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const res = await db.query(sql, [
      id,
      action.nonconformity_id,
      action.owner,
      action.description || null,
      action.due_at,
      status,
      null,
      null
    ]);
    
    return res.rows[0];
  });

  // PUT /actions/:id - Update action
  fastify.put('/actions/:id', { schema: { body: ActionUpdateSchema } }, async (request, reply) => {
    const { id } = request.params as any;
    const updates = request.body as any;
    
    // Build dynamic update query
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(updates.status);
      
      // Auto-set closed_at when closing
      if (updates.status === 'CLOTUREE' || updates.status === 'VALIDEE') {
        setClauses.push(`closed_at = $${paramIndex++}`);
        params.push(new Date().toISOString());
      }
    }
    if (updates.owner !== undefined) {
      setClauses.push(`owner = $${paramIndex++}`);
      params.push(updates.owner);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      params.push(updates.description);
    }
    if (updates.due_at !== undefined) {
      setClauses.push(`due_at = $${paramIndex++}`);
      params.push(updates.due_at);
    }
    if (updates.closed_at !== undefined) {
      setClauses.push(`closed_at = $${paramIndex++}`);
      params.push(updates.closed_at);
    }
    if (updates.validated_by !== undefined) {
      setClauses.push(`validated_by = $${paramIndex++}`);
      params.push(updates.validated_by);
    }
    
    if (setClauses.length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }
    
    params.push(id);
    const sql = `UPDATE corrective_actions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const res = await db.query(sql, params);
    if (res.rows.length === 0) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return res.rows[0];
  });

  // DELETE /actions/:id
  fastify.delete('/actions/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM corrective_actions WHERE id = $1 RETURNING id', [id]);
    if (res.rows.length === 0) {
      return reply.code(404).send({ error: 'Not found' });
    }
    return { success: true, id };
  });
}
