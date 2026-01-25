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
import { adminRouter } from "./routes/admin";
import { vgpRouter } from "./routes/vgp";
import { attachmentsRouter } from "./routes/attachments";

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
  admin: adminRouter,
  vgp: vgpRouter,
  attachments: attachmentsRouter,
});

export type AppRouter = typeof appRouter;
