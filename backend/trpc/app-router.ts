import { createTRPCRouter } from "./create-context";
import { authRouter } from "./routes/auth";
import { sitesRouter } from "./routes/sites";
import { assetsRouter } from "./routes/assets";
import { missionsRouter } from "./routes/missions";
import { controlsRouter } from "./routes/controls";
import { reportsRouter } from "./routes/reports";
import { ncRouter } from "./routes/nonconformities";
import { maintenanceRouter } from "./routes/maintenance";
import { syncRouter } from "./routes/sync";
import { dashboardRouter } from "./routes/dashboard";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  sites: sitesRouter,
  assets: assetsRouter,
  missions: missionsRouter,
  controls: controlsRouter,
  reports: reportsRouter,
  nc: ncRouter,
  maintenance: maintenanceRouter,
  sync: syncRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
