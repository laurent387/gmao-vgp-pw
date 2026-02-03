import { FastifyInstance } from 'fastify';
import { Client } from 'pg';

export async function checklistsRoutes(fastify: FastifyInstance, db: Client) {
  // GET all checklists (optionally filtered by operation_type)
  fastify.get('/operation-checklists', async (request, reply) => {
    const { operation_type } = request.query as any;
    
    let query = 'SELECT * FROM operation_checklists';
    const params: any[] = [];
    
    if (operation_type) {
      query += ' WHERE operation_type = $1';
      params.push(operation_type);
    }
    
    query += ' ORDER BY operation_type, name';
    
    const result = await db.query(query, params);
    return { data: result.rows };
  });

  // GET single checklist
  fastify.get('/operation-checklists/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    const result = await db.query(
      'SELECT * FROM operation_checklists WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Checklist not found' });
    }
    
    return { data: result.rows[0] };
  });

  // POST create new checklist template
  fastify.post('/operation-checklists', async (request, reply) => {
    const { operation_type, name, description, steps } = request.body as any;
    
    if (!operation_type || !name || !steps) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }
    
    try {
      const result = await db.query(
        `INSERT INTO operation_checklists (operation_type, name, description, steps, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [operation_type, name, description || null, JSON.stringify(steps)]
      );
      
      return reply.code(201).send({ data: result.rows[0] });
    } catch (err: any) {
      if (err.code === '23505') { // unique violation
        return reply.code(409).send({ error: 'Checklist with this name already exists for this operation type' });
      }
      throw err;
    }
  });

  // PUT update checklist template
  fastify.put('/operation-checklists/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { name, description, steps } = request.body as any;
    
    const result = await db.query(
      `UPDATE operation_checklists 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           steps = COALESCE($3, steps),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name || null, description || null, steps ? JSON.stringify(steps) : null, id]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Checklist not found' });
    }
    
    return { data: result.rows[0] };
  });

  // DELETE checklist template
  fastify.delete('/operation-checklists/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    const result = await db.query(
      'DELETE FROM operation_checklists WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Checklist not found' });
    }
    
    return reply.code(204).send();
  });

  // GET mission operation assets with checklists
  fastify.get('/missions/:missionId/operation-assets', async (request, reply) => {
    const { missionId } = request.params as any;
    
    const result = await db.query(
      `SELECT 
        moa.id,
        moa.mission_id,
        moa.operation_type,
        moa.asset_id,
        moa.work_description,
        moa.checklist_template_id,
        moa.checklist_data,
        a.code_interne,
        a.designation,
        a.categorie,
        oc.name as checklist_name,
        oc.steps as checklist_template_steps
      FROM mission_operation_assets moa
      LEFT JOIN assets a ON a.id = moa.asset_id
      LEFT JOIN operation_checklists oc ON oc.id = moa.checklist_template_id
      WHERE moa.mission_id = $1
      ORDER BY moa.operation_type, a.code_interne`,
      [missionId]
    );
    
    return { data: result.rows };
  });

  // PUT update mission operation asset (descriptif, checklist)
  fastify.put('/missions/:missionId/operation-assets/:id', async (request, reply) => {
    const { missionId, id } = request.params as any;
    const { work_description, checklist_template_id, checklist_data } = request.body as any;
    
    const result = await db.query(
      `UPDATE mission_operation_assets
       SET work_description = COALESCE($1, work_description),
           checklist_template_id = COALESCE($2, checklist_template_id),
           checklist_data = COALESCE($3, checklist_data),
           updated_at = NOW()
       WHERE id = $4 AND mission_id = $5
       RETURNING *`,
      [
        work_description || null,
        checklist_template_id || null,
        checklist_data ? JSON.stringify(checklist_data) : null,
        id,
        missionId
      ]
    );
    
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Mission operation asset not found' });
    }
    
    return { data: result.rows[0] };
  });

  // POST create mission operation asset (when assigning equipment to operation)
  fastify.post('/missions/:missionId/operation-assets', async (request, reply) => {
    const { missionId } = request.params as any;
    const { operation_type, asset_id, work_description, checklist_template_id } = request.body as any;
    
    if (!operation_type || !asset_id) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }
    
    try {
      // Get template checklist if specified
      let checklistData: any[] = [];
      if (checklist_template_id) {
        const templateResult = await db.query(
          'SELECT steps FROM operation_checklists WHERE id = $1',
          [checklist_template_id]
        );
        if (templateResult.rows.length > 0) {
          const steps = templateResult.rows[0].steps;
          checklistData = Array.isArray(steps) ? steps.map((s: any) => ({
            step: s.step,
            order: s.order,
            checked: false,
            checked_at: null,
            checked_by: null
          })) : [];
        }
      }
      
      const result = await db.query(
        `INSERT INTO mission_operation_assets 
         (mission_id, operation_type, asset_id, work_description, checklist_template_id, checklist_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (mission_id, operation_type, asset_id) 
         DO UPDATE SET 
           work_description = EXCLUDED.work_description,
           checklist_template_id = EXCLUDED.checklist_template_id,
           checklist_data = EXCLUDED.checklist_data,
           updated_at = NOW()
         RETURNING *`,
        [missionId, operation_type, asset_id, work_description || null, checklist_template_id || null, JSON.stringify(checklistData)]
      );
      
      return reply.code(201).send({ data: result.rows[0] });
    } catch (err: any) {
      console.error('Error creating mission operation asset:', err);
      return reply.code(500).send({ error: err.message });
    }
  });
}
