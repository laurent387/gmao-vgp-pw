import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { MissionSchema } from '../schemas.js';

export async function missionsRoutes(fastify: FastifyInstance, db: Client) {
  fastify.get('/missions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          sortBy: { type: 'string', enum: ['scheduled_at', 'status', 'created_at'], default: 'scheduled_at' },
          sortOrder: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
          siteId: { type: 'string' },
          status: { type: 'string' },
          assignedTo: { type: 'string' },
        },
        additionalProperties: false
      },
    },
  }, async (request, reply) => {
    const { limit, offset, sortBy, sortOrder, siteId, status, assignedTo } = request.query as any;

    const sortColumnMap: Record<string, string> = {
      scheduled_at: 'm.scheduled_at',
      status: 'm.status',
      created_at: 'm.created_at',
    };
    const safeSort = sortColumnMap[sortBy] || 'm.scheduled_at';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    let query = `SELECT m.* FROM missions m WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (siteId) {
      query += ` AND m.site_id = $${paramIndex++}`;
      params.push(siteId);
    }
    if (status) {
      query += ` AND m.status = $${paramIndex++}`;
      params.push(status);
    }
    if (assignedTo) {
      query += ` AND m.assigned_to = $${paramIndex++}`;
      params.push(assignedTo);
    }

    query += ` ORDER BY ${safeSort} ${safeOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const res = await db.query(query, params);
    return res.rows;
  });

  fastify.get('/missions/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    // Get mission with site and client info
    const missionRes = await db.query(`
      SELECT m.*, s.name as site_name, c.name as client_name
      FROM missions m
      LEFT JOIN sites s ON m.site_id = s.id
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE m.id = $1
    `, [id]);
    if (missionRes.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    
    const mission = missionRes.rows[0];
    
    // Get assigned technicians
    const techRes = await db.query(`
      SELECT u.id, u.name, u.email, u.role
      FROM mission_technicians mt
      JOIN users u ON mt.technician_id = u.id
      WHERE mt.mission_id = $1
      ORDER BY mt.assigned_at ASC
    `, [id]);
    
    // Get operations
    const opsRes = await db.query(`
      SELECT id, operation_type, sort_order
      FROM mission_operations
      WHERE mission_id = $1
      ORDER BY sort_order ASC
    `, [id]);
    
    // Get assets
    const assetsRes = await db.query(`
      SELECT a.id, a.code_interne, a.designation, a.categorie, a.criticite, a.statut,
             s.name as site_name, z.name as zone_name
      FROM mission_assets ma
      JOIN assets a ON ma.asset_id = a.id
      LEFT JOIN sites s ON a.site_id = s.id
      LEFT JOIN zones z ON a.zone_id = z.id
      WHERE ma.mission_id = $1
      ORDER BY a.code_interne ASC
    `, [id]);
    
    return {
      ...mission,
      technicians: techRes.rows,
      operations: opsRes.rows,
      assets: assetsRes.rows,
    };
  });

  fastify.post('/missions', async (request, reply) => {
    const body = request.body as any;
    const { asset_ids, technician_ids, operation_types, operation_assets, ...missionData } = body;
    
    // Generate ID if not provided
    const id = missionData.id || `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Insert mission
    const missionSql = `
      INSERT INTO missions (id, control_type_id, scheduled_at, assigned_to, status, site_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const missionRes = await db.query(missionSql, [
      id,
      missionData.control_type_id || null,
      missionData.scheduled_at,
      missionData.assigned_to,
      missionData.status || 'PLANIFIEE',
      missionData.site_id,
      now
    ]);
    
    // Insert mission_assets (backward compat)
    if (asset_ids && Array.isArray(asset_ids)) {
      for (const assetId of asset_ids) {
        await db.query(
          'INSERT INTO mission_assets (id, mission_id, asset_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [`ma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, id, assetId]
        );
      }
    }
    
    // Insert mission_technicians
    if (technician_ids && Array.isArray(technician_ids)) {
      for (const techId of technician_ids) {
        await db.query(
          'INSERT INTO mission_technicians (id, mission_id, technician_id, assigned_at) VALUES ($1, $2, $3, $4)',
          [`mt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, id, techId, now]
        );
      }
    }
    
    // Insert mission_operations
    if (operation_types && Array.isArray(operation_types)) {
      for (let i = 0; i < operation_types.length; i++) {
        await db.query(
          'INSERT INTO mission_operations (id, mission_id, operation_type, sort_order, created_at) VALUES ($1, $2, $3, $4, $5)',
          [`mo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, id, operation_types[i], i, now]
        );
      }
    }
    
    // Insert mission_operation_assets (nouvelle structure hiérarchique)
    // Format attendu: operation_assets = { MAINTENANCE: ['asset1', 'asset2'], INSPECTION: ['asset3'] }
    if (operation_assets && typeof operation_assets === 'object') {
      // Get default checklist for each operation type
      const operationTypesArray = Object.keys(operation_assets);
      if (operationTypesArray.length > 0) {
        const checklistsRes = await db.query(
          `SELECT DISTINCT ON (operation_type) id, operation_type 
           FROM operation_checklists 
           WHERE operation_type = ANY($1) 
           ORDER BY operation_type, created_at`,
          [operationTypesArray]
        );
        const checklistMap: Record<string, number> = {};
        checklistsRes.rows.forEach((row: any) => {
          checklistMap[row.operation_type] = row.id;
        });
        
        for (const [operationType, assetIds] of Object.entries(operation_assets)) {
          if (Array.isArray(assetIds)) {
            for (const assetId of assetIds) {
              const checklistId = checklistMap[operationType] || null;
              
              // Si on a un template, créer une instance de checklist
              let checklistData: any[] = [];
              if (checklistId) {
                const templateRes = await db.query(
                  'SELECT steps FROM operation_checklists WHERE id = $1',
                  [checklistId]
                );
                if (templateRes.rows.length > 0) {
                  const steps = templateRes.rows[0].steps;
                  checklistData = Array.isArray(steps) ? steps.map((s: any) => ({
                    step: s.step,
                    order: s.order,
                    checked: false,
                    checked_at: null,
                    checked_by: null
                  })) : [];
                }
              }
              
              await db.query(
                `INSERT INTO mission_operation_assets 
                 (mission_id, operation_type, asset_id, checklist_template_id, checklist_data)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (mission_id, operation_type, asset_id) DO NOTHING`,
                [id, operationType, assetId, checklistId, JSON.stringify(checklistData)]
              );
            }
          }
        }
      }
    }
    
    return { ...missionRes.rows[0], asset_ids, technician_ids, operation_types };
  });

  fastify.put('/missions/:id', { schema: { body: MissionSchema } }, async (request, reply) => {
    const { id } = request.params as any;
    const mission = request.body as any;
    const keys = Object.keys(mission);
    const values = Object.values(mission);
    const set = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
    const sql = `UPDATE missions SET ${set} WHERE id = $${keys.length + 1} RETURNING *`;
    const res = await db.query(sql, [...values, id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return res.rows[0];
  });

  fastify.delete('/missions/:id', async (request, reply) => {
    const { id } = request.params as any;
    const res = await db.query('DELETE FROM missions WHERE id = $1 RETURNING *', [id]);
    if (res.rows.length === 0) return reply.code(404).send({ error: 'Not found' });
    return { deleted: true };
  });

  fastify.post('/missions/import', async (request, reply) => {
    const missions = request.body as any[];
    // TODO: Insert missions in DB (bulk insert)
    return { imported: missions.length };
  });

  fastify.get('/missions/export', async (request, reply) => {
    const res = await db.query('SELECT * FROM missions');
    return res.rows;
  });
}
