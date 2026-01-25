import { serve } from "@hono/node-server";

import app from "./hono";
import { ensurePgSchema } from "./db/postgres";
import { ensureVGPSchema } from "./db/vgp-schema";
import { seedVGPPressesTemplate, seedVGPDemoData } from "./db/vgp-seed";

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

console.log("[API] Starting Hono server", {
  host,
  port,
  nodeEnv: process.env.NODE_ENV,
  hasDatabaseHost: Boolean(process.env.DATABASE_HOST),
});

async function main() {
  try {
    await ensurePgSchema();
    
    // Initialize VGP schema and seed template
    await ensureVGPSchema();
    await seedVGPPressesTemplate();
    
    // Seed demo data in development only (commented out for now - may have infinite loop)
    // if (process.env.NODE_ENV !== 'production') {
    //   await seedVGPDemoData();
    // }
  } catch (e) {
    console.error('[API] Failed to ensure Postgres schema:', e);
  }

  serve(
    {
      fetch: app.fetch,
      port,
      hostname: host,
    },
    (info) => {
      console.log(`✅ Server running at http://${info.address}:${info.port}`);
    }
  );
}

main();
