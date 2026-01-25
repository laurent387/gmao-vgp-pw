import { createTRPCRouter, publicProcedure } from "../create-context";
import { pgQuery } from "../../db/postgres";

export const dashboardRouter = createTRPCRouter({
  kpis: publicProcedure.query(async () => {
    console.log("[DASHBOARD] Fetching KPIs from database");

    const totalAssetsResult = await pgQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM assets"
    );
    const totalAssets = parseInt(totalAssetsResult[0]?.count || "0", 10);

    const now = new Date().toISOString();
    const overdueResult = await pgQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM asset_controls WHERE next_due_at < $1",
      [now]
    );
    const overdueControls = parseInt(overdueResult[0]?.count || "0", 10);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dueSoonResult = await pgQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM asset_controls WHERE next_due_at >= $1 AND next_due_at <= $2",
      [now, thirtyDaysFromNow.toISOString()]
    );
    const dueSoon30Days = parseInt(dueSoonResult[0]?.count || "0", 10);

    const openNCsResult = await pgQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM nonconformities WHERE status IN ('OUVERTE', 'EN_COURS')"
    );
    const openNCs = parseInt(openNCsResult[0]?.count || "0", 10);

    const overdueActionsResult = await pgQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM corrective_actions WHERE status IN ('OUVERTE', 'EN_COURS') AND due_at < $1",
      [now]
    );
    const overdueActions = parseInt(overdueActionsResult[0]?.count || "0", 10);

    const pendingSyncResult = await pgQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM outbox WHERE status = 'PENDING'"
    );
    const pendingSyncItems = parseInt(pendingSyncResult[0]?.count || "0", 10);

    console.log("[DASHBOARD] KPIs:", { totalAssets, overdueControls, dueSoon30Days, openNCs, overdueActions, pendingSyncItems });

    return {
      totalAssets,
      overdueControls,
      dueSoon30Days,
      openNCs,
      overdueActions,
      pendingSyncItems,
    };
  }),

  recentActivity: publicProcedure.query(async () => {
    console.log("[DASHBOARD] Fetching recent activity from database");

    const reports = await pgQuery<{ id: string; asset_code: string; created_at: string }>(
      `SELECT r.id, a.code_interne as asset_code, r.created_at
       FROM reports r
       LEFT JOIN assets a ON r.asset_id = a.id
       ORDER BY r.created_at DESC
       LIMIT 5`
    );

    const ncs = await pgQuery<{ id: string; title: string; created_at: string }>(
      `SELECT id, title, created_at
       FROM nonconformities
       ORDER BY created_at DESC
       LIMIT 5`
    );

    const maintenance = await pgQuery<{ id: string; asset_code: string; date: string }>(
      `SELECT ml.id, a.code_interne as asset_code, ml.date
       FROM maintenance_logs ml
       LEFT JOIN assets a ON ml.asset_id = a.id
       ORDER BY ml.date DESC
       LIMIT 5`
    );

    const activities: { id: string; type: string; message: string; timestamp: string }[] = [];

    for (const r of reports) {
      activities.push({
        id: `report-${r.id}`,
        type: "report",
        message: `Rapport de contrôle créé pour ${r.asset_code || "équipement"}`,
        timestamp: r.created_at,
      });
    }

    for (const nc of ncs) {
      activities.push({
        id: `nc-${nc.id}`,
        type: "nc",
        message: `Non-conformité: ${nc.title}`,
        timestamp: nc.created_at,
      });
    }

    for (const m of maintenance) {
      activities.push({
        id: `maint-${m.id}`,
        type: "maintenance",
        message: `Maintenance effectuée sur ${m.asset_code || "équipement"}`,
        timestamp: m.date,
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 10);
  }),
});
