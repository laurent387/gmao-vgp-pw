import { FastifyInstance } from 'fastify';
import { Client } from 'pg';

export async function controlsRoutes(fastify: FastifyInstance, db: Client) {
  // GET /controls/types - List control types
  fastify.get('/controls/types', async (request, reply) => {
    try {
      // Check if control_types table exists
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'control_types'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        // Return default control types if table doesn't exist
        return [
          { id: 'vgp', name: 'VGP - Vérification Générale Périodique', code: 'VGP' },
          { id: 'maintenance', name: 'Maintenance Préventive', code: 'MAINT' },
          { id: 'inspection', name: 'Inspection Visuelle', code: 'INSP' },
        ];
      }
      
      const res = await db.query('SELECT * FROM control_types ORDER BY name ASC');
      return res.rows;
    } catch (e) {
      console.error('Error fetching control types:', e);
      return [];
    }
  });

  // GET /controls/due-echeances - Get assets with upcoming control due dates
  fastify.get('/controls/due-echeances', async (request, reply) => {
    const { siteId, overdueOnly, dueSoonDays = 30 } = request.query as any;
    
    try {
      const now = new Date();
      const dueSoonDate = new Date();
      dueSoonDate.setDate(dueSoonDate.getDate() + parseInt(dueSoonDays));
      
      let query = `
        SELECT a.id, a.name, a.category, a.next_control_date, a.site_id,
               s.name as site_name,
               CASE 
                 WHEN a.next_control_date < NOW() THEN 'OVERDUE'
                 WHEN a.next_control_date <= $1 THEN 'DUE_SOON'
                 ELSE 'OK'
               END as status
        FROM assets a
        LEFT JOIN sites s ON a.site_id = s.id
        WHERE a.next_control_date IS NOT NULL
      `;
      
      const params: any[] = [dueSoonDate.toISOString()];
      
      if (overdueOnly === 'true' || overdueOnly === true) {
        query += ` AND a.next_control_date < NOW()`;
      }
      
      if (siteId) {
        params.push(siteId);
        query += ` AND a.site_id = $${params.length}`;
      }
      
      query += ` ORDER BY a.next_control_date ASC`;
      
      const res = await db.query(query, params);
      return res.rows;
    } catch (e) {
      console.error('Error fetching due echeances:', e);
      return [];
    }
  });

  // GET /controls - List all controls
  fastify.get('/controls', async (request, reply) => {
    const { assetId, status, limit = 50, offset = 0 } = request.query as any;
    
    try {
      // Check if controls table exists
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'controls'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        return [];
      }
      
      let query = 'SELECT * FROM controls';
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
      console.error('Error fetching controls:', e);
      return [];
    }
  });
}
