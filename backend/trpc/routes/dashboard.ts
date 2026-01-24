import { createTRPCRouter, publicProcedure } from "../create-context";

export const dashboardRouter = createTRPCRouter({
  kpis: publicProcedure.query(async () => {
    return {
      totalAssets: 10,
      overdueControls: 2,
      dueSoon30Days: 3,
      openNCs: 2,
      overdueActions: 1,
      pendingSyncItems: 0,
    };
  }),

  recentActivity: publicProcedure.query(async () => {
    return [
      {
        id: "act-1",
        type: "report",
        message: "Rapport de contrôle créé pour CHAR-001",
        timestamp: "2024-02-01T14:30:00Z",
      },
      {
        id: "act-2",
        type: "nc",
        message: "Non-conformité ouverte sur GRUE-001",
        timestamp: "2024-02-01T16:00:00Z",
      },
      {
        id: "act-3",
        type: "maintenance",
        message: "Maintenance effectuée sur CHAR-001",
        timestamp: "2024-02-05T10:00:00Z",
      },
    ];
  }),
});
