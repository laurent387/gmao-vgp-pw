import { serve } from "@hono/node-server";

import app from "./hono";

const portEnv = process.env.PORT;
const port = portEnv ? Number(portEnv) : 3000;

console.log("[API] Starting Hono server", {
  port,
  nodeEnv: process.env.NODE_ENV,
  hasDatabaseHost: Boolean(process.env.DATABASE_HOST),
});

serve({
  fetch: app.fetch,
  port,
});

console.log(`[API] Listening on http://0.0.0.0:${port}`);
