import { FastifyInstance } from 'fastify';
import { Client } from 'pg';

export async function dashboardRoutes(fastify: FastifyInstance, db: Client) {
  // KPIs principaux
  fastify.get('/dashboard/kpis', async (request, reply) => {
    // Nombre total d'assets
    const assetsRes = await db.query('SELECT COUNT(*) FROM assets');
    // Nombre de missions planifiées/terminées
    const missionsRes = await db.query("SELECT status, COUNT(*) FROM missions GROUP BY status");
    // Nombre de non-conformités ouvertes
    const ncRes = await db.query("SELECT status, COUNT(*) FROM nonconformities GROUP BY status");
    // Nombre de rapports
    const reportsRes = await db.query('SELECT COUNT(*) FROM reports');

    reply.send({
      assets: parseInt(assetsRes.rows[0].count, 10),
      missions: Object.fromEntries(missionsRes.rows.map(r => [r.status, parseInt(r.count, 10)])),
      nonconformities: Object.fromEntries(ncRes.rows.map(r => [r.status, parseInt(r.count, 10)])),
      reports: parseInt(reportsRes.rows[0].count, 10),
    });
  });

  // Activités récentes (rapports, non-conformités, maintenance)
  fastify.get('/dashboard/activities', async (request, reply) => {
    const reports = await db.query(
      `SELECT id, asset_id, created_at FROM reports ORDER BY created_at DESC LIMIT 5`
    );
    const ncs = await db.query(
      `SELECT id, title, created_at FROM nonconformities ORDER BY created_at DESC LIMIT 5`
    );
    const maintenance = await db.query(
      `SELECT ml.id, a.code_interne as asset_code, ml.date
       FROM maintenance_logs ml
       LEFT JOIN assets a ON ml.asset_id = a.id
       ORDER BY ml.date DESC
       LIMIT 5`
    );

    const activities = [
      ...reports.rows.map(r => ({
        id: `report-${r.id}`,
        type: 'report',
        message: `Rapport créé pour asset ${r.asset_id}`,
        timestamp: r.created_at,
      })),
      ...ncs.rows.map(nc => ({
        id: `nc-${nc.id}`,
        type: 'nc',
        message: `Non-conformité: ${nc.title}`,
        timestamp: nc.created_at,
      })),
      ...maintenance.rows.map(m => ({
        id: `maintenance-${m.id}`,
        type: 'maintenance',
        message: `Maintenance sur asset ${m.asset_code}`,
        timestamp: m.date,
      })),
    ];
    reply.send(activities);
  });
}
