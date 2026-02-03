import { FastifyInstance } from 'fastify';
import { Client } from 'pg';
import { randomUUID } from 'crypto';

const generateId = () => randomUUID().replace(/-/g, '').slice(0, 12);

export async function vgpRoutes(fastify: FastifyInstance, db: Client) {
  // GET /vgp/templates - List VGP templates
  fastify.get('/vgp/templates', async (request, reply) => {
    const { activeOnly = false } = request.query as any;
    
    try {
      // Check if vgp_templates table exists
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'vgp_templates'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        // Return empty array if table doesn't exist
        return [];
      }
      
      let query = 'SELECT * FROM vgp_templates';
      const params: any[] = [];
      
      if (activeOnly === 'true' || activeOnly === true) {
        query += ' WHERE active = true';
      }
      
      query += ' ORDER BY name ASC';
      
      const res = await db.query(query, params);
      return res.rows;
    } catch (e) {
      console.error('Error fetching VGP templates:', e);
      return [];
    }
  });

  // GET /vgp/templates/:id
  fastify.get('/vgp/templates/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const res = await db.query('SELECT * FROM vgp_templates WHERE id = $1', [id]);
      if (res.rows.length === 0) {
        return reply.code(404).send({ error: 'Not found' });
      }
      return res.rows[0];
    } catch (e) {
      console.error('Error fetching VGP template:', e);
      return reply.code(404).send({ error: 'Not found' });
    }
  });

  // POST /vgp/templates - Create new template
  fastify.post('/vgp/templates', async (request, reply) => {
    const { name, description, checklist_items, active = true } = request.body as any;
    
    try {
      const id = `vgp_tpl_${Date.now()}`;
      const res = await db.query(
        `INSERT INTO vgp_templates (id, name, description, checklist_items, active, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [id, name, description, JSON.stringify(checklist_items || []), active]
      );
      
      return res.rows[0];
    } catch (e) {
      console.error('Error creating VGP template:', e);
      return reply.code(500).send({ error: 'Error creating template' });
    }
  });

  // PUT /vgp/templates/:id
  fastify.put('/vgp/templates/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { name, description, checklist_items, active } = request.body as any;
    
    try {
      const res = await db.query(
        `UPDATE vgp_templates 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             checklist_items = COALESCE($3, checklist_items),
             active = COALESCE($4, active),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [name, description, checklist_items ? JSON.stringify(checklist_items) : null, active, id]
      );
      
      if (res.rows.length === 0) {
        return reply.code(404).send({ error: 'Not found' });
      }
      
      return res.rows[0];
    } catch (e) {
      console.error('Error updating VGP template:', e);
      return reply.code(500).send({ error: 'Error updating template' });
    }
  });

  // GET /vgp/controls - List VGP controls/inspections
  fastify.get('/vgp/controls', async (request, reply) => {
    const { assetId, status, limit = 50, offset = 0 } = request.query as any;
    
    try {
      // Check if vgp_controls table exists
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'vgp_controls'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        return [];
      }
      
      let query = 'SELECT * FROM vgp_controls';
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (assetId) {
        params.push(assetId);
        conditions.push(`asset_id = $${params.length}`);
      }
      
      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const res = await db.query(query, params);
      return res.rows;
    } catch (e) {
      console.error('Error fetching VGP controls:', e);
      return [];
    }
  });

  // GET /vgp/reports - List VGP reports
  fastify.get('/vgp/reports', async (request, reply) => {
    const { assetId, clientId, siteId, status, limit = 50, offset = 0 } = request.query as any;
    
    try {
      let query = `SELECT * FROM vgp_reports`;
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (assetId) {
        params.push(assetId);
        conditions.push(`asset_id = $${params.length}`);
      }
      
      if (clientId) {
        params.push(clientId);
        conditions.push(`client_id = $${params.length}`);
      }
      
      if (siteId) {
        params.push(siteId);
        conditions.push(`site_id = $${params.length}`);
      }
      
      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const res = await db.query(query, params);
      return res.rows;
    } catch (e) {
      console.error('Error fetching VGP reports:', e);
      reply.code(500).send({ error: 'Error fetching reports' });
    }
  });

  // GET /vgp/reports/:id
  fastify.get('/vgp/reports/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      const res = await db.query('SELECT * FROM vgp_reports WHERE id = $1', [id]);
      if (res.rows.length === 0) {
        return reply.code(404).send({ error: 'Report not found' });
      }
      return res.rows[0];
    } catch (e) {
      console.error('Error fetching VGP report:', e);
      reply.code(500).send({ error: 'Error fetching report' });
    }
  });

  // GET /vgp/runs/:id - Get a specific inspection run with sections and items
  fastify.get('/vgp/runs/:id', async (request, reply) => {
    const { id } = request.params as any;
    
    try {
      // Get the run
      const runRes = await db.query('SELECT * FROM vgp_inspection_runs WHERE id = $1', [id]);
      if (runRes.rows.length === 0) {
        return reply.code(404).send({ error: 'Run not found' });
      }
      
      const run = runRes.rows[0];
      
      // Get sections for this template
      const sectionsRes = await db.query(
        `SELECT * FROM vgp_template_sections 
         WHERE template_id = $1 
         ORDER BY sort_order ASC`,
        [run.template_id]
      );
      
      const sections = [];
      for (const section of sectionsRes.rows) {
        // Get items for this section
        const itemsRes = await db.query(
          `SELECT vti.*, vir.result, vir.comment, vir.photos, vir.updated_at as result_updated_at
           FROM vgp_template_items vti
           LEFT JOIN vgp_item_results vir ON vir.item_id = vti.id AND vir.run_id = $1
           WHERE vti.section_id = $2
           ORDER BY vti.sort_order ASC`,
          [run.id, section.id]
        );
        
        sections.push({
          ...section,
          items: itemsRes.rows
        });
      }
      
      // Get observations for this run
      const observationsRes = await db.query(
        `SELECT * FROM vgp_observations 
         WHERE run_id = $1 
         ORDER BY created_at DESC`,
        [run.id]
      );
      
      return {
        ...run,
        sections,
        observations: observationsRes.rows
      };
    } catch (e) {
      console.error('Error fetching VGP run:', e);
      reply.code(500).send({ error: 'Error fetching run' });
    }
  });

  // GET /vgp/observations - List observations
  fastify.get('/vgp/observations', async (request, reply) => {
    const { runId, reportId, severity, limit = 50, offset = 0 } = request.query as any;
    
    try {
      let query = `SELECT * FROM vgp_observations`;
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (runId) {
        params.push(runId);
        conditions.push(`run_id = $${params.length}`);
      }
      
      if (reportId) {
        params.push(reportId);
        conditions.push(`report_id = $${params.length}`);
      }
      
      if (severity) {
        params.push(severity);
        conditions.push(`severity = $${params.length}`);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const res = await db.query(query, params);
      return res.rows;
    } catch (e) {
      console.error('Error fetching VGP observations:', e);
      reply.code(500).send({ error: 'Error fetching observations' });
    }
  });

  // PUT /vgp/runs/:id/header - Update run header
  fastify.put('/vgp/runs/:id/header', async (request, reply) => {
    const { id } = request.params as any;
    const {
      compteurType,
      compteurValeur,
      conditionsIntervention,
      modesFonctionnement,
      moyensDisposition,
      particularites,
    } = request.body as any;

    try {
      const now = new Date().toISOString();
      const updates: string[] = ['updated_at = $1'];
      const params: any[] = [now];
      let idx = 2;

      if (compteurType !== undefined) {
        updates.push(`compteur_type = $${idx++}`);
        params.push(compteurType);
      }
      if (compteurValeur !== undefined) {
        updates.push(`compteur_valeur = $${idx++}`);
        params.push(compteurValeur);
      }
      if (conditionsIntervention !== undefined) {
        updates.push(`conditions_intervention = $${idx++}`);
        params.push(conditionsIntervention);
      }
      if (modesFonctionnement !== undefined) {
        updates.push(`modes_fonctionnement = $${idx++}`);
        params.push(modesFonctionnement);
      }
      if (moyensDisposition !== undefined) {
        updates.push(`moyens_disposition = $${idx++}`);
        params.push(moyensDisposition);
      }
      if (particularites !== undefined) {
        updates.push(`particularites = $${idx++}`);
        params.push(particularites);
      }

      params.push(id);
      await db.query(
        `UPDATE vgp_inspection_runs SET ${updates.join(', ')} WHERE id = $${idx}`,
        params
      );

      return { success: true };
    } catch (e) {
      console.error('Error updating VGP run header:', e);
      reply.code(500).send({ error: 'Error updating run header' });
    }
  });

  // PUT /vgp/runs/:id/items/:itemId/result - Update item result
  fastify.put('/vgp/runs/:id/items/:itemId/result', async (request, reply) => {
    const { id, itemId } = request.params as any;
    const { result, comment } = request.body as any;

    try {
      const now = new Date().toISOString();

      await db.query(
        `INSERT INTO vgp_item_results (id, run_id, item_id, result, comment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (run_id, item_id) DO UPDATE SET result = $4, comment = $5, updated_at = $7`,
        [`vgp_res_${generateId()}`, id, itemId, result, comment || null, now, now]
      );

      const itemRes = await db.query(
        `SELECT i.id, i.numero, i.label, r.asset_id
         FROM vgp_template_items i
         JOIN vgp_template_sections s ON i.section_id = s.id
         JOIN vgp_inspection_runs r ON s.template_id = r.template_id
         WHERE i.id = $1 AND r.id = $2`,
        [itemId, id]
      );

      const item = itemRes.rows[0];
      if (!item) {
        return reply.code(404).send({ error: 'Item introuvable' });
      }

      if (result === 'NON') {
        const existingObs = await db.query(
          `SELECT id FROM vgp_observations WHERE run_id = $1 AND item_id = $2 AND is_auto = true`,
          [id, itemId]
        );

        const description = `Non conformité au point ${item.numero} : ${item.label}`;

        if (existingObs.rows.length > 0) {
          await db.query(
            `UPDATE vgp_observations SET description = $1, statut = 'OUVERTE', updated_at = $2 WHERE id = $3`,
            [description, now, existingObs.rows[0].id]
          );
        } else {
          await db.query(
            `INSERT INTO vgp_observations (id, run_id, asset_id, item_id, item_numero, description, gravite, statut, is_auto, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 3, 'OUVERTE', true, $7, $8)`,
            [`vgp_obs_${generateId()}`, id, item.asset_id, itemId, item.numero, description, now, now]
          );
        }
      } else {
        await db.query(
          `UPDATE vgp_observations SET statut = 'RESOLUE', updated_at = $1 WHERE run_id = $2 AND item_id = $3 AND is_auto = true`,
          [now, id, itemId]
        );
      }

      return { success: true };
    } catch (e) {
      console.error('Error updating VGP item result:', e);
      reply.code(500).send({ error: 'Error updating item result' });
    }
  });

  // PUT /vgp/runs/:id/validate - Validate a run
  fastify.put('/vgp/runs/:id/validate', async (request, reply) => {
    const { id } = request.params as any;
    const { conclusion, signedBy } = request.body as any;

    try {
      const now = new Date().toISOString();

      await db.query(
        `UPDATE vgp_inspection_runs 
         SET conclusion = $1, statut = 'VALIDE', signed_by = $2, signed_at = $3, updated_at = $4
         WHERE id = $5`,
        [conclusion, signedBy || null, now, now, id]
      );

      const runRes = await db.query<{ report_id: string }>(
        `SELECT report_id FROM vgp_inspection_runs WHERE id = $1`,
        [id]
      );

      if (runRes.rows[0]) {
        const totalObs = await db.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM vgp_observations o
           JOIN vgp_inspection_runs r ON o.run_id = r.id
           WHERE r.report_id = $1 AND o.statut = 'OUVERTE'`,
          [runRes.rows[0].report_id]
        );

        await db.query(
          `UPDATE vgp_reports SET has_observations = $1, updated_at = $2 WHERE id = $3`,
          [parseInt(totalObs.rows[0]?.count || '0') > 0, now, runRes.rows[0].report_id]
        );
      }

      return { success: true };
    } catch (e) {
      console.error('Error validating VGP run:', e);
      reply.code(500).send({ error: 'Error validating run' });
    }
  });
}
